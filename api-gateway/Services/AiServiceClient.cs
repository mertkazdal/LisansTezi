using System.Text;
using System.Text.Json;

namespace MoodLens.ApiGateway.Services;

public class AiServiceException : Exception
{
    public int StatusCode { get; }
    public string? ErrorCode { get; }

    public AiServiceException(string message, int statusCode, string? errorCode = null)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
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
        string language
    )
    {
        return PostAsync("/analyze", new
        {
            image_base64 = imageBase64,
            text,
            mime_type = mimeType,
            language
        });
    }

    public Task<JsonElement> GetRecommendationsAsync(
        string emotion,
        string? context,
        string language,
        bool preferFollowUpKey = false
    )
    {
        return PostAsync("/recommendations", new
        {
            emotion,
            context,
            language,
            prefer_followup_key = preferFollowUpKey
        });
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
                error.Code
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

    private static (string Message, string? Code) ExtractError(string responseBody, string? fallback)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return (fallback ?? "AI service request failed.", null);
        }

        try
        {
            var json = JsonSerializer.Deserialize<JsonElement>(responseBody);
            if (json.ValueKind == JsonValueKind.Object)
            {
                string? code = null;
                if (json.TryGetProperty("code", out var codeProperty) &&
                    codeProperty.ValueKind == JsonValueKind.String)
                {
                    code = codeProperty.GetString();
                }

                if (json.TryGetProperty("message", out var message) &&
                    message.ValueKind == JsonValueKind.String)
                {
                    return (message.GetString() ?? fallback ?? "AI service request failed.", code);
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
                            return (nestedMessage.GetString() ?? fallback ?? "AI service request failed.", code);
                        }

                        return (detail.GetRawText(), code);
                    }

                    return detail.ValueKind == JsonValueKind.String
                        ? (detail.GetString() ?? fallback ?? "AI service request failed.", code)
                        : (detail.GetRawText(), code);
                }
            }
        }
        catch (JsonException)
        {
            // Fall through to the raw response body.
        }

        return (responseBody, null);
    }
}
