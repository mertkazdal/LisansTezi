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
    private readonly AppDbContext _db;
    private readonly AuthService _authService;
    private readonly GuestDataMergeService _guestDataMergeService;
    private readonly AdminAccessService _adminAccessService;

    public AuthController(
        AppDbContext db,
        AuthService authService,
        GuestDataMergeService guestDataMergeService,
        AdminAccessService adminAccessService
    )
    {
        _db = db;
        _authService = authService;
        _guestDataMergeService = guestDataMergeService;
        _adminAccessService = adminAccessService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var username = request.Username?.Trim() ?? string.Empty;
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(username) || username.Length < 3)
            return BadRequest(new { message = "Username must be at least 3 characters." });

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return BadRequest(new { message = "Please provide a valid email address." });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var existingUser = await _db.Users
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == email ||
                u.Username.ToLower() == username.ToLower());

        if (existingUser != null)
        {
            if (existingUser.Email.ToLower() == email)
                return Conflict(new { message = "An account with this email already exists." });
            return Conflict(new { message = "This username is already taken." });
        }

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = _authService.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var migratedGuestAnalysesCount = await _guestDataMergeService.ClaimGuestAnalysesAsync(
            user.Id,
            ResolveGuestSessionId(request.GuestSessionId)
        );

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
            GuestDataMerged = migratedGuestAnalysesCount > 0,
            MigratedGuestAnalysesCount = migratedGuestAnalysesCount
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email and password are required." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null || !_authService.VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        var migratedGuestAnalysesCount = await _guestDataMergeService.ClaimGuestAnalysesAsync(
            user.Id,
            ResolveGuestSessionId(request.GuestSessionId)
        );

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
            GuestDataMerged = migratedGuestAnalysesCount > 0,
            MigratedGuestAnalysesCount = migratedGuestAnalysesCount
        });
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
}
