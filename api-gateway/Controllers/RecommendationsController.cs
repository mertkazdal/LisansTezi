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
    private readonly GuestAnalysisStore _guestAnalysisStore;
    private readonly GuestIdentityService _guestIdentityService;

    public RecommendationsController(
        AppDbContext db,
        AiServiceClient aiClient,
        GuestAnalysisStore guestAnalysisStore,
        GuestIdentityService guestIdentityService
    )
    {
        _db = db;
        _aiClient = aiClient;
        _guestAnalysisStore = guestAnalysisStore;
        _guestIdentityService = guestIdentityService;
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

        if (userId == null)
        {
            var actorKey = _guestIdentityService.ResolveActorKey(HttpContext);
            if (!_guestAnalysisStore.TryGet(historyId, actorKey, resolvedGuestSessionId, out var guestRecord) ||
                guestRecord == null)
            {
                return NotFound(new { message = "Guest result expired or was not found." });
            }

            return Ok(new
            {
                historyId = guestRecord.HistoryId,
                emotion = guestRecord.Emotion,
                confidence = guestRecord.Confidence,
                explanation = guestRecord.Explanation,
                modalityUsed = guestRecord.ModalityUsed,
                modelUsed = guestRecord.ModelUsed,
                responseTimeMs = guestRecord.ResponseTimeMs,
                faceDetected = guestRecord.FaceDetected,
                warning = guestRecord.Warning,
                music = guestRecord.Recommendations.Music,
                movies = guestRecord.Recommendations.Movies,
                books = guestRecord.Recommendations.Books,
                lifeAdvice = guestRecord.Recommendations.LifeAdvice,
                activities = guestRecord.Recommendations.LifeAdvice,
                feedback = guestRecord.Feedback
            });
        }

        var authenticatedUserId = userId.Value;
        var historyQuery = _db.EmotionHistories.AsQueryable();
        historyQuery = historyQuery.Where(h => h.Id == historyId && h.UserId == authenticatedUserId);

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
        var currentUser = userId == null
            ? null
            : await _db.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == authenticatedUserId);

        string? warning = null;
        if (!HasCompleteRecommendations(recs))
        {
            try
            {
                var recommendationContext = RecommendationSurveyService.BuildRecommendationContext(history.UserText, currentUser);
                var personalityProfile = await _db.UserPersonalityProfiles
                    .AsNoTracking()
                    .Where(profile => profile.UserId == authenticatedUserId)
                    .Select(profile => new { profile.BigFiveJson, profile.AgeGroup })
                    .FirstOrDefaultAsync();
                var surveyMovieGenres = RecommendationSurveyService.ToResponse(currentUser)?.MovieGenres ?? new List<string>();
                var excludedMovieIds = await GetRecentlyRecommendedMovieIdsAsync(authenticatedUserId);
                var recommendations = await _aiClient.GetRecommendationsAsync(
                    history.DetectedEmotion,
                    recommendationContext,
                    GetPreferredLanguage(),
                    true,
                    personalityProfile?.BigFiveJson,
                    personalityProfile?.AgeGroup,
                    history.Confidence,
                    history.UserText,
                    authenticatedUserId,
                    surveyMovieGenres,
                    excludedMovieIds
                );
                if (recommendations.TryGetProperty("coachComment", out var coachCommentProperty) &&
                    coachCommentProperty.ValueKind == JsonValueKind.String)
                {
                    var coachComment = coachCommentProperty.GetString()?.Trim();
                    if (!string.IsNullOrWhiteSpace(coachComment))
                    {
                        history.Explanation = coachComment;
                    }
                }
                recs = await SaveRecommendationsAsync(historyId, recommendations, recs);
                await _db.SaveChangesAsync();
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
            activities = GetContentForCategory(recs, "advice"),
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

    private async Task<List<int>> GetRecentlyRecommendedMovieIdsAsync(Guid userId)
    {
        var since = DateTime.UtcNow.AddDays(-30);
        var recommendationPayloads = await _db.AnalysisRecords
            .AsNoTracking()
            .Where(item => item.UserId == userId && item.CreatedAt >= since)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => item.RecommendationsJson)
            .ToListAsync();

        var ids = new HashSet<int>();
        foreach (var payload in recommendationPayloads)
        {
            if (string.IsNullOrWhiteSpace(payload))
            {
                continue;
            }

            try
            {
                using var document = JsonDocument.Parse(payload);
                if (document.RootElement.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                CollectMovieIds(document.RootElement, "movies", ids);
                CollectMovieIds(document.RootElement, "films", ids);
            }
            catch (JsonException)
            {
                // Ignore malformed historical recommendation payloads.
            }
        }

        return ids.ToList();
    }

    private static void CollectMovieIds(JsonElement root, string propertyName, ISet<int> ids)
    {
        if (!root.TryGetProperty(propertyName, out var movies) || movies.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        foreach (var movie in movies.EnumerateArray())
        {
            var movieId = ExtractMovieId(movie);
            if (movieId is > 0)
            {
                ids.Add(movieId.Value);
            }
        }
    }

    private static int? ExtractMovieId(JsonElement movie)
    {
        if (movie.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        foreach (var propertyName in new[] { "tmdb_id", "tmdbId", "id" })
        {
            if (movie.TryGetProperty(propertyName, out var idProperty) &&
                idProperty.ValueKind == JsonValueKind.Number &&
                idProperty.TryGetInt32(out var id))
            {
                return id;
            }
        }

        if (movie.TryGetProperty("tmdb_url", out var urlProperty) &&
            urlProperty.ValueKind == JsonValueKind.String)
        {
            var url = urlProperty.GetString() ?? string.Empty;
            var lastSegment = url.TrimEnd('/').Split('/').LastOrDefault();
            if (int.TryParse(lastSegment, out var parsedId))
            {
                return parsedId;
            }
        }

        return null;
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
