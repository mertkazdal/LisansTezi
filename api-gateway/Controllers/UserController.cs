using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/user")]
[Authorize]
public class UserController : ControllerBase
{
    private static readonly HashSet<string> AllowedColorThemes = new(StringComparer.OrdinalIgnoreCase)
    {
        "kirmizi",
        "mavi",
        "yesil",
        "sari",
        "siyah",
        "beyaz"
    };

    private readonly AppDbContext _db;
    private readonly AdminAccessService _adminAccessService;

    public UserController(AppDbContext db, AdminAccessService adminAccessService)
    {
        _db = db;
        _adminAccessService = adminAccessService;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null) return NotFound(new { message = "User not found." });

        var totalAnalyses = await _db.EmotionHistories
            .CountAsync(h => h.UserId == userId.Value);

        var mostFrequentEmotion = await _db.EmotionHistories
            .Where(h => h.UserId == userId.Value)
            .GroupBy(h => h.DetectedEmotion)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefaultAsync();
        var personalityAvatarUrl = await _db.UserPersonalityProfiles
            .Where(profile => profile.UserId == userId.Value)
            .Select(profile => profile.AvatarUrl)
            .FirstOrDefaultAsync();
        var isAdmin = _adminAccessService.IsAdmin(user.Email, user.Username);

        return Ok(new UserProfileResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            AvatarUrl = string.IsNullOrWhiteSpace(personalityAvatarUrl) ? user.AvatarUrl : personalityAvatarUrl,
            CreatedAt = user.CreatedAt,
            TotalAnalyses = totalAnalyses,
            MostFrequentEmotion = mostFrequentEmotion,
            Role = isAdmin ? "admin" : "user",
            IsAdmin = isAdmin,
            CanDeleteAccount = true,
            DeleteConfirmationText = "DELETE",
            RecommendationSurvey = RecommendationSurveyService.ToResponse(user),
            PreferredColorTheme = ResolvePreferredColorTheme(user.PreferredColorTheme)
        });
    }

    [HttpPut("theme")]
    public async Task<IActionResult> UpdateTheme([FromBody] UpdateColorThemeRequest? request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request?.ColorTheme))
        {
            return BadRequest(new
            {
                message = "Choose a supported color palette.",
                code = "INVALID_COLOR_THEME"
            });
        }

        var normalizedTheme = ResolvePreferredColorTheme(request.ColorTheme);
        if (!AllowedColorThemes.Contains(normalizedTheme))
        {
            return BadRequest(new
            {
                message = "Choose a supported color palette.",
                code = "INVALID_COLOR_THEME"
            });
        }

        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId.Value);
        if (user == null) return NotFound(new { message = "User not found." });

        user.PreferredColorTheme = normalizedTheme;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            preferredColorTheme = user.PreferredColorTheme
        });
    }

    [HttpDelete("account")]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest? request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (!string.Equals(request?.ConfirmationText?.Trim(), "DELETE", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Please type DELETE to confirm account removal.",
                code = "DELETE_CONFIRMATION_REQUIRED"
            });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null) return NotFound(new { message = "User not found." });

        var historyIds = await _db.EmotionHistories
            .Where(h => h.UserId == userId.Value)
            .Select(h => h.Id)
            .ToListAsync();

        var deletedRecommendations = historyIds.Count == 0
            ? 0
            : await _db.Recommendations.CountAsync(r => historyIds.Contains(r.HistoryId));

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Your account and related analysis data have been deleted.",
            deletedAnalyses = historyIds.Count,
            deletedRecommendations
        });
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private static string ResolvePreferredColorTheme(string? colorTheme)
    {
        return string.IsNullOrWhiteSpace(colorTheme) ? "kirmizi" : colorTheme.Trim().ToLowerInvariant();
    }
}
