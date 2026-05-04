using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

internal sealed class ModalityComparisonStat
{
    public string Modality { get; set; } = string.Empty;
    public int Count { get; set; }
    public double AverageResponseTimeMs { get; set; }
}

[ApiController]
[Route("api/metrics")]
[Authorize]
public class MetricsController : ControllerBase
{
    private readonly AnalyticsService _analyticsService;
    private readonly AppDbContext _db;
    private readonly AdminAccessService _adminAccessService;

    public MetricsController(
        AnalyticsService analyticsService,
        AppDbContext db,
        AdminAccessService adminAccessService
    )
    {
        _analyticsService = analyticsService;
        _db = db;
        _adminAccessService = adminAccessService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var guard = await EnsureAdminAsync();
        if (guard is not null)
        {
            return guard;
        }

        var snapshot = await _analyticsService.BuildSnapshotAsync();

        return Ok(new
        {
            message = snapshot.TotalAnalyses == 0
                ? "No completed analyses yet. Dashboard cards and charts will fill after the first sessions."
                : "AI-Powered Life Coach metrics are now tracking live usage, response quality, and activity trends.",
            summary = new
            {
                totalAnalyses = snapshot.TotalAnalyses,
                guestAnalyses = snapshot.GuestAnalyses,
                registeredAnalyses = snapshot.RegisteredAnalyses,
                registeredUsers = snapshot.RegisteredUsers,
                guestSessions = snapshot.GuestSessions,
                totalFeedbackResponses = snapshot.TotalFeedbackResponses,
                averageConfidence = snapshot.AverageConfidence,
                averageResponseTimeMs = snapshot.AverageResponseTimeMs,
                faceDetectedRate = snapshot.FaceDetectedRate,
                recommendationCoverageRate = snapshot.RecommendationCoverageRate,
                averageOverallRating = snapshot.AverageOverallRating,
                averageAnalysisAccuracyRating = snapshot.AverageAnalysisAccuracyRating,
                averageRecommendationQualityRating = snapshot.AverageRecommendationQualityRating,
                helpfulRate = snapshot.HelpfulRate,
                wouldReuseRate = snapshot.WouldReuseRate
            },
            topEmotions = snapshot.TopEmotions,
            modelDistribution = snapshot.ModelDistribution,
            modalityDistribution = snapshot.ModalityDistribution,
            ratingDistribution = snapshot.RatingDistribution,
            feedbackByEmotion = snapshot.FeedbackByEmotion,
            dailyActivity = snapshot.DailyActivity,
            recentAnalyses = snapshot.RecentAnalyses
        });
    }

    [HttpGet("research")]
    public async Task<IActionResult> GetResearchMetrics()
    {
        var guard = await EnsureAdminAsync();
        if (guard is not null)
        {
            return guard;
        }

        var snapshot = await _analyticsService.BuildSnapshotAsync();

        return Ok(new
        {
            summary = new
            {
                totalResponses = snapshot.TotalFeedbackResponses,
                averageOverallRating = snapshot.AverageOverallRating,
                averageAnalysisAccuracyRating = snapshot.AverageAnalysisAccuracyRating,
                averageRecommendationQualityRating = snapshot.AverageRecommendationQualityRating,
                helpfulRate = snapshot.HelpfulRate,
                wouldReuseRate = snapshot.WouldReuseRate
            },
            ratingDistribution = snapshot.RatingDistribution,
            feedbackByEmotion = snapshot.FeedbackByEmotion,
            feedbackByAudience = snapshot.FeedbackByAudience,
            feedbackByFaceDetection = snapshot.FeedbackByFaceDetection,
            feedbackByResponseSpeed = snapshot.FeedbackByResponseSpeed,
            feedbackTimeline = snapshot.FeedbackTimeline
        });
    }

