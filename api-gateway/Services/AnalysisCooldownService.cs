using System.Collections.Concurrent;
using System.Text.Json;

namespace MoodLens.ApiGateway.Services;

public class AnalysisCooldownService
{
    private static readonly TimeSpan ProgressTtl = TimeSpan.FromMinutes(15);
    private readonly ConcurrentDictionary<string, RetryState> _states = new();
    private readonly RedisCacheService _redis;

    public AnalysisCooldownService(RedisCacheService redis)
    {
        _redis = redis;
    }

    public bool TryGetRemainingSeconds(string? actorKey, out int remainingSeconds, out string? cooldownReason)
    {
        remainingSeconds = 0;
        cooldownReason = null;
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return false;
        }

        if (ReadState(actorKey) is not { } state || state.CooldownUntil is null)
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
        cooldownReason = state.CooldownReason;
        return true;
    }

    public int GetCurrentAttemptIndex(string? actorKey)
    {
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return 0;
        }

        if (ReadState(actorKey) is not { } state)
        {
            return 0;
        }

        if (state.CooldownUntil is { } cooldownUntil && cooldownUntil <= DateTimeOffset.UtcNow)
        {
            ClearCooldown(actorKey, state);
            if (ReadState(actorKey) is not { } refreshedState)
            {
                return 0;
            }

            state = refreshedState;
        }

        return Math.Clamp(state.AttemptIndex, 0, 2);
    }

    public void AdvanceContradictionAttempt(string? actorKey)
    {
        AdvanceRetryAttempt(actorKey);
    }

    public void AdvanceRetryAttempt(string? actorKey)
    {
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return;
        }

        var existing = ReadState(actorKey);
        StoreState(
            actorKey,
            new RetryState(
                Math.Clamp((existing?.AttemptIndex ?? 0) + 1, 0, 2),
                NormalizeCooldown(existing?.CooldownUntil),
                existing?.CooldownReason
            ),
            ProgressTtl
        );
    }

    public void ResetProgress(string? actorKey)
    {
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return;
        }

        _states.TryRemove(actorKey, out _);
        _redis.TryDelete(CacheKey(actorKey));
    }

    public void StartCooldown(string? actorKey, int seconds, string? reason = null)
    {
        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return;
        }

        var normalizedSeconds = Math.Max(1, seconds);
        var state = new RetryState(0, DateTimeOffset.UtcNow.AddSeconds(normalizedSeconds), reason);
        StoreState(actorKey, state, TimeSpan.FromSeconds(normalizedSeconds).Add(TimeSpan.FromMinutes(5)));
    }

    private void ClearCooldown(string actorKey, RetryState state)
    {
        if (state.AttemptIndex <= 0)
        {
            _states.TryRemove(actorKey, out _);
            _redis.TryDelete(CacheKey(actorKey));
            return;
        }

        StoreState(actorKey, state with { CooldownUntil = null, CooldownReason = null }, ProgressTtl);
    }

    private static DateTimeOffset? NormalizeCooldown(DateTimeOffset? cooldownUntil)
    {
        if (cooldownUntil is null)
        {
            return null;
        }

        return cooldownUntil <= DateTimeOffset.UtcNow ? null : cooldownUntil;
    }

    private RetryState? ReadState(string actorKey)
    {
        if (_redis.TryGetString(CacheKey(actorKey), out var payload) &&
            !string.IsNullOrWhiteSpace(payload))
        {
            try
            {
                var redisState = JsonSerializer.Deserialize<RetryState>(payload);
                if (redisState is not null)
                {
                    _states[actorKey] = redisState;
                    return redisState;
                }
            }
            catch (JsonException)
            {
                _redis.TryDelete(CacheKey(actorKey));
            }
        }

        return _states.TryGetValue(actorKey, out var state) ? state : null;
    }

    private void StoreState(string actorKey, RetryState state, TimeSpan ttl)
    {
        _states[actorKey] = state;
        _redis.TrySetString(CacheKey(actorKey), JsonSerializer.Serialize(state), ttl);
    }

    private static string CacheKey(string actorKey) => $"analysis-cooldown:{actorKey}";

    private sealed record RetryState(int AttemptIndex, DateTimeOffset? CooldownUntil, string? CooldownReason);
}
