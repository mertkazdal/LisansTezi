using System.Text;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;

namespace MoodLens.ApiGateway.Services;

public sealed class AnalyticsCountItem
{
    public string Key { get; set; } = string.Empty;
    public int Count { get; set; }
}

public sealed class AnalyticsAverageItem
{
    public string Key { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Average { get; set; }
}

public sealed class AnalyticsSegmentSummaryItem
{
    public string Key { get; set; } = string.Empty;
    public int Count { get; set; }
    public double AverageOverallRating { get; set; }
    public double AverageAnalysisAccuracyRating { get; set; }
    public double AverageRecommendationQualityRating { get; set; }
    public double HelpfulRate { get; set; }
    public double WouldReuseRate { get; set; }
}

public sealed class AnalyticsTimelinePoint
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

public sealed class AnalyticsFeedbackTimelinePoint
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
    public double AverageOverallRating { get; set; }
}

public sealed class AnalyticsFeedbackDetail
{
    public DateTime CreatedAt { get; set; }
    public string DetectedEmotion { get; set; } = string.Empty;
    public bool FaceDetected { get; set; }
    public int? ResponseTimeMs { get; set; }
    public string Audience { get; set; } = string.Empty;
    public int OverallRating { get; set; }
    public int AnalysisAccuracyRating { get; set; }
    public int RecommendationQualityRating { get; set; }
    public bool Helpful { get; set; }
    public bool WouldReuse { get; set; }
}

public sealed class AnalyticsResponseSample
{
    public DateTime CreatedAt { get; set; }
    public int ResponseTimeMs { get; set; }
    public string Emotion { get; set; } = string.Empty;
}

public sealed class AnalyticsRecentAnalysis
{
    public Guid Id { get; set; }
    public string Emotion { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public DateTime CreatedAt { get; set; }
    public string ModalityUsed { get; set; } = "multimodal";
    public string ModelUsed { get; set; } = "gemini-multimodal";
    public bool FaceDetected { get; set; }
    public bool IsGuest { get; set; }
}

public sealed class AnalyticsSnapshot
{
    public int TotalAnalyses { get; set; }
    public int GuestAnalyses { get; set; }
    public int RegisteredAnalyses { get; set; }
    public int RegisteredUsers { get; set; }
    public int GuestSessions { get; set; }
    public int HistoriesWithRecommendations { get; set; }
    public int TotalFeedbackResponses { get; set; }
    public double RecommendationCoverageRate { get; set; }
    public double AverageConfidence { get; set; }
    public double AverageResponseTimeMs { get; set; }
    public double FaceDetectedRate { get; set; }
    public double AverageOverallRating { get; set; }
    public double AverageAnalysisAccuracyRating { get; set; }
    public double AverageRecommendationQualityRating { get; set; }
    public double HelpfulRate { get; set; }
    public double WouldReuseRate { get; set; }
    public List<AnalyticsCountItem> EmotionDistribution { get; set; } = new();
    public List<AnalyticsCountItem> TopEmotions { get; set; } = new();
    public List<AnalyticsCountItem> ModelDistribution { get; set; } = new();
    public List<AnalyticsCountItem> ModalityDistribution { get; set; } = new();
    public List<AnalyticsCountItem> RatingDistribution { get; set; } = new();
    public List<AnalyticsAverageItem> FeedbackByEmotion { get; set; } = new();
    public List<AnalyticsSegmentSummaryItem> FeedbackByAudience { get; set; } = new();
    public List<AnalyticsSegmentSummaryItem> FeedbackByFaceDetection { get; set; } = new();
    public List<AnalyticsSegmentSummaryItem> FeedbackByResponseSpeed { get; set; } = new();
    public List<AnalyticsTimelinePoint> DailyActivity { get; set; } = new();
    public List<AnalyticsFeedbackTimelinePoint> FeedbackTimeline { get; set; } = new();
    public List<AnalyticsResponseSample> ResponseSamples { get; set; } = new();
    public List<AnalyticsRecentAnalysis> RecentAnalyses { get; set; } = new();
}

public class AnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AnalyticsSnapshot> BuildSnapshotAsync(int recentSampleLimit = 20, int recentDays = 7)
    {
        var totalAnalyses = await _db.EmotionHistories.AsNoTracking().CountAsync();
        var guestAnalyses = await _db.EmotionHistories.AsNoTracking().CountAsync(h => h.UserId == null);
        var registeredUsers = await _db.Users.AsNoTracking().CountAsync();
        var guestSessions = await _db.EmotionHistories.AsNoTracking()
            .Where(h => h.UserId == null && h.GuestSessionId != null && h.GuestSessionId != string.Empty)
            .Select(h => h.GuestSessionId!)
            .Distinct()
            .CountAsync();
        var historiesWithRecommendations = await _db.Recommendations.AsNoTracking()
            .Select(r => r.HistoryId)
            .Distinct()
            .CountAsync();
        var feedbackCount = await _db.AnalysisFeedback.AsNoTracking().CountAsync();

