using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/survey")]
public class SurveyController : ControllerBase
{
    private const int GuestAnalysisLimit = 3;
    private const string GuestSessionCookieName = "moodlens_guest_session";
    private readonly AppDbContext _db;
    private readonly AiServiceClient _aiClient;
    private static readonly HashSet<string> AllowedAgeGroups = new(StringComparer.OrdinalIgnoreCase)
    {
        "teen",
        "young_adult",
        "adult",
        "mature"
    };

    public SurveyController(AppDbContext db, AiServiceClient aiClient)
    {
        _db = db;
        _aiClient = aiClient;
    }

    [HttpGet("questions")]
    public async Task<IActionResult> GetQuestions([FromQuery] string? language = null)
    {
        var preferredLanguage = NormalizeLanguage(language ?? GetPreferredLanguage());
        try
        {
            var questions = await _aiClient.GetSurveyQuestionsAsync(preferredLanguage);
            return Ok(JsonSerializer.Deserialize<object>(questions.GetRawText()));
        }
        catch (AiServiceException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message, code = ex.ErrorCode });
        }
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] PersonalitySurveySubmitRequest request)
    {
        var language = NormalizeLanguage(GetPreferredLanguage());
        if (!TryNormalizeAgeGroup(request.AgeGroup, out var ageGroup))
        {
            return BadRequest(new
            {
                message = "Survey requires a valid age group.",
                code = "INVALID_AGE_GROUP"
            });
        }

        var answers = request.Answers
            .Where(item => item.Key is >= 1 and <= 20 && item.Value is >= 1 and <= 5)
            .ToDictionary(item => item.Key, item => item.Value);

        if (answers.Count != 20)
        {
            return BadRequest(new
            {
                message = "Survey requires 20 answers on a 1-5 scale.",
                code = "INVALID_SURVEY_ANSWERS"
            });
        }

        var personality = await _aiClient.DetectPersonalityAsync(answers, language);
        var personalityJson = BuildBigFiveJson(personality);
        var userId = GetUserId();
        if (userId == null)
        {
            var guestSession = ResolveGuestSessionState(request.GuestSessionId);
            WriteGuestSessionStateCookie(guestSession with
            {
                SurveyCompleted = true,
                PersonalityJson = personalityJson,
                AgeGroup = ageGroup
            });

            return Ok(new
            {
                saved = true,
                persisted = false,
                guestSessionId = guestSession.SessionId,
                message = "Guest survey answers were accepted for this session."
            });
        }

        var now = DateTime.UtcNow;
        var profile = await _db.UserPersonalityProfiles
            .FirstOrDefaultAsync(item => item.UserId == userId.Value);

        if (profile == null)
        {
            profile = new UserPersonalityProfile
            {
                UserId = userId.Value,
                CreatedAt = now
            };
            _db.UserPersonalityProfiles.Add(profile);
        }

        profile.BigFiveJson = personalityJson;
        profile.MbtiType = GetOptionalString(personality, "mbti");
        profile.AgeGroup = ageGroup;
        profile.RawSurveyAnswers = JsonSerializer.Serialize(answers);
        profile.LastUpdated = now;

        _db.PersonalityUpdateLogs.Add(new PersonalityUpdateLog
        {
            UserId = userId.Value,
            UpdatedAt = now,
            TriggerSource = "survey"
        });

        await _db.SaveChangesAsync();

        return Ok(new
        {
            saved = true,
            persisted = true,
            lastUpdated = profile.LastUpdated
        });
    }

    private static string BuildBigFiveJson(JsonElement personality)
    {
        var snapshot = new
        {
            openness = GetOptionalDouble(personality, "openness") ?? 50,
            conscientiousness = GetOptionalDouble(personality, "conscientiousness") ?? 50,
            extraversion = GetOptionalDouble(personality, "extraversion") ?? 50,
            agreeableness = GetOptionalDouble(personality, "agreeableness") ?? 50,
            neuroticism = GetOptionalDouble(personality, "neuroticism") ?? 50,
            confidence = GetOptionalDouble(personality, "confidence") ?? 0.8,
            summary = GetOptionalString(personality, "summary")
        };

        return JsonSerializer.Serialize(snapshot);
    }

    private string GetPreferredLanguage()
    {
        if (Request.Headers.TryGetValue("X-MoodLens-Language", out var explicitLanguage))
        {
            return explicitLanguage.ToString();
        }

        return Request.Headers.TryGetValue("Accept-Language", out var acceptLanguage)
            ? acceptLanguage.ToString()
            : "tr";
    }

    private static string NormalizeLanguage(string? language)
    {
        return (language ?? "").Trim().ToLowerInvariant().StartsWith("en") ? "en" : "tr";
    }

    private static bool TryNormalizeAgeGroup(string? value, out string ageGroup)
    {
        ageGroup = (value ?? string.Empty).Trim().ToLowerInvariant();
        return !string.IsNullOrWhiteSpace(ageGroup) && AllowedAgeGroups.Contains(ageGroup);
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private GuestSessionState ResolveGuestSessionState(string? bodyGuestSessionId)
    {
        var cookieState = ReadGuestSessionStateCookie();
        var candidate = bodyGuestSessionId;

        if (string.IsNullOrWhiteSpace(candidate) &&
            Request.Headers.TryGetValue("X-Guest-Session-Id", out var headerGuestSessionId))
        {
            candidate = headerGuestSessionId.ToString();
        }

        if (string.IsNullOrWhiteSpace(candidate))
        {
            candidate = cookieState?.SessionId;
        }

        var sessionId = string.IsNullOrWhiteSpace(candidate)
            ? Guid.NewGuid().ToString("N")
            : candidate.Trim();
        var sameCookieSession = cookieState != null &&
            string.Equals(cookieState.SessionId, sessionId, StringComparison.Ordinal);

        return new GuestSessionState(
            sessionId,
            sameCookieSession ? Math.Clamp(cookieState!.CompletedAnalyses, 0, GuestAnalysisLimit) : 0,
            sameCookieSession && cookieState!.SurveyCompleted,
            sameCookieSession ? cookieState!.PersonalityJson : null,
            sameCookieSession ? cookieState!.AgeGroup : null
        );
    }

    private GuestSessionState? ReadGuestSessionStateCookie()
    {
        if (!Request.Cookies.TryGetValue(GuestSessionCookieName, out var rawCookie) ||
            string.IsNullOrWhiteSpace(rawCookie))
        {
            return null;
        }

        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(rawCookie));
            return JsonSerializer.Deserialize<GuestSessionState>(json);
        }
        catch (Exception)
        {
            return null;
        }
    }

    private void WriteGuestSessionStateCookie(GuestSessionState state)
    {
        var json = JsonSerializer.Serialize(state);
        var value = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
        Response.Cookies.Append(
            GuestSessionCookieName,
            value,
            new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps
            }
        );
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

    private sealed record GuestSessionState(
        string SessionId,
        int CompletedAnalyses,
        bool SurveyCompleted = false,
        string? PersonalityJson = null,
        string? AgeGroup = null
    );
}
