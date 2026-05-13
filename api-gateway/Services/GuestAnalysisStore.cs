using System.Collections.Concurrent;
using System.Text.Json;
using MoodLens.ApiGateway.DTOs;

namespace MoodLens.ApiGateway.Services;

public sealed record GuestRecommendationBundle(
    string MusicJson,
    string MovieJson,
    string BookJson,
    string AdviceJson
)
{
    public static GuestRecommendationBundle Empty { get; } = new("[]", "[]", "[]", "[]");

    public static GuestRecommendationBundle FromJsonElement(JsonElement? recommendations)
    {
        if (recommendations is not { } value)
        {
            return Empty;
        }

        return new GuestRecommendationBundle(
            ReadCategory(value, "music"),
            ReadCategory(value, "movies"),
            ReadCategory(value, "books"),
            ReadCategory(value, "lifeAdvice")
        );
    }

    public object Music => DeserializeCategory(MusicJson);
    public object Movies => DeserializeCategory(MovieJson);
    public object Books => DeserializeCategory(BookJson);
    public object LifeAdvice => DeserializeCategory(AdviceJson);

    private static string ReadCategory(JsonElement recommendations, string propertyName)
    {
        return recommendations.TryGetProperty(propertyName, out var categoryData)
            ? categoryData.GetRawText()
            : "[]";
    }

    private static object DeserializeCategory(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<object>(json) ?? Array.Empty<object>();
        }
        catch (JsonException)
        {
            return Array.Empty<object>();
        }
    }
}

public sealed record GuestAnalysisRecord(
    Guid HistoryId,
    string ActorKey,
    string? GuestSessionId,
    string Emotion,
    double Confidence,
    string Explanation,
    string? Warning,
    string ModalityUsed,
    string ModelUsed,
    int? ResponseTimeMs,
    bool FaceDetected,
    DateTime CreatedAt,
    GuestRecommendationBundle Recommendations,
    FeedbackResponse? Feedback,
    DateTimeOffset ExpiresAt
);

public class GuestAnalysisStore
{
    private static readonly TimeSpan ResultTtl = TimeSpan.FromMinutes(45);
    private static readonly TimeSpan UsageTtl = TimeSpan.FromHours(12);
    private readonly ConcurrentDictionary<Guid, GuestAnalysisRecord> _records = new();
    private readonly ConcurrentDictionary<string, GuestUsageState> _usage = new();
    private long _lastCleanupTicks;

    public int GetCompletedAnalysisCount(string actorKey)
    {
        CleanupExpiredEntries();
        return _usage.TryGetValue(actorKey, out var state) && state.ExpiresAt > DateTimeOffset.UtcNow
            ? state.Count
            : 0;
    }

    public int RegisterCompletedAnalysis(string actorKey)
    {
        CleanupExpiredEntries();
        var state = _usage.AddOrUpdate(
            actorKey,
            _ => new GuestUsageState(1, DateTimeOffset.UtcNow.Add(UsageTtl)),
            (_, existing) =>
            {
                var currentCount = existing.ExpiresAt <= DateTimeOffset.UtcNow ? 0 : existing.Count;
                return new GuestUsageState(currentCount + 1, DateTimeOffset.UtcNow.Add(UsageTtl));
            });

        return state.Count;
    }

    public void Save(GuestAnalysisRecord record)
    {
        CleanupExpiredEntries();
        _records[record.HistoryId] = record;
    }

    public bool TryGet(Guid historyId, string actorKey, string? guestSessionId, out GuestAnalysisRecord? record)
    {
        CleanupExpiredEntries();
        record = null;

        if (!_records.TryGetValue(historyId, out var candidate))
        {
            return false;
        }

        if (candidate.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            _records.TryRemove(historyId, out _);
            return false;
        }

        if (!string.Equals(candidate.ActorKey, actorKey, StringComparison.Ordinal) ||
            !string.Equals(candidate.GuestSessionId, NormalizeSession(guestSessionId), StringComparison.Ordinal))
        {
            return false;
        }

        record = candidate;
        return true;
    }

    public bool TryGetFeedback(Guid historyId, string actorKey, string? guestSessionId, out FeedbackResponse? feedback)
    {
        feedback = null;
        if (!TryGet(historyId, actorKey, guestSessionId, out var record) || record?.Feedback == null)
        {
            return false;
        }

        feedback = record.Feedback;
        return true;
    }

    public bool TryUpsertFeedback(
        Guid historyId,
        string actorKey,
        string? guestSessionId,
        FeedbackRequest request,
        out FeedbackResponse? feedback
    )
    {
        feedback = null;
        var normalizedSession = NormalizeSession(guestSessionId);

        while (true)
        {
            if (!TryGet(historyId, actorKey, normalizedSession, out var current) || current == null)
            {
                return false;
            }

            var nextFeedback = new FeedbackResponse
            {
                Id = current.Feedback?.Id ?? Guid.NewGuid(),
                HistoryId = historyId,
                OverallRating = request.OverallRating,
                AnalysisAccuracyRating = request.AnalysisAccuracyRating,
                RecommendationQualityRating = request.RecommendationQualityRating,
                Helpful = request.Helpful,
                WouldReuse = request.WouldReuse,
                Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            var next = current with { Feedback = nextFeedback };

            if (_records.TryUpdate(historyId, next, current))
            {
                feedback = nextFeedback;
                return true;
            }
        }
    }

    public GuestAnalysisRecord CreateRecord(
        Guid historyId,
        string actorKey,
        string? guestSessionId,
        string emotion,
        double confidence,
        string explanation,
        string? warning,
        string modalityUsed,
        string modelUsed,
        int? responseTimeMs,
        bool faceDetected,
        GuestRecommendationBundle recommendations
    )
    {
        return new GuestAnalysisRecord(
            historyId,
            actorKey,
            NormalizeSession(guestSessionId),
            emotion,
            confidence,
            explanation,
            warning,
            modalityUsed,
            modelUsed,
            responseTimeMs,
            faceDetected,
            DateTime.UtcNow,
            recommendations,
            null,
            DateTimeOffset.UtcNow.Add(ResultTtl)
        );
    }

    private void CleanupExpiredEntries()
    {
        var now = DateTimeOffset.UtcNow;
        var lastCleanup = new DateTimeOffset(Interlocked.Read(ref _lastCleanupTicks), TimeSpan.Zero);
        if (now - lastCleanup < TimeSpan.FromMinutes(5))
        {
            return;
        }

        Interlocked.Exchange(ref _lastCleanupTicks, now.UtcTicks);

        foreach (var (id, record) in _records)
        {
            if (record.ExpiresAt <= now)
            {
                _records.TryRemove(id, out _);
            }
        }

        foreach (var (key, state) in _usage)
        {
            if (state.ExpiresAt <= now)
            {
                _usage.TryRemove(key, out _);
            }
        }
    }

    private static string? NormalizeSession(string? guestSessionId)
    {
        var normalized = guestSessionId?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private sealed record GuestUsageState(int Count, DateTimeOffset ExpiresAt);
}
