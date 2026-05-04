using System.Diagnostics;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/analyze")]
public class AnalyzeController : ControllerBase
{
    private const int GuestAnalysisLimit = 3;

    private readonly AppDbContext _db;
    private readonly AiServiceClient _aiClient;

    public AnalyzeController(AppDbContext db, AiServiceClient aiClient)
    {
        _db = db;
        _aiClient = aiClient;
    }

    [HttpPost]
    public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest request)
    {
        var userId = GetUserId();
        var guestSessionId = userId == null ? ResolveGuestSessionId(request.GuestSessionId) : null;
        var guestUsageCount = 0;
        var hasImage = !string.IsNullOrWhiteSpace(request.ImageBase64);
        var hasText = !string.IsNullOrWhiteSpace(request.Text);
        var normalizedText = request.Text?.Trim() ?? string.Empty;
        var normalizedMimeType = "image/jpeg";

        if (userId == null && string.IsNullOrWhiteSpace(guestSessionId))
        {
            return BadRequest(new
            {
                message = "Guest session id is required for anonymous analysis.",
                code = "GUEST_SESSION_REQUIRED"
            });
        }

        if (userId == null)
        {
            guestUsageCount = await _db.EmotionHistories.CountAsync(h => h.GuestSessionId == guestSessionId);
            if (guestUsageCount >= GuestAnalysisLimit)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "You have used your 3 free analyses. Please sign in to continue.",
                    code = "GUEST_QUOTA_EXCEEDED",
                    guestRemainingAnalyses = 0
                });
            }
        }

        if (!hasImage && !hasText)
        {
            return BadRequest(new
            {
                message = "At least one input is required. Provide a selfie, text, or both.",
                code = "ANALYSIS_INPUT_REQUIRED"
            });
        }

        if (hasImage && !TryNormalizeMimeType(request.MimeType, out normalizedMimeType))
        {
            return BadRequest(new
            {
                message = "Unsupported image format. Supported formats are JPEG, JPG, PNG, WebP, HEIC, and HEIF.",
                code = "UNSUPPORTED_IMAGE_MIME_TYPE"
            });
        }

        try
        {
            var language = GetPreferredLanguage();
            var stopwatch = Stopwatch.StartNew();
            var aiResult = await _aiClient.AnalyzeEmotionAsync(
                hasImage ? request.ImageBase64 : null,
                hasText ? normalizedText : null,
                hasImage ? normalizedMimeType : null,
                language
            );
            stopwatch.Stop();

            var emotion = aiResult.GetProperty("emotion").GetString() ?? "calm";
            var confidence = aiResult.GetProperty("confidence").GetDouble();
            var explanation = aiResult.GetProperty("explanation").GetString() ?? string.Empty;
            var analysisWarning = GetOptionalString(aiResult, "warning");
            var imageFallbackUsed = GetOptionalBool(aiResult, "imageFallbackUsed") ?? false;
            var faceDetected = HasValue(aiResult, "faceEmotion") || HasValue(aiResult, "face_emotion");
            var modalityUsed = imageFallbackUsed ? "text" : ResolveModalityUsed(hasImage, hasText);
            var faceEmotion = GetOptionalString(aiResult, "faceEmotion") ?? GetOptionalString(aiResult, "face_emotion");
            var faceConfidence = GetOptionalDouble(aiResult, "faceConfidence") ?? GetOptionalDouble(aiResult, "face_confidence");
            var textEmotion = GetOptionalString(aiResult, "textEmotion") ?? GetOptionalString(aiResult, "text_emotion");
            var textConfidence = GetOptionalDouble(aiResult, "textConfidence") ?? GetOptionalDouble(aiResult, "text_confidence");

            var history = new EmotionHistory
            {
                UserId = userId,
                GuestSessionId = userId == null ? guestSessionId : null,
                DetectedEmotion = emotion,
                Confidence = confidence,
                Explanation = explanation,
                UserText = BuildAnalysisContext(
                    normalizedText,
                    modalityUsed,
                    language,
                    faceEmotion,
                    textEmotion
                ),
                ImagePath = hasImage
                    ? $"analysis_{DateTime.UtcNow:yyyyMMddHHmmss}{GetImageExtension(normalizedMimeType)}"
                    : null,
                ModalityUsed = modalityUsed,
                ModelUsed = imageFallbackUsed ? "gemini-text" : ResolveModelUsed(hasImage, hasText),
                ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds,
                FaceDetected = faceDetected
            };

            _db.EmotionHistories.Add(history);
            await _db.SaveChangesAsync();

            JsonElement? recommendations = null;
            string? warning = analysisWarning;

            try
            {
                recommendations = await _aiClient.GetRecommendationsAsync(
                    emotion,
                    history.UserText,
                    language,
                    true
                );
                SaveRecommendations(history.Id, recommendations.Value);
                await _db.SaveChangesAsync();
            }
            catch (AiServiceException ex)
            {
                warning = AppendWarning(warning, $"Recommendations are temporarily unavailable: {ex.Message}");
            }
            catch (HttpRequestException ex)
            {
                warning = AppendWarning(warning, $"Recommendations are temporarily unavailable: {ex.Message}");
            }

            return Ok(new
            {
                historyId = history.Id,
                emotion,
                confidence,
                explanation,
                warning,
                modalityUsed = history.ModalityUsed,
                modelUsed = history.ModelUsed,
                responseTimeMs = history.ResponseTimeMs,
                faceDetected = history.FaceDetected,
                needsReason = false,
                reasonProvided = true,
                guestRemainingAnalyses = userId == null
                    ? (int?)Math.Max(0, GuestAnalysisLimit - guestUsageCount - 1)
                    : null,
                recommendations = new
                {
                    music = GetRecommendationCategory(recommendations, "music"),
                    movies = GetRecommendationCategory(recommendations, "movies"),
                    books = GetRecommendationCategory(recommendations, "books"),
                    lifeAdvice = GetRecommendationCategory(recommendations, "lifeAdvice")
                }
            });
        }
        catch (AiServiceException ex)
        {
            var statusCode = ex.StatusCode is >= 400 and < 600 ? ex.StatusCode : 502;
            return StatusCode(statusCode, new { message = ex.Message, code = ex.ErrorCode });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(503, new
            {
                message = "AI service is unavailable. Please try again later.",
                detail = ex.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "An error occurred during analysis.",
                detail = ex.Message
            });
        }
    }

    private void SaveRecommendations(Guid historyId, JsonElement recommendations)
    {
        var categories = new[]
        {
            (ApiCategory: "music", DbCategory: "music"),
            (ApiCategory: "movies", DbCategory: "movie"),
            (ApiCategory: "books", DbCategory: "book"),
            (ApiCategory: "lifeAdvice", DbCategory: "advice")
        };

        foreach (var (apiCategory, dbCategory) in categories)
        {
            if (!recommendations.TryGetProperty(apiCategory, out var categoryData) ||
                categoryData.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                continue;
            }

            _db.Recommendations.Add(new Recommendation
            {
                HistoryId = historyId,
                Category = dbCategory,
                Content = categoryData.GetRawText()
            });
        }
    }

    private static object GetRecommendationCategory(JsonElement? recommendations, string category)
    {
        if (recommendations is not { } value ||
            !value.TryGetProperty(category, out var categoryData))
        {
            return Array.Empty<object>();
        }

        return JsonSerializer.Deserialize<object>(categoryData.GetRawText()) ?? Array.Empty<object>();
    }

    private static bool TryNormalizeMimeType(string? mimeType, out string normalizedMimeType)
    {
        normalizedMimeType = "image/jpeg";

        if (string.IsNullOrWhiteSpace(mimeType))
        {
            return true;
        }

        normalizedMimeType = mimeType.Trim().ToLowerInvariant() switch
        {
            "image/jpeg" => "image/jpeg",
            "image/jpg" => "image/jpeg",
            "image/png" => "image/png",
            "image/webp" => "image/webp",
            "image/heic" => "image/heic",
            "image/heif" => "image/heif",
            _ => string.Empty
        };

        return !string.IsNullOrEmpty(normalizedMimeType);
    }

    private static string GetImageExtension(string? mimeType)
    {
        return mimeType switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/heic" => ".heic",
            "image/heif" => ".heif",
            _ => ".jpg"
        };
    }

    private string GetPreferredLanguage()
    {
        if (Request.Headers.TryGetValue("X-MoodLens-Language", out var explicitLanguage))
        {
            var normalized = explicitLanguage.ToString().Trim().ToLowerInvariant();
            if (normalized.StartsWith("tr"))
            {
                return "tr";
            }
        }

        if (Request.Headers.TryGetValue("Accept-Language", out var acceptLanguage))
        {
            var normalized = acceptLanguage.ToString().Trim().ToLowerInvariant();
            if (normalized.StartsWith("tr"))
            {
                return "tr";
            }
        }

        return "en";
    }

    private static string ResolveModalityUsed(bool hasImage, bool hasText)
    {
        if (hasImage && hasText)
        {
            return "multimodal";
        }

        if (hasImage)
        {
            return "image";
        }

        return "text";
    }

    private static string ResolveModelUsed(bool hasImage, bool hasText)
    {
        if (hasImage && hasText)
        {
            return "local-face-model + gemini-text";
        }

        if (hasImage)
        {
            return "local-face-model";
        }

        return "gemini-text";
    }

    private static string BuildAnalysisContext(
        string text,
        string modalityUsed,
        string language,
        string? faceEmotion,
        string? textEmotion
    )
    {
        if (modalityUsed == "text")
        {
            return text;
        }

        if (modalityUsed == "image")
        {
            if (language == "tr")
            {
                return $"Gorsel odakli analiz. Yerel yuz modeli tarafindan tespit edilen duygu: {faceEmotion ?? "calm"}.";
            }

            return $"Image-first analysis. Local face model emotion: {faceEmotion ?? "calm"}.";
        }

        var normalizedText = string.IsNullOrWhiteSpace(text) ? (language == "tr" ? "Metin girilmedi." : "No text provided.") : text;
        if (language == "tr")
        {
            return $"{normalizedText}\nYerel yuz sinyali: {faceEmotion ?? "calm"}\nMetin sinyali: {textEmotion ?? "calm"}";
        }

        return $"{normalizedText}\nLocal facial signal: {faceEmotion ?? "calm"}\nText signal: {textEmotion ?? "calm"}";
    }

    private static bool HasValue(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) &&
               property.ValueKind == JsonValueKind.String &&
               !string.IsNullOrWhiteSpace(property.GetString());
    }

    private static string? GetOptionalString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) &&
               property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static double? GetOptionalDouble(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) &&
               property.ValueKind == JsonValueKind.Number &&
               property.TryGetDouble(out var value)
            ? value
            : null;
    }

    private static bool? GetOptionalBool(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) &&
               (property.ValueKind == JsonValueKind.True || property.ValueKind == JsonValueKind.False)
            ? property.GetBoolean()
            : null;
    }

    private static string AppendWarning(string? currentWarning, string nextWarning)
    {
        if (string.IsNullOrWhiteSpace(currentWarning))
        {
            return nextWarning;
        }

        return $"{currentWarning} {nextWarning}";
    }

    private string? ResolveGuestSessionId(string? bodyGuestSessionId)
    {
        var candidate = bodyGuestSessionId;

        if (string.IsNullOrWhiteSpace(candidate) &&
            Request.Headers.TryGetValue("X-Guest-Session-Id", out var headerGuestSessionId))
        {
            candidate = headerGuestSessionId.ToString();
        }

        candidate = candidate?.Trim();
        return string.IsNullOrWhiteSpace(candidate) ? null : candidate;
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
