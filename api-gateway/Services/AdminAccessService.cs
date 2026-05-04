namespace MoodLens.ApiGateway.Services;

public class AdminAccessService
{
    private readonly HashSet<string> _adminEmails;
    private readonly HashSet<string> _adminUsernames;

    public AdminAccessService(IConfiguration configuration)
    {
        _adminEmails = ParseList(configuration["ADMIN_EMAILS"]);
        _adminUsernames = ParseList(configuration["ADMIN_USERNAMES"]);
    }

    public bool IsAdmin(string? email, string? username)
    {
        var normalizedEmail = Normalize(email);
        if (!string.IsNullOrWhiteSpace(normalizedEmail) && _adminEmails.Contains(normalizedEmail))
        {
            return true;
        }

        var normalizedUsername = Normalize(username);
        return !string.IsNullOrWhiteSpace(normalizedUsername) && _adminUsernames.Contains(normalizedUsername);
    }

    private static HashSet<string> ParseList(string? rawValue)
    {
        return rawValue?
            .Split(new[] { ',', ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(Normalize)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase)
            ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    }

    private static string Normalize(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }
}
