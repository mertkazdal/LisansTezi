using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const int MinUsernameLength = 3;
    private const int MaxUsernameLength = 50;
    private const int MaxEmailLength = 100;
    private const int MinPasswordLength = 6;
    private const int MaxPasswordLength = 72;
    private const int MaxGuestSessionIdLength = 128;
    private static readonly EmailAddressAttribute EmailValidator = new();

    private readonly AppDbContext _db;
    private readonly AuthService _authService;
    private readonly AdminAccessService _adminAccessService;

    public AuthController(
        AppDbContext db,
        AuthService authService,
        AdminAccessService adminAccessService
    )
    {
        _db = db;
        _authService = authService;
        _adminAccessService = adminAccessService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var username = request.Username?.Trim() ?? string.Empty;
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(username) || username.Length < MinUsernameLength)
            return BadRequest(new { message = "Username must be at least 3 characters.", code = "INVALID_USERNAME" });

        if (username.Length > MaxUsernameLength)
            return BadRequest(new { message = "Username must be 50 characters or fewer.", code = "INVALID_USERNAME" });

        if (!IsUsernameFormatValid(username))
            return BadRequest(new
            {
                message = "Username may contain only letters, numbers, dots, underscores, or hyphens.",
                code = "INVALID_USERNAME"
            });

        if (string.IsNullOrWhiteSpace(email) || email.Length > MaxEmailLength || !EmailValidator.IsValid(email))
            return BadRequest(new { message = "Please provide a valid email address.", code = "INVALID_EMAIL" });

        if (string.IsNullOrWhiteSpace(password) || password.Length < MinPasswordLength)
            return BadRequest(new { message = "Password must be at least 6 characters.", code = "INVALID_PASSWORD" });

        if (password.Length > MaxPasswordLength)
            return BadRequest(new
            {
                message = "Password must be 72 characters or fewer for secure sign-in compatibility.",
                code = "INVALID_PASSWORD"
            });

        if (!RecommendationSurveyService.TryNormalize(
                request.RecommendationSurvey,
                out var normalizedSurvey,
                out var surveyCode,
                out var surveyMessage))
        {
            return BadRequest(new
            {
                message = surveyMessage,
                code = surveyCode
            });
        }

        var existingUser = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == email ||
                u.Username.ToLower() == username.ToLower());

        if (existingUser != null)
        {
            if (existingUser.Email.ToLower() == email)
                return Conflict(new { message = "An account with this email already exists.", code = "EMAIL_IN_USE" });
            return Conflict(new { message = "This username is already taken.", code = "USERNAME_IN_USE" });
        }

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = _authService.HashPassword(password)
        };
        RecommendationSurveyService.ApplyToUser(user, normalizedSurvey!);

        _db.Users.Add(user);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _db.Entry(user).State = EntityState.Detached;
            var conflict = await BuildExistingUserConflictAsync(email, username);
            if (conflict is not null)
            {
                return conflict;
            }

            return Conflict(new
            {
                message = "This account could not be created because the same email or username was just used elsewhere.",
                code = "ACCOUNT_ALREADY_EXISTS"
            });
        }

        var token = _authService.GenerateJwtToken(user.Id, user.Username, user.Email);
        var isAdmin = _adminAccessService.IsAdmin(user.Email, user.Username);

        return Ok(new AuthResponse
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            UserId = user.Id,
            Role = isAdmin ? "admin" : "user",
            IsAdmin = isAdmin,
            GuestDataMerged = false,
            MigratedGuestAnalysesCount = 0,
            RecommendationSurvey = RecommendationSurveyService.ToResponse(user),
            PreferredColorTheme = ResolvePreferredColorTheme(user.PreferredColorTheme)
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return BadRequest(new { message = "Email and password are required.", code = "AUTH_FIELDS_REQUIRED" });

        if (email.Length > MaxEmailLength || !EmailValidator.IsValid(email))
            return BadRequest(new { message = "Please provide a valid email address.", code = "INVALID_EMAIL" });

        if (password.Length > MaxPasswordLength)
            return Unauthorized(new { message = "Invalid email or password.", code = "INVALID_CREDENTIALS" });

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null || !_authService.VerifyPassword(password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password.", code = "INVALID_CREDENTIALS" });

        var token = _authService.GenerateJwtToken(user.Id, user.Username, user.Email);
        var isAdmin = _adminAccessService.IsAdmin(user.Email, user.Username);

        return Ok(new AuthResponse
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            UserId = user.Id,
            Role = isAdmin ? "admin" : "user",
            IsAdmin = isAdmin,
            GuestDataMerged = false,
            MigratedGuestAnalysesCount = 0,
            RecommendationSurvey = RecommendationSurveyService.ToResponse(user),
            PreferredColorTheme = ResolvePreferredColorTheme(user.PreferredColorTheme)
        });
    }

    private static string ResolvePreferredColorTheme(string? colorTheme)
    {
        return string.IsNullOrWhiteSpace(colorTheme) ? "kirmizi" : colorTheme.Trim().ToLowerInvariant();
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
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return null;
        }

        if (candidate.Length > MaxGuestSessionIdLength)
        {
            candidate = candidate[..MaxGuestSessionIdLength];
        }

        return candidate;
    }

    private async Task<IActionResult?> BuildExistingUserConflictAsync(string email, string username)
    {
        var conflictingUser = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email || u.Username.ToLower() == username.ToLower());

        if (conflictingUser == null)
        {
            return null;
        }

        if (conflictingUser.Email.ToLower() == email)
        {
            return Conflict(new { message = "An account with this email already exists.", code = "EMAIL_IN_USE" });
        }

        return Conflict(new { message = "This username is already taken.", code = "USERNAME_IN_USE" });
    }

    private static bool IsUsernameFormatValid(string username)
    {
        foreach (var character in username)
        {
            if (char.IsLetterOrDigit(character) || character is '.' or '_' or '-')
            {
                continue;
            }

            return false;
        }

        return true;
    }
}
