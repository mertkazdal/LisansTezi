using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/spotify")]
public class SpotifyController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;

    public SpotifyController(AppDbContext db, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("auth")]
    [Authorize]
    public IActionResult Auth()
    {
        return TryBuildAuthorizeUrl(out var authorizeUrl, out var errorResult)
            ? Redirect(authorizeUrl!)
            : errorResult!;
    }

    [HttpGet("auth-url")]
    [Authorize]
    public IActionResult AuthUrl()
    {
        return TryBuildAuthorizeUrl(out var authorizeUrl, out var errorResult)
            ? Ok(new { authorizeUrl })
            : errorResult!;
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> Status()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            return Unauthorized();
        }

        var user = await _db.Users
            .Include(item => item.PersonalityProfile)
            .FirstOrDefaultAsync(item => item.Id == parsedUserId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var topTracks = ReadTopTracks(user.PersonalityProfile?.SpotifyTopTracksJson, out var lastSyncedAt);
        var connected = !string.IsNullOrWhiteSpace(user.SpotifyAccessToken) ||
                        !string.IsNullOrWhiteSpace(user.SpotifyRefreshToken);

        return Ok(new
        {
            connected,
            tokenActive = !string.IsNullOrWhiteSpace(user.SpotifyAccessToken) &&
                          user.SpotifyTokenExpiry is not null &&
                          user.SpotifyTokenExpiry > DateTime.UtcNow,
            expiresAt = user.SpotifyTokenExpiry,
            lastSyncedAt,
            topTracks
        });
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
    {
        if (!string.IsNullOrWhiteSpace(error))
        {
            return BadRequest(new
            {
                message = "Spotify authorization was cancelled or failed.",
                code = "SPOTIFY_AUTH_FAILED",
                detail = error
            });
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest(new
            {
                message = "Spotify callback did not include an authorization code.",
                code = "SPOTIFY_CODE_MISSING"
            });
        }

        if (!Guid.TryParse(state, out var userId))
        {
            return BadRequest(new
            {
                message = "Spotify callback state is invalid.",
                code = "SPOTIFY_STATE_INVALID"
            });
        }

        var clientId = Environment.GetEnvironmentVariable("SPOTIFY_CLIENT_ID");
        var clientSecret = Environment.GetEnvironmentVariable("SPOTIFY_CLIENT_SECRET");
        var redirectUri = Environment.GetEnvironmentVariable("SPOTIFY_REDIRECT_URI");
        if (string.IsNullOrWhiteSpace(clientId) ||
            string.IsNullOrWhiteSpace(clientSecret) ||
            string.IsNullOrWhiteSpace(redirectUri))
        {
            return BadRequest(new
            {
                message = "Spotify OAuth is not configured.",
                code = "SPOTIFY_CONFIG_MISSING"
            });
        }

        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
        var authBytes = Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(authBytes)
        );
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri
        });

        var client = _httpClientFactory.CreateClient();
        var response = await client.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            return BadRequest(new
            {
                message = "Spotify token exchange failed.",
                code = "SPOTIFY_TOKEN_EXCHANGE_FAILED",
                detail = responseBody
            });
        }

        using var payload = JsonDocument.Parse(responseBody);
        var accessToken = payload.RootElement.GetProperty("access_token").GetString();
        var refreshToken = payload.RootElement.TryGetProperty("refresh_token", out var refreshTokenValue)
            ? refreshTokenValue.GetString()
            : user.SpotifyRefreshToken;
        var expiresIn = payload.RootElement.TryGetProperty("expires_in", out var expiresInValue) &&
                        expiresInValue.TryGetInt32(out var seconds)
            ? seconds
            : 3600;

        user.SpotifyAccessToken = accessToken;
        user.SpotifyRefreshToken = refreshToken;
        user.SpotifyTokenExpiry = DateTime.UtcNow.AddSeconds(Math.Max(60, expiresIn - 30));
        await _db.SaveChangesAsync();

        return Ok(new
        {
            connected = true,
            userId = state,
            expiresAt = user.SpotifyTokenExpiry,
            message = "Spotify connected."
        });
    }

    private bool TryBuildAuthorizeUrl(out string? authorizeUrl, out IActionResult? errorResult)
    {
        authorizeUrl = null;
        errorResult = null;

        var clientId = Environment.GetEnvironmentVariable("SPOTIFY_CLIENT_ID");
        var redirectUri = Environment.GetEnvironmentVariable("SPOTIFY_REDIRECT_URI");
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(redirectUri))
        {
            errorResult = BadRequest(new
            {
                message = "Spotify OAuth is not configured.",
                code = "SPOTIFY_CONFIG_MISSING"
            });
            return false;
        }

        var query = new Dictionary<string, string?>
        {
            ["response_type"] = "code",
            ["client_id"] = clientId,
            ["scope"] = "user-top-read user-read-recently-played",
            ["redirect_uri"] = redirectUri,
            ["state"] = userId
        };

        authorizeUrl = "https://accounts.spotify.com/authorize?" + string.Join(
            "&",
            query.Select(item =>
                $"{Uri.EscapeDataString(item.Key)}={Uri.EscapeDataString(item.Value ?? string.Empty)}")
        );
        return true;
    }

    private static IReadOnlyList<object> ReadTopTracks(string? rawJson, out DateTime? lastSyncedAt)
    {
        lastSyncedAt = null;
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return Array.Empty<object>();
        }

        try
        {
            using var document = JsonDocument.Parse(rawJson);
            if (document.RootElement.TryGetProperty("fetchedAt", out var fetchedAtProperty) &&
                fetchedAtProperty.ValueKind == JsonValueKind.String &&
                DateTime.TryParse(fetchedAtProperty.GetString(), out var parsedFetchedAt))
            {
                lastSyncedAt = parsedFetchedAt;
            }

            if (!document.RootElement.TryGetProperty("tracks", out var tracksProperty) ||
                tracksProperty.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<object>();
            }

            return tracksProperty
                .EnumerateArray()
                .Take(5)
                .Select(track => (object)new
                {
                    title = track.TryGetProperty("title", out var titleProperty) ? titleProperty.GetString() : null,
                    artists = track.TryGetProperty("artists", out var artistsProperty) && artistsProperty.ValueKind == JsonValueKind.Array
                        ? artistsProperty
                            .EnumerateArray()
                            .Select(artist => artist.GetString())
                            .Where(artist => !string.IsNullOrWhiteSpace(artist))
                            .Select(artist => artist!)
                            .ToArray()
                        : Array.Empty<string>()
                })
                .ToArray();
        }
        catch (JsonException)
        {
            return Array.Empty<object>();
        }
    }
}