        var confidenceValues = await _db.EmotionHistories.AsNoTracking()
            .Select(h => h.Confidence)
            .ToListAsync();
        var responseValues = await _db.EmotionHistories.AsNoTracking()
            .Where(h => h.ResponseTimeMs.HasValue)
            .Select(h => h.ResponseTimeMs!.Value)
            .ToListAsync();
        var faceDetectedCount = await _db.EmotionHistories.AsNoTracking()
            .CountAsync(h => h.FaceDetected);

        var emotionDistribution = await _db.EmotionHistories.AsNoTracking()
            .GroupBy(h => h.DetectedEmotion)
            .Select(group => new AnalyticsCountItem
            {
                Key = group.Key,
                Count = group.Count()
            })
            .OrderByDescending(item => item.Count)
            .ToListAsync();
        var topEmotions = emotionDistribution.Take(8).ToList();

        var modelDistribution = await _db.EmotionHistories.AsNoTracking()
            .GroupBy(h => h.ModelUsed)
            .Select(group => new AnalyticsCountItem
            {
                Key = group.Key,
                Count = group.Count()
            })
            .OrderByDescending(item => item.Count)
            .ToListAsync();

        var modalityDistribution = await _db.EmotionHistories.AsNoTracking()
            .GroupBy(h => h.ModalityUsed)
            .Select(group => new AnalyticsCountItem
            {
                Key = group.Key,
                Count = group.Count()
            })
            .OrderByDescending(item => item.Count)
            .ToListAsync();

        var feedbackRows = await _db.AnalysisFeedback.AsNoTracking()
            .Select(item => new
            {
                item.OverallRating,
                item.AnalysisAccuracyRating,
                item.RecommendationQualityRating,
                item.Helpful,
                item.WouldReuse
            })
            .ToListAsync();

        var ratingDistribution = feedbackRows
            .GroupBy(item => item.OverallRating)
            .Select(group => new AnalyticsCountItem
            {
                Key = group.Key.ToString(),
                Count = group.Count()
            })
            .OrderBy(item => item.Key)
            .ToList();

        var feedbackDetails = await _db.AnalysisFeedback.AsNoTracking()
            .Join(
                _db.EmotionHistories.AsNoTracking(),
                feedback => feedback.HistoryId,
                history => history.Id,
                (feedback, history) => new AnalyticsFeedbackDetail
                {
                    CreatedAt = history.CreatedAt,
                    DetectedEmotion = history.DetectedEmotion,
                    FaceDetected = history.FaceDetected,
                    ResponseTimeMs = history.ResponseTimeMs,
                    Audience = history.UserId == null ? "guest" : "registered",
                    OverallRating = feedback.OverallRating,
                    AnalysisAccuracyRating = feedback.AnalysisAccuracyRating,
                    RecommendationQualityRating = feedback.RecommendationQualityRating,
                    Helpful = feedback.Helpful,
                    WouldReuse = feedback.WouldReuse
                }
            )
            .ToListAsync();

