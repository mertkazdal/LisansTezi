using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/recommendations")]
public class RecommendationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AiServiceClient _aiClient;

    public RecommendationsController(AppDbContext db, AiServiceClient aiClient)
    {
        _db = db;
        _aiClient = aiClient;
    }

    [HttpGet("{historyId}")]
    public async Task<IActionResult> GetRecommendations(Guid historyId, [FromQuery] string? guestSessionId = null)
    {
        var userId = GetUserId();
        var resolvedGuestSessionId = ResolveGuestSessionId(guestSessionId);

        if (userId == null && string.IsNullOrWhiteSpace(resolvedGuestSessionId))
        {
            return Unauthorized(new
            {
                message = "Please sign in or provide a valid guest session to view this result.",
                code = "AUTH_REQUIRED"
            });
        }

        var historyQuery = _db.EmotionHistories.AsQueryable();
        if (userId != null)
        {
            historyQuery = historyQuery.Where(h => h.Id == historyId && h.UserId == userId.Value);
        }
        else
        {
            historyQuery = historyQuery.Where(h => h.Id == historyId && h.GuestSessionId == resolvedGuestSessionId);
        }

        var history = await historyQuery.FirstOrDefaultAsync();
        if (history == null)
        {
            return NotFound(new { message = "History item not found." });
        }

        var recs = await _db.Recommendations
            .Where(r => r.HistoryId == historyId)
            .ToListAsync();
        var feedback = await _db.AnalysisFeedback
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.HistoryId == historyId);

        string? warning = null;
        if (!HasCompleteRecommendations(recs))
        {
            try
            {
                var recommendations = await _aiClient.GetRecommendationsAsync(
                    history.DetectedEmotion,
                    history.UserText,
                    GetPreferredLanguage(),
                    true
                );
                recs = await SaveRecommendationsAsync(historyId, recommendations, recs);
            }
            catch (AiServiceException ex)
            {
                warning = $"Recommendations are temporarily unavailable: {ex.Message}";
            }
            catch (HttpRequestException ex)
            {
                warning = $"Recommendations are temporarily unavailable: {ex.Message}";
            }
        }

        return Ok(new
        {
            historyId = history.Id,
            emotion = history.DetectedEmotion,
            confidence = history.Confidence,
            explanation = history.Explanation,
            modalityUsed = history.ModalityUsed,
            modelUsed = history.ModelUsed,
            responseTimeMs = history.ResponseTimeMs,
            faceDetected = history.FaceDetected,
            warning,
            music = GetContentForCategory(recs, "music"),
            movies = GetContentForCategory(recs, "movie"),
            books = GetContentForCategory(recs, "book"),
            lifeAdvice = GetContentForCategory(recs, "advice"),
            feedback = feedback == null ? null : MapFeedback(feedback)
        });
    }

    private async Task<List<Models.Recommendation>> SaveRecommendationsAsync(
        Guid historyId,
        JsonElement recommendations,
        List<Models.Recommendation> existingRecommendations)
    {
        var categories = new[]
        {
            (ApiCategory: "music", DbCategory: "music"),
            (ApiCategory: "movies", DbCategory: "movie"),
            (ApiCategory: "books", DbCategory: "book"),
            (ApiCategory: "lifeAdvice", DbCategory: "advice")
        };
        var existingCategories = existingRecommendations
            .Select(r => r.Category)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var (apiCategory, dbCategory) in categories)
        {
            if (existingCategories.Contains(dbCategory))
            {
                continue;
            }

            if (!recommendations.TryGetProperty(apiCategory, out var categoryData) ||
                categoryData.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                continue;
            }

            _db.Recommendations.Add(new Models.Recommendation
            {
                HistoryId = historyId,
                Category = dbCategory,
                Content = categoryData.GetRawText()
            });
        }

        await _db.SaveChangesAsync();

        return await _db.Recommendations
            .Where(r => r.HistoryId == historyId)
            .ToListAsync();
    }

    private static bool HasCompleteRecommendations(List<Models.Recommendation> recs)
    {
        var categories = recs
            .Select(r => r.Category)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return categories.Contains("music") &&
               categories.Contains("movie") &&
               categories.Contains("book") &&
               categories.Contains("advice");
    }

    private static JsonElement? GetContentForCategory(List<Models.Recommendation> recs, string category)
    {
        var rec = recs.FirstOrDefault(r => r.Category == category);
        if (rec == null)
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(rec.Content);
        }
        catch
        {
            return null;
        }
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
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

    private string? ResolveGuestSessionId(string? guestSessionId)
    {
        var candidate = guestSessionId;

        if (string.IsNullOrWhiteSpace(candidate) &&
            Request.Headers.TryGetValue("X-Guest-Session-Id", out var headerGuestSessionId))
        {
            candidate = headerGuestSessionId.ToString();
        }

        candidate = candidate?.Trim();
        return string.IsNullOrWhiteSpace(candidate) ? null : candidate;
    }

    private static FeedbackResponse MapFeedback(Models.AnalysisFeedback feedback)
    {
        return new FeedbackResponse
        {
            Id = feedback.Id,
            HistoryId = feedback.HistoryId,
            OverallRating = feedback.OverallRating,
            AnalysisAccuracyRating = feedback.AnalysisAccuracyRating,
            RecommendationQualityRating = feedback.RecommendationQualityRating,
            Helpful = feedback.Helpful,
            WouldReuse = feedback.WouldReuse,
            Comment = feedback.Comment,
            CreatedAt = feedback.CreatedAt
        };
    }
}
