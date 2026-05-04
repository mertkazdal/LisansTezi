using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminAccessService _adminAccessService;
    private readonly AnalyticsService _analyticsService;

    public AdminController(
        AppDbContext db,
        AdminAccessService adminAccessService,
        AnalyticsService analyticsService
    )
    {
        _db = db;
        _adminAccessService = adminAccessService;
        _analyticsService = analyticsService;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var currentUser = await ResolveCurrentUserAsync();
        if (currentUser == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        if (!EnsureAdmin(currentUser.Email, currentUser.Username))
        {
            return Forbid();
        }

        var snapshot = await _analyticsService.BuildSnapshotAsync();

        return Ok(new
        {
            generatedAt = DateTime.UtcNow,
            admin = new
            {
                username = currentUser.Username,
                email = currentUser.Email
            },
            summary = new
            {
                totalUsers = snapshot.RegisteredUsers,
                totalAnalyses = snapshot.TotalAnalyses,
                guestAnalyses = snapshot.GuestAnalyses,
                registeredAnalyses = snapshot.RegisteredAnalyses,
                guestSessions = snapshot.GuestSessions,
                averageConfidence = snapshot.AverageConfidence,
                averageResponseTimeMs = snapshot.AverageResponseTimeMs,
                faceDetectedRate = snapshot.FaceDetectedRate,
                recommendationCoverageRate = snapshot.RecommendationCoverageRate
            },
            topEmotions = snapshot.TopEmotions,
            modelDistribution = snapshot.ModelDistribution,
            modalityDistribution = snapshot.ModalityDistribution,
            dailyActivity = snapshot.DailyActivity,
            recentAnalyses = snapshot.RecentAnalyses
        });
    }

    [HttpGet("export/json")]
    public async Task<IActionResult> ExportJson()
    {
        var currentUser = await ResolveCurrentUserAsync();
        if (currentUser == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        if (!EnsureAdmin(currentUser.Email, currentUser.Username))
        {
            return Forbid();
        }

        var snapshot = await _analyticsService.BuildSnapshotAsync();
        return Ok(new
        {
            exportedAt = DateTime.UtcNow,
            snapshot
        });
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv()
    {
        var currentUser = await ResolveCurrentUserAsync();
        if (currentUser == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        if (!EnsureAdmin(currentUser.Email, currentUser.Username))
        {
            return Forbid();
        }

        var snapshot = await _analyticsService.BuildSnapshotAsync();
        var csv = _analyticsService.BuildCsv(snapshot);
        var fileName = $"tezfinal-metrics-{DateTime.UtcNow:yyyyMMddHHmm}.csv";

        return File(Encoding.UTF8.GetBytes(csv), "text/csv", fileName);
    }

    private async Task<Models.User?> ResolveCurrentUserAsync()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(claim, out var userId))
        {
            return null;
        }

        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == userId);
    }

    private bool EnsureAdmin(string? email, string? username)
    {
        return _adminAccessService.IsAdmin(email, username);
    }
}
