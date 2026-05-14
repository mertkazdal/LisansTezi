using System.Text;
using System.Text.Json;

namespace MoodLens.ApiGateway.Services;

public class AiServiceException : Exception
{
    public int StatusCode { get; }
    public string? ErrorCode { get; }
    public int? RetryAfterSeconds { get; }

    public AiServiceException(string message, int statusCode, string? errorCode = null, int? retryAfterSeconds = null)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        RetryAfterSeconds = retryAfterSeconds;
    }
}

public class AiServiceClient
{
    private readonly IHttpClientFactory _httpClientFactory;

    public AiServiceClient(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public Task<JsonElement> AnalyzeEmotionAsync(
        string? imageBase64,
        string? text,
        string? mimeType,
        string language,
        string? analysisKeyEnv = null,
        Guid? userId = null,
        string? personalityJson = null
    )
    {
        return PostAsync("/analyze", new
        {
            image_base64 = imageBase64,
            text,
            mime_type = mimeType,
            language,
            analysis_key_env = analysisKeyEnv,
            user_id = userId?.ToString(),
            personality_json = personalityJson
        });
    }

    public Task<JsonElement> GetRecommendationsAsync(
        string emotion,
        string? context,
        string language,
        bool preferFollowUpKey = false,
        string? personalityJson = null,
        string? ageGroup = null,
        double? confidence = null,
        string? analysisText = null,
        Guid? userId = null,
        IReadOnlyCollection<string>? surveyMovieGenres = null,
        IReadOnlyCollection<int>? excludedMovieIds = null
    )
    {
        return PostAsync("/recommendations", new
        {
            emotion,
            context,
            language,
            prefer_followup_key = preferFollowUpKey,
            personality_json = personalityJson,
            age_group = ageGroup,
            confidence,
            analysis_text = string.IsNullOrWhiteSpace(analysisText)
                ? null
                : analysisText.Trim()[..Math.Min(100, analysisText.Trim().Length)],
            user_id = userId?.ToString(),
            survey_movie_genres = surveyMovieGenres ?? Array.Empty<string>(),
            excluded_movie_ids = excludedMovieIds ?? Array.Empty<int>()
        });
    }

    public Task<JsonElement> ValidateImageAsync(string imageBase64, string? mimeType, string language)
    {
        return PostAsync("/api/validate-image", new
        {
            image_base64 = imageBase64,
            mime_type = mimeType,
            language
        });
    }

    public Task<JsonElement> GetSurveyQuestionsAsync(string language)
    {
        var normalizedLanguage = string.IsNullOrWhiteSpace(language) ? "tr" : Uri.EscapeDataString(language);
        return GetAsync($"/survey/questions?language={normalizedLanguage}");
    }

    public Task<JsonElement> DetectPersonalityAsync(Dictionary<int, int> answers, string language)
    {
        return PostAsync("/personality/detect", new
        {
            answers,
            language
        });
    }

    public Task<JsonElement> UpdatePersonalityAsync(
        object? currentPersonality,
        string? lastUpdated,
        object? spotifySummary,
        object? recentContent,
        string language
    )
    {
        return PostAsync("/personality/update", new
        {
            current_personality = currentPersonality,
            last_updated = lastUpdated,
            spotify_summary = spotifySummary,
            recent_content = recentContent,
            language
        });
    }

    public Task<JsonElement> GenerateAvatarAsync(
        string bigFiveJson,
        string? mbtiType,
        string dominantEmotion
    )
    {
        object? bigFive = null;
        try
        {
            bigFive = JsonSerializer.Deserialize<object>(bigFiveJson);
        }
        catch (JsonException)
        {
            bigFive = null;
        }

        return PostAsync("/api/profile/generate-avatar", new
        {
            big_five = bigFive,
            mbti_type = mbtiType,
            dominant_emotion = dominantEmotion
        });
    }

    private async Task<JsonElement> GetAsync(string endpoint)
    {
        var client = _httpClientFactory.CreateClient("AiService");

        HttpResponseMessage response;
        string responseBody;

        try
        {
            response = await client.GetAsync(endpoint);
            responseBody = await response.Content.ReadAsStringAsync();
        }
        catch (TaskCanceledException ex) when (!ex.CancellationToken.IsCancellationRequested)
        {
            throw new AiServiceException(
                "AI service timed out. Please try again.",
                504,
                "AI_TIMEOUT"
            );
        }

        if (!response.IsSuccessStatusCode)
        {
            var error = ExtractError(responseBody, response.ReasonPhrase);
            throw new AiServiceException(
                error.Message,
                (int)response.StatusCode,
                error.Code,
                error.RetryAfterSeconds
            );
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(responseBody);
        }
        catch (JsonException)
        {
            throw new AiServiceException("AI service returned an invalid JSON response.", 502);
        }
    }

    private async Task<JsonElement> PostAsync(string endpoint, object payload)
    {
        var client = _httpClientFactory.CreateClient("AiService");
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        string responseBody;

        try
        {
            response = await client.PostAsync(endpoint, content);
            responseBody = await response.Content.ReadAsStringAsync();
        }
        catch (TaskCanceledException ex) when (!ex.CancellationToken.IsCancellationRequested)
        {
            throw new AiServiceException(
                "AI service timed out. Please try again.",
                504,
                "AI_TIMEOUT"
            );
        }

        if (!response.IsSuccessStatusCode)
        {
            var error = ExtractError(responseBody, response.ReasonPhrase);
            throw new AiServiceException(
                error.Message,
                (int)response.StatusCode,
                error.Code,
                error.RetryAfterSeconds
            );
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(responseBody);
        }
        catch (JsonException)
        {
            throw new AiServiceException("AI service returned an invalid JSON response.", 502);
        }
    }

    private static (string Message, string? Code, int? RetryAfterSeconds) ExtractError(string responseBody, string? fallback)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return (fallback ?? "AI service request failed.", null, null);
        }