        var feedbackByEmotion = feedbackDetails
            .GroupBy(item => item.DetectedEmotion)
            .Select(item => new AnalyticsAverageItem
            {
                Key = item.Key,
                Count = item.Count(),
                Average = Math.Round(item.Average(detail => detail.OverallRating), 2)
            })
            .OrderByDescending(item => item.Average)
            .ThenByDescending(item => item.Count)
            .ToList();

        var feedbackByAudience = BuildSegmentSummaries(feedbackDetails, item => item.Audience);
        var feedbackByFaceDetection = BuildSegmentSummaries(
            feedbackDetails,
            item => item.FaceDetected ? "face_detected" : "face_not_detected");
        var feedbackByResponseSpeed = BuildSegmentSummaries(
            feedbackDetails,
            item => GetResponseSpeedBucket(item.ResponseTimeMs))
            .OrderBy(item => GetResponseSpeedBucketOrder(item.Key))
            .ToList();

        var cutoffDate = DateTime.UtcNow.Date.AddDays(-(Math.Max(recentDays, 1) - 1));
        var recentActivityRows = await _db.EmotionHistories.AsNoTracking()
            .Where(h => h.CreatedAt >= cutoffDate)
            .Select(h => h.CreatedAt)
            .ToListAsync();

        var activityLookup = recentActivityRows
            .GroupBy(value => value.Date)
            .ToDictionary(group => group.Key, group => group.Count());

        var dailyActivity = Enumerable.Range(0, Math.Max(recentDays, 1))
            .Select(offset => cutoffDate.AddDays(offset))
            .Select(day => new AnalyticsTimelinePoint
            {
                Date = day,
                Count = activityLookup.TryGetValue(day, out var count) ? count : 0
            })
            .ToList();

        var feedbackTimelineLookup = feedbackDetails
            .Where(item => item.CreatedAt >= cutoffDate)
            .GroupBy(item => item.CreatedAt.Date)
            .ToDictionary(
                group => group.Key,
                group => new
                {
                    Count = group.Count(),
                    AverageOverallRating = Math.Round(group.Average(item => item.OverallRating), 2)
                });

        var feedbackTimeline = Enumerable.Range(0, Math.Max(recentDays, 1))
            .Select(offset => cutoffDate.AddDays(offset))
            .Select(day =>
            {
                var feedbackPoint = feedbackTimelineLookup.TryGetValue(day, out var item)
                    ? item
                    : null;

                return new AnalyticsFeedbackTimelinePoint
                {
                    Date = day,
                    Count = feedbackPoint?.Count ?? 0,
                    AverageOverallRating = feedbackPoint?.AverageOverallRating ?? 0
                };
            })
            .ToList();

        var responseSamples = await _db.EmotionHistories.AsNoTracking()
            .Where(h => h.ResponseTimeMs.HasValue)
            .OrderByDescending(h => h.CreatedAt)
            .Take(Math.Max(recentSampleLimit, 1))
            .Select(h => new AnalyticsResponseSample
            {
                CreatedAt = h.CreatedAt,
                ResponseTimeMs = h.ResponseTimeMs!.Value,
                Emotion = h.DetectedEmotion
            })
            .ToListAsync();
        responseSamples.Reverse();

        var recentAnalyses = await _db.EmotionHistories.AsNoTracking()
            .OrderByDescending(h => h.CreatedAt)
            .Take(8)
            .Select(h => new AnalyticsRecentAnalysis
            {
                Id = h.Id,
                Emotion = h.DetectedEmotion,
                Confidence = h.Confidence,
                CreatedAt = h.CreatedAt,
                ModalityUsed = h.ModalityUsed,
                ModelUsed = h.ModelUsed,
                FaceDetected = h.FaceDetected,
                IsGuest = h.UserId == null
            })
            .ToListAsync();

