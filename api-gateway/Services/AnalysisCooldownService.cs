using System.Collections.Concurrent;

namespace MoodLens.ApiGateway.Services;

public class AnalysisCooldownService
{
    private readonly ConcurrentDictionary<string, RetryState> _states = new();

    public bool TryGetRemainingSeconds(string? actorKey, out int remainingSeconds)
    {
        remainingSeconds = 0;
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return false;
        }

        if (!_states.TryGetValue(actorKey, out var state) || state.CooldownUntil is null)
        {
            return false;
        }

        var now = DateTimeOffset.UtcNow;
        if (state.CooldownUntil <= now)
        {
            ClearCooldown(actorKey, state);
            return false;
        }

        remainingSeconds = Math.Max(1, (int)Math.Ceiling((state.CooldownUntil.Value - now).TotalSeconds));
        return true;
    }

    public int GetCurrentAttemptIndex(string? actorKey)
    {
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return 0;
        }

        if (!_states.TryGetValue(actorKey, out var state))
        {
            return 0;
        }

        if (state.CooldownUntil is { } cooldownUntil && cooldownUntil <= DateTimeOffset.UtcNow)
        {
            ClearCooldown(actorKey, state);
            if (!_states.TryGetValue(actorKey, out state))
            {
                return 0;
            }
        }

        return Math.Clamp(state.AttemptIndex, 0, 2);
    }

    public void AdvanceContradictionAttempt(string? actorKey)
    {
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return;
        }

        _states.AddOrUpdate(
            actorKey,
            _ => new RetryState(1, null),
            (_, existing) => new RetryState(
                Math.Clamp(existing.AttemptIndex + 1, 0, 2),
                NormalizeCooldown(existing.CooldownUntil)
            )
        );
    }

    public void ResetProgress(string? actorKey)
    {
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return;
        }

        _states.TryRemove(actorKey, out _);
    }

    public void StartCooldown(string? actorKey, int seconds)
    {
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return;
        }

        var normalizedSeconds = Math.Max(1, seconds);
        _states[actorKey] = new RetryState(0, DateTimeOffset.UtcNow.AddSeconds(normalizedSeconds));
    }

    private void ClearCooldown(string actorKey, RetryState state)
    {
        if (state.AttemptIndex <= 0)
        {
            _states.TryRemove(actorKey, out _);
            return;
        }

        _states[actorKey] = state with { CooldownUntil = null };
    }

    private static DateTimeOffset? NormalizeCooldown(DateTimeOffset? cooldownUntil)
    {
        if (cooldownUntil is null)
        {
            return null;
        }

        return cooldownUntil <= DateTimeOffset.UtcNow ? null : cooldownUntil;
    }

    private sealed record RetryState(int AttemptIndex, DateTimeOffset? CooldownUntil);
}