    [HttpGet("comparison")]
    public async Task<IActionResult> GetComparison()
    {
        var guard = await EnsureAdminAsync();
        if (guard is not null)
        {
            return guard;
        }

        var snapshot = await _analyticsService.BuildSnapshotAsync();
        var modalityStats = await _db.EmotionHistories
            .AsNoTracking()
            .GroupBy(history => history.ModalityUsed)
            .Select(group => new ModalityComparisonStat
            {
                Modality = group.Key ?? string.Empty,
                Count = group.Count(),
                AverageResponseTimeMs = group
                    .Where(history => history.ResponseTimeMs.HasValue)
                    .Average(history => (double?)history.ResponseTimeMs) ?? 0
            })
            .ToListAsync();

        return Ok(new
        {
            message = snapshot.TotalAnalyses == 0
                ? "No completed analyses yet. Metrics will appear after the first sessions."
                : "Live comparison metrics are ready for research reporting across selfie, text, and combined analysis flows.",
            hypothesisValidated = snapshot.TotalAnalyses >= 25,
            multimodal_llava = new
            {
                sample_count = GetModalityCount(modalityStats, "multimodal"),
                avg_response_time_ms = (int)Math.Round(GetAverageResponseTime(modalityStats, "multimodal"))
            },
            text_only = new
            {
                sample_count = GetModalityCount(modalityStats, "text"),
                avg_response_time_ms = (int)Math.Round(GetAverageResponseTime(modalityStats, "text"))
            },
            image_only = new
            {
                sample_count = GetModalityCount(modalityStats, "image"),
                avg_response_time_ms = (int)Math.Round(GetAverageResponseTime(modalityStats, "image"))
            },
            user_satisfaction = new
            {
                average_rating = snapshot.AverageOverallRating,
                total_responses = snapshot.TotalFeedbackResponses
            },
            audience = new
            {
                registered_analyses = snapshot.RegisteredAnalyses,
                guest_analyses = snapshot.GuestAnalyses,
                registered_users = snapshot.RegisteredUsers,
                guest_sessions = snapshot.GuestSessions
            },
            quality = new
            {
                face_detected_rate = snapshot.FaceDetectedRate,
                recommendation_coverage_rate = snapshot.RecommendationCoverageRate
            }
        });
    }

    [HttpGet("response-times")]
    public async Task<IActionResult> GetResponseTimes()
    {
        var guard = await EnsureAdminAsync();
        if (guard is not null)
        {
            return guard;
        }

        var snapshot = await _analyticsService.BuildSnapshotAsync();
        var responseTimes = snapshot.ResponseSamples
            .Select(sample => sample.ResponseTimeMs)
            .ToList();

        return Ok(new
        {
            average = responseTimes.Count == 0 ? 0 : (int)Math.Round(responseTimes.Average()),
            min = responseTimes.Count == 0 ? 0 : responseTimes.Min(),
            max = responseTimes.Count == 0 ? 0 : responseTimes.Max(),
            samples = snapshot.ResponseSamples.Select(sample => new
            {
                createdAt = sample.CreatedAt,
                responseTimeMs = sample.ResponseTimeMs,
                emotion = sample.Emotion
            })
        });
    }

    [HttpGet("emotion-distribution")]
    public async Task<IActionResult> GetEmotionDistribution()
    {
        var guard = await EnsureAdminAsync();
        if (guard is not null)
        {
            return guard;
        }

        var snapshot = await _analyticsService.BuildSnapshotAsync();

        return Ok(new
        {
            total = snapshot.EmotionDistribution.Sum(item => item.Count),
            emotion_counts = snapshot.EmotionDistribution.ToDictionary(item => item.Key, item => item.Count)
        });
    }

    private async Task<IActionResult?> EnsureAdminAsync()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(claim, out var userId))
        {
            return Unauthorized(new { message = "Authentication is required." });
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId);

        if (user == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        return _adminAccessService.IsAdmin(user.Email, user.Username)
            ? null
            : Forbid();
    }

    private static int GetModalityCount(IEnumerable<ModalityComparisonStat> modalityStats, string modality)
    {
        var item = modalityStats.FirstOrDefault(entry => string.Equals(entry.Modality, modality, StringComparison.OrdinalIgnoreCase));
        return item?.Count ?? 0;
    }

    private static double GetAverageResponseTime(IEnumerable<ModalityComparisonStat> modalityStats, string modality)
    {
        var item = modalityStats.FirstOrDefault(entry => string.Equals(entry.Modality, modality, StringComparison.OrdinalIgnoreCase));
        return item?.AverageResponseTimeMs ?? 0;
    }
}