        return new AnalyticsSnapshot
        {
            TotalAnalyses = totalAnalyses,
            GuestAnalyses = guestAnalyses,
            RegisteredAnalyses = totalAnalyses - guestAnalyses,
            RegisteredUsers = registeredUsers,
            GuestSessions = guestSessions,
            HistoriesWithRecommendations = historiesWithRecommendations,
            TotalFeedbackResponses = feedbackCount,
            RecommendationCoverageRate = totalAnalyses == 0
                ? 0
                : Math.Round(100.0 * historiesWithRecommendations / totalAnalyses, 1),
            AverageConfidence = confidenceValues.Count == 0
                ? 0
                : Math.Round(confidenceValues.Average(), 3),
            AverageResponseTimeMs = responseValues.Count == 0
                ? 0
                : Math.Round(responseValues.Average(), 1),
            FaceDetectedRate = totalAnalyses == 0
                ? 0
                : Math.Round(100.0 * faceDetectedCount / totalAnalyses, 1),
            AverageOverallRating = feedbackRows.Count == 0
                ? 0
                : Math.Round(feedbackRows.Average(item => item.OverallRating), 2),
            AverageAnalysisAccuracyRating = feedbackRows.Count == 0
                ? 0
                : Math.Round(feedbackRows.Average(item => item.AnalysisAccuracyRating), 2),
            AverageRecommendationQualityRating = feedbackRows.Count == 0
                ? 0
                : Math.Round(feedbackRows.Average(item => item.RecommendationQualityRating), 2),
            HelpfulRate = feedbackRows.Count == 0
                ? 0
                : Math.Round(100.0 * feedbackRows.Count(item => item.Helpful) / feedbackRows.Count, 1),
            WouldReuseRate = feedbackRows.Count == 0
                ? 0
                : Math.Round(100.0 * feedbackRows.Count(item => item.WouldReuse) / feedbackRows.Count, 1),
            EmotionDistribution = emotionDistribution,
            TopEmotions = topEmotions,
            ModelDistribution = modelDistribution,
            ModalityDistribution = modalityDistribution,
            RatingDistribution = ratingDistribution,
            FeedbackByEmotion = feedbackByEmotion,
            FeedbackByAudience = feedbackByAudience,
            FeedbackByFaceDetection = feedbackByFaceDetection,
            FeedbackByResponseSpeed = feedbackByResponseSpeed,
            DailyActivity = dailyActivity,
            FeedbackTimeline = feedbackTimeline,
            ResponseSamples = responseSamples,
            RecentAnalyses = recentAnalyses
        };
    }

