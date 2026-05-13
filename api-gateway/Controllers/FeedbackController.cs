using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/feedback")]
public class FeedbackController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly GuestAnalysisStore _guestAnalysisStore;
    private readonly GuestIdentityService _guestIdentityService;

    public FeedbackController(
        AppDbContext db,
        GuestAnalysisStore guestAnalysisStore,
        GuestIdentityService guestIdentityService
    )
    {
        _db = db;
        _guestAnalysisStore = guestAnalysisStore;
        _guestIdentityService = guestIdentityService;
    }

    [HttpGet("{historyId}")]
    public async Task<IActionResult> GetFeedback(Guid historyId, [FromQuery] string? guestSessionId = null)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            var actorKey = _guestIdentityService.ResolveActorKey(HttpContext);
            return _guestAnalysisStore.TryGetFeedback(historyId, actorKey, ResolveGuestSessionId(guestSessionId), out var guestFeedback)
                ? Ok(guestFeedback)
                : NotFound(new { message = "Feedback has not been submitted yet." });
        }

        var history = await ResolveAccessibleHistoryAsync(historyId, guestSessionId);
        if (history == null)
        {
            return NotFound(new { message = "Feedback item not found." });
        }

        var feedback = await _db.AnalysisFeedback
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.HistoryId == historyId);

        if (feedback == null)
        {
            return NotFound(new { message = "Feedback has not been submitted yet." });
        }

        return Ok(MapFeedback(feedback));
    }

    [HttpPost("{historyId}")]
    public async Task<IActionResult> UpsertFeedback(
        Guid historyId,
        [FromBody] FeedbackRequest request,
        [FromQuery] string? guestSessionId = null
    )
    {
        if (!IsValidRating(request.OverallRating) ||
            !IsValidRating(request.AnalysisAccuracyRating) ||
            !IsValidRating(request.RecommendationQualityRating))
        {
            return BadRequest(new
            {
                message = "Ratings must be between 1 and 5.",
                code = "INVALID_RATING_RANGE"
            });
        }

        var userId = GetUserId();
        if (userId == null)
        {
            var actorKey = _guestIdentityService.ResolveActorKey(HttpContext);
            if (!_guestAnalysisStore.TryUpsertFeedback(
                    historyId,
                    actorKey,
                    ResolveGuestSessionId(guestSessionId),
                    request,
                    out var guestFeedback))
            {
                return NotFound(new { message = "Guest result expired or cannot accept feedback." });
            }

            return Ok(new
            {
                message = "Feedback saved successfully.",
                feedback = guestFeedback
            });
        }

        var history = await ResolveAccessibleHistoryAsync(historyId, guestSessionId);
        if (history == null)
        {
            return NotFound(new { message = "History item not found or cannot accept feedback." });
        }

        var resolvedGuestSessionId = userId == null ? ResolveGuestSessionId(guestSessionId) : null;

        var feedback = await _db.AnalysisFeedback
            .FirstOrDefaultAsync(item => item.HistoryId == historyId);

        if (feedback == null)
        {
            feedback = new AnalysisFeedback
            {
                HistoryId = historyId
            };
            _db.AnalysisFeedback.Add(feedback);
        }

        feedback.UserId = userId;
        feedback.GuestSessionId = userId == null ? resolvedGuestSessionId : null;
        feedback.OverallRating = request.OverallRating;
        feedback.AnalysisAccuracyRating = request.AnalysisAccuracyRating;
        feedback.RecommendationQualityRating = request.RecommendationQualityRating;
        feedback.Helpful = request.Helpful;
        feedback.WouldReuse = request.WouldReuse;
        feedback.Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim();
        feedback.CreatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Feedback saved successfully.",
            feedback = MapFeedback(feedback)
        });
    }

    private async Task<EmotionHistory?> ResolveAccessibleHistoryAsync(Guid historyId, string? guestSessionId)
    {
        var userId = GetUserId();
        var query = _db.EmotionHistories.AsQueryable();

        if (userId != null)
        {
            return await query.FirstOrDefaultAsync(history => history.Id == historyId && history.UserId == userId.Value);
        }

        var resolvedGuestSessionId = ResolveGuestSessionId(guestSessionId);
        if (string.IsNullOrWhiteSpace(resolvedGuestSessionId))
        {
            return null;
        }

        return await query.FirstOrDefaultAsync(history =>
            history.Id == historyId &&
            history.GuestSessionId == resolvedGuestSessionId);
    }

    private FeedbackResponse MapFeedback(AnalysisFeedback feedback)
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

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
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

    private static bool IsValidRating(int rating)
    {
        return rating is >= 1 and <= 5;
    }
}
