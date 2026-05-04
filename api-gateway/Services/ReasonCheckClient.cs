using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace MoodLens.ApiGateway.Services;

public sealed class ReasonCheckResult
{
    public bool NeedsReason { get; init; }
    public bool ReasonProvided => !NeedsReason;
    public string FollowUpQuestion { get; init; } = string.Empty;
    public double? Confidence { get; init; }
    public string Provider { get; init; } = "heuristic";
}

public class ReasonCheckClient
{
    private static readonly HashSet<string> NegativeEmotions = new(StringComparer.OrdinalIgnoreCase)
    {
        "sad",
        "angry",
        "anxious",
        "tired",
        "stressed"
    };

    private static readonly string[] ReasonMarkers =
    {
        "because",
        "because of",
        "due to",
        "since",
        "after",
        "as a result",
        "neden",
        "nedenim",
        "sebep",
        "sebebi",
        "cunku",
        "yuzunden",
        "dolayi",
        "oldugu icin"
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _apiUrl;
    private readonly string? _apiKey;

    public ReasonCheckClient(IHttpClientFactory httpClientFactory, string? apiUrl, string? apiKey)
    {
        _httpClientFactory = httpClientFactory;
        _apiUrl = string.IsNullOrWhiteSpace(apiUrl) ? null : apiUrl.Trim();
        _apiKey = string.IsNullOrWhiteSpace(apiKey) ? null : apiKey.Trim();
    }

    public async Task<ReasonCheckResult> EvaluateAsync(string text, string emotion, string language)
    {
        if (!NegativeEmotions.Contains(emotion))
        {
            return BuildResult(
                needsReason: false,
                language: language,
                confidence: 1.0,
                provider: "bypass"
            );
        }

        if (string.IsNullOrWhiteSpace(_apiUrl))
        {
            return EvaluateHeuristically(text, language);
        }

        try
        {
            return await EvaluateExternallyAsync(text, emotion, language);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Reason check fallback warning: {ex.Message}");
            return EvaluateHeuristically(text, language);
        }
    }

    private async Task<ReasonCheckResult> EvaluateExternallyAsync(string text, string emotion, string language)
    {
        var client = _httpClientFactory.CreateClient("ReasonCheckService");
        using var request = new HttpRequestMessage(HttpMethod.Post, _apiUrl);

        if (!string.IsNullOrWhiteSpace(_apiKey))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        request.Content = new StringContent(
            JsonSerializer.Serialize(new
            {
                text,
                emotion,
                language
            }),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Reason check service returned {(int)response.StatusCode}: {response.ReasonPhrase}"
            );
        }

        var json = JsonSerializer.Deserialize<JsonElement>(responseBody);
        var needsReason = GetBoolean(json, "needsReason")
            ?? GetBoolean(json, "needs_reason")
            ?? (GetBoolean(json, "reasonProvided") is bool reasonProvided
                ? !reasonProvided
                : GetBoolean(json, "reason_provided") is bool snakeReasonProvided
                    ? !snakeReasonProvided
                    : (bool?)null)
            ?? EvaluateHeuristically(text, language).NeedsReason;

        var followUpQuestion = GetString(json, "followUpQuestion")
            ?? GetString(json, "follow_up_question")
            ?? DefaultFollowUpQuestion(language);

        var confidence = GetDouble(json, "confidence");

        return BuildResult(
            needsReason,
            language,
            confidence,
            "external",
            followUpQuestion
        );
    }

    private static ReasonCheckResult EvaluateHeuristically(string text, string language)
    {
        var cleaned = (text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleaned))
        {
            return BuildResult(
                needsReason: true,
                language: language,
                confidence: 0.25,
                provider: "heuristic"
            );
        }

        var normalized = cleaned.ToLowerInvariant();
        var hasReasonMarker = ReasonMarkers.Any(marker => normalized.Contains(marker, StringComparison.Ordinal));
        var wordCount = Regex.Matches(cleaned, @"[\p{L}']+").Count;
        var looksDetailed = wordCount >= 12;
        var needsReason = !(hasReasonMarker || looksDetailed);

        return BuildResult(
            needsReason,
            language,
            needsReason ? 0.55 : 0.72,
            "heuristic"
        );
    }

    private static ReasonCheckResult BuildResult(
        bool needsReason,
        string language,
        double? confidence,
        string provider,
        string? followUpQuestion = null
    )
    {
        return new ReasonCheckResult
        {
            NeedsReason = needsReason,
            Confidence = confidence,
            Provider = provider,
            FollowUpQuestion = needsReason
                ? (followUpQuestion ?? DefaultFollowUpQuestion(language))
                : string.Empty
        };
    }

    private static string DefaultFollowUpQuestion(string language)
    {
        return (language ?? "en").Trim().ToLowerInvariant().StartsWith("tr")
            ? "Bu duygunun sebebini biraz daha acabilir misin?"
            : "Can you share a bit more about what is causing this feeling?";
    }

    private static bool? GetBoolean(JsonElement json, string propertyName)
    {
        if (!json.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.String when bool.TryParse(property.GetString(), out var parsed) => parsed,
            _ => null
        };
    }

    private static double? GetDouble(JsonElement json, string propertyName)
    {
        if (!json.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind switch
        {
            JsonValueKind.Number when property.TryGetDouble(out var number) => number,
            JsonValueKind.String when double.TryParse(property.GetString(), out var parsed) => parsed,
            _ => null
        };
    }

    private static string? GetString(JsonElement json, string propertyName)
    {
        if (!json.TryGetProperty(propertyName, out var property) ||
            property.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return property.GetString();
    }
}
