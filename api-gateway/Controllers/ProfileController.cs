using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private static readonly TimeSpan AvatarRefreshInterval = TimeSpan.FromDays(7);

    private readonly AppDbContext _db;
    private readonly AiServiceClient _aiClient;

    public ProfileController(AppDbContext db, AiServiceClient aiClient)
    {
        _db = db;
        _aiClient = aiClient;
    }

    [HttpPost("generate-avatar")]
    public async Task<IActionResult> GenerateAvatar()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var profile = await _db.UserPersonalityProfiles
            .FirstOrDefaultAsync(item => item.UserId == userId.Value);
        if (profile == null)
        {
            return BadRequest(new
            {
                message = "Create a personality profile before generating an avatar.",
                code = "PERSONALITY_PROFILE_REQUIRED"
            });
        }

        var now = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(profile.AvatarUrl) &&
            profile.AvatarGeneratedAt is { } generatedAt &&
            now - generatedAt < AvatarRefreshInterval)
        {
            return Ok(new
            {
                avatar_url = profile.AvatarUrl,
                cached = true
            });
        }

        var dominantEmotion = await ResolveDominantRecentEmotionAsync(userId.Value);
        var avatarUrl = await GenerateAvatarUrlSafelyAsync(profile, dominantEmotion);

        profile.AvatarUrl = avatarUrl;
        profile.AvatarGeneratedAt = now;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            avatar_url = profile.AvatarUrl,
            cached = false
        });
    }

    [HttpPost("media-log")]
    public async Task<IActionResult> LogMedia([FromBody] MediaLogRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var type = (request.Type ?? string.Empty).Trim().ToLowerInvariant();
        if (type is not ("film" or "book"))
        {
            return BadRequest(new
            {
                message = "Media type must be film or book.",
                code = "INVALID_MEDIA_TYPE"
            });
        }

        var title = (request.Title ?? string.Empty).Trim();
        if (title.Length is < 1 or > 240)
        {
            return BadRequest(new
            {
                message = "Title is required and must be 240 characters or fewer.",
                code = "INVALID_MEDIA_TITLE"
            });
        }

        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        if (note?.Length > 1000)
        {
            return BadRequest(new
            {
                message = "Note must be 1000 characters or fewer.",
                code = "INVALID_MEDIA_NOTE"
            });
        }

        var log = new UserMediaLog
        {
            UserId = userId.Value,
            Type = type,
            Title = title,
            Note = note,
            LoggedAt = DateTime.UtcNow
        };

        _db.UserMediaLogs.Add(log);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = log.Id,
            type = log.Type,
            title = log.Title,
            note = log.Note,
            loggedAt = log.LoggedAt
        });
    }

    private async Task<string> GenerateAvatarUrlSafelyAsync(UserPersonalityProfile profile, string dominantEmotion)
    {
        try
        {
            var response = await _aiClient.GenerateAvatarAsync(
                profile.BigFiveJson,
                profile.MbtiType,
                dominantEmotion
            );

            if (response.TryGetProperty("avatar_url", out var avatarUrlProperty) &&
                avatarUrlProperty.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                var avatarUrl = avatarUrlProperty.GetString();
                if (!string.IsNullOrWhiteSpace(avatarUrl))
                {
                    return avatarUrl;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Avatar generation fallback warning: {ex.Message}");
        }

        return BuildPollinationsAvatarUrl(
            BuildFallbackAvatarPrompt(profile.BigFiveJson, profile.MbtiType, dominantEmotion)
        );
    }

    private async Task<string> ResolveDominantRecentEmotionAsync(Guid userId)
    {
        var recentEmotions = await _db.AnalysisRecords
            .AsNoTracking()
            .Where(record => record.UserId == userId)
            .OrderByDescending(record => record.CreatedAt)
            .Take(5)
            .Select(record => record.EmotionResult)
            .ToListAsync();

        return recentEmotions
            .Where(emotion => !string.IsNullOrWhiteSpace(emotion))
            .GroupBy(emotion => emotion.Trim().ToLowerInvariant())
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key)
            .Select(group => group.Key)
            .FirstOrDefault() ?? "calm";
    }

    private static string BuildFallbackAvatarPrompt(string bigFiveJson, string? mbtiType, string dominantEmotion)
    {
        var traits = ExtractReadableBigFiveTraits(bigFiveJson);
        var traitText = traits.Count == 0
            ? "balanced, expressive, emotionally aware"
            : string.Join(", ", traits);
        var mbtiText = string.IsNullOrWhiteSpace(mbtiType) ? "" : $" with {mbtiType.Trim().ToUpperInvariant()} energy";

        return $"A friendly cartoon character with warm colors, curious eyes, creative accessories, representing a {traitText} personality{mbtiText} feeling {dominantEmotion}. Flat illustration style, soft background, no text.";
    }

    private static List<string> ExtractReadableBigFiveTraits(string bigFiveJson)
    {
        var traits = new List<string>();
        try
        {
            using var document = System.Text.Json.JsonDocument.Parse(string.IsNullOrWhiteSpace(bigFiveJson) ? "{}" : bigFiveJson);
            AddTraitIfHigh(document.RootElement, traits, "openness", "open and imaginative");
            AddTraitIfHigh(document.RootElement, traits, "conscientiousness", "organized and purposeful");
            AddTraitIfHigh(document.RootElement, traits, "extraversion", "warm and socially energetic");
            AddTraitIfHigh(document.RootElement, traits, "agreeableness", "kind and cooperative");
            AddTraitIfHigh(document.RootElement, traits, "neuroticism", "sensitive and emotionally reflective");
        }
        catch (System.Text.Json.JsonException)
        {
            // Keep fallback avatar generation resilient.
        }

        return traits;
    }

    private static void AddTraitIfHigh(System.Text.Json.JsonElement root, List<string> traits, string key, string description)
    {
        if (!TryReadBigFiveScore(root, key, out var score))
        {
            return;
        }

        if (score >= 0.6)
        {
            traits.Add(description);
        }
    }

    private static bool TryReadBigFiveScore(System.Text.Json.JsonElement root, string key, out double score)
    {
        score = 0;
        if (!root.TryGetProperty(key, out var value))
        {
            return false;
        }

        if (value.ValueKind == System.Text.Json.JsonValueKind.Number)
        {
            return value.TryGetDouble(out score);
        }

        if (value.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            foreach (var candidate in new[] { "score", "value", "normalized" })
            {
                if (value.TryGetProperty(candidate, out var nested) &&
                    nested.ValueKind == System.Text.Json.JsonValueKind.Number &&
                    nested.TryGetDouble(out score))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static string BuildPollinationsAvatarUrl(string prompt)
    {
        return $"https://image.pollinations.ai/prompt/{Uri.EscapeDataString(prompt)}?width=512&height=512&nologo=true";
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