        try
        {
            var json = JsonSerializer.Deserialize<JsonElement>(responseBody);
            if (json.ValueKind == JsonValueKind.Object)
            {
                string? code = null;
                int? retryAfterSeconds = null;
                if (json.TryGetProperty("code", out var codeProperty) &&
                    codeProperty.ValueKind == JsonValueKind.String)
                {
                    code = codeProperty.GetString();
                }

                if (json.TryGetProperty("retryAfterSeconds", out var retryAfterProperty) &&
                    retryAfterProperty.ValueKind == JsonValueKind.Number &&
                    retryAfterProperty.TryGetInt32(out var retryAfterValue))
                {
                    retryAfterSeconds = retryAfterValue;
                }

                if (json.TryGetProperty("message", out var message) &&
                    message.ValueKind == JsonValueKind.String)
                {
                    return (message.GetString() ?? fallback ?? "AI service request failed.", code, retryAfterSeconds);
                }

                if (json.TryGetProperty("detail", out var detail))
                {
                    if (detail.ValueKind == JsonValueKind.Object)
                    {
                        if (detail.TryGetProperty("code", out var nestedCode) &&
                            nestedCode.ValueKind == JsonValueKind.String)
                        {
                            code = nestedCode.GetString();
                        }

                        if (detail.TryGetProperty("message", out var nestedMessage) &&
                            nestedMessage.ValueKind == JsonValueKind.String)
                        {
                            if (detail.TryGetProperty("retryAfterSeconds", out var nestedRetryAfter) &&
                                nestedRetryAfter.ValueKind == JsonValueKind.Number &&
                                nestedRetryAfter.TryGetInt32(out var nestedRetryAfterValue))
                            {
                                retryAfterSeconds = nestedRetryAfterValue;
                            }

                            return (nestedMessage.GetString() ?? fallback ?? "AI service request failed.", code, retryAfterSeconds);
                        }

                        return (detail.GetRawText(), code, retryAfterSeconds);
                    }

                    return detail.ValueKind == JsonValueKind.String
                        ? (detail.GetString() ?? fallback ?? "AI service request failed.", code, retryAfterSeconds)
                        : (detail.GetRawText(), code, retryAfterSeconds);
                }
            }
        }
        catch (JsonException)
        {
            // Fall through to the raw response body.
        }

        return (responseBody, null, null);
    }
}
