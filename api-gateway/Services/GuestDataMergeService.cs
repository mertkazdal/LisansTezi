using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;

namespace MoodLens.ApiGateway.Services;

public class GuestDataMergeService
{
    private readonly AppDbContext _db;

    public GuestDataMergeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<int> ClaimGuestAnalysesAsync(Guid userId, string? guestSessionId)
    {
        var normalizedGuestSessionId = guestSessionId?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedGuestSessionId))
        {
            return 0;
        }

        var histories = await _db.EmotionHistories
            .Where(h => h.UserId == null && h.GuestSessionId == normalizedGuestSessionId)
            .ToListAsync();

        if (histories.Count == 0)
        {
            return 0;
        }

        foreach (var history in histories)
        {
            history.UserId = userId;
            history.GuestSessionId = null;
        }

        await _db.SaveChangesAsync();
        return histories.Count;
    }
}
