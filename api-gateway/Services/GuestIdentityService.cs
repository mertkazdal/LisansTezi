using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace MoodLens.ApiGateway.Services;

public class GuestIdentityService
{
    public string ResolveActorKey(HttpContext context)
    {
        var request = context.Request;
        var forwardedFor = request.Headers["X-Forwarded-For"].ToString();
        var remoteIp = string.IsNullOrWhiteSpace(forwardedFor)
            ? context.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip"
            : forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault() ?? "unknown-ip";
        var userAgent = request.Headers["User-Agent"].ToString();
        var acceptLanguage = request.Headers["Accept-Language"].ToString();

        var rawFingerprint = $"{remoteIp}|{userAgent}|{acceptLanguage}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawFingerprint));
        var hash = Convert.ToHexString(bytes).ToLowerInvariant();

        return $"guest:{hash[..32]}";
    }
}