    public string BuildCsv(AnalyticsSnapshot snapshot)
    {
        var builder = new StringBuilder();
        builder.AppendLine("section,key,value");
        builder.AppendLine($"summary,total_analyses,{snapshot.TotalAnalyses}");
        builder.AppendLine($"summary,guest_analyses,{snapshot.GuestAnalyses}");
        builder.AppendLine($"summary,registered_analyses,{snapshot.RegisteredAnalyses}");
        builder.AppendLine($"summary,registered_users,{snapshot.RegisteredUsers}");
        builder.AppendLine($"summary,guest_sessions,{snapshot.GuestSessions}");
        builder.AppendLine($"summary,recommendation_coverage_rate,{snapshot.RecommendationCoverageRate}");
        builder.AppendLine($"summary,average_confidence,{snapshot.AverageConfidence}");
        builder.AppendLine($"summary,average_response_time_ms,{snapshot.AverageResponseTimeMs}");
        builder.AppendLine($"summary,face_detected_rate,{snapshot.FaceDetectedRate}");
        builder.AppendLine($"summary,total_feedback_responses,{snapshot.TotalFeedbackResponses}");
        builder.AppendLine($"summary,average_overall_rating,{snapshot.AverageOverallRating}");
        builder.AppendLine($"summary,average_analysis_accuracy_rating,{snapshot.AverageAnalysisAccuracyRating}");
        builder.AppendLine($"summary,average_recommendation_quality_rating,{snapshot.AverageRecommendationQualityRating}");
        builder.AppendLine($"summary,helpful_rate,{snapshot.HelpfulRate}");
        builder.AppendLine($"summary,would_reuse_rate,{snapshot.WouldReuseRate}");

        foreach (var emotion in snapshot.TopEmotions)
        {
            builder.AppendLine($"top_emotions,{Escape(emotion.Key)},{emotion.Count}");
        }

        foreach (var activity in snapshot.DailyActivity)
        {
            builder.AppendLine($"daily_activity,{activity.Date:yyyy-MM-dd},{activity.Count}");
        }

        foreach (var item in snapshot.RatingDistribution)
        {
            builder.AppendLine($"rating_distribution,{Escape(item.Key)},{item.Count}");
        }

        foreach (var item in snapshot.FeedbackByEmotion)
        {
            builder.AppendLine($"feedback_by_emotion,{Escape(item.Key)},{item.Average}");
        }

        foreach (var item in snapshot.FeedbackByAudience)
        {
            builder.AppendLine($"feedback_by_audience,{Escape(item.Key)},{item.AverageOverallRating}");
        }

        foreach (var item in snapshot.FeedbackByFaceDetection)
        {
            builder.AppendLine($"feedback_by_face_detection,{Escape(item.Key)},{item.AverageOverallRating}");
        }

        foreach (var item in snapshot.FeedbackByResponseSpeed)
        {
            builder.AppendLine($"feedback_by_response_speed,{Escape(item.Key)},{item.AverageOverallRating}");
        }

        foreach (var item in snapshot.FeedbackTimeline)
        {
            builder.AppendLine($"feedback_timeline,{item.Date:yyyy-MM-dd},{item.AverageOverallRating}");
        }

        return builder.ToString();
    }

    private static List<AnalyticsSegmentSummaryItem> BuildSegmentSummaries(
        IEnumerable<AnalyticsFeedbackDetail> items,
        Func<AnalyticsFeedbackDetail, string> keySelector)
    {
        return items
            .GroupBy(keySelector)
            .Select(group => new AnalyticsSegmentSummaryItem
            {
                Key = group.Key,
                Count = group.Count(),
                AverageOverallRating = Math.Round(group.Average(item => item.OverallRating), 2),
                AverageAnalysisAccuracyRating = Math.Round(group.Average(item => item.AnalysisAccuracyRating), 2),
                AverageRecommendationQualityRating = Math.Round(group.Average(item => item.RecommendationQualityRating), 2),
                HelpfulRate = Math.Round(100.0 * group.Count(item => item.Helpful) / group.Count(), 1),
                WouldReuseRate = Math.Round(100.0 * group.Count(item => item.WouldReuse) / group.Count(), 1)
            })
            .OrderByDescending(item => item.AverageOverallRating)
            .ThenByDescending(item => item.Count)
            .ToList();
    }

    private static int GetResponseSpeedBucketOrder(string key)
    {
        return key switch
        {
            "fast" => 0,
            "steady" => 1,
            "deep" => 2,
            _ => 3
        };
    }

    private static string GetResponseSpeedBucket(int? responseTimeMs)
    {
        if (!responseTimeMs.HasValue || responseTimeMs.Value <= 4000)
        {
            return "fast";
        }

        if (responseTimeMs.Value <= 8000)
        {
            return "steady";
        }

        return "deep";
    }

    private static string Escape(string? value)
    {
        var normalized = (value ?? string.Empty).Replace("\"", "\"\"");
        return normalized.Contains(',') ? $"\"{normalized}\"" : normalized;
    }
}
