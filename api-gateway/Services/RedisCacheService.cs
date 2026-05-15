using StackExchange.Redis;

namespace MoodLens.ApiGateway.Services;

public sealed class RedisCacheService
{
    private readonly string? _connectionString;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly object _syncRoot = new();
    private IConnectionMultiplexer? _connection;
    private DateTimeOffset _lastFailureAt = DateTimeOffset.MinValue;

    public RedisCacheService(IConfiguration configuration, ILogger<RedisCacheService> logger)
    {
        _connectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
            ?? configuration["Redis:ConnectionString"];
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_connectionString);

    public bool TryGetString(string key, out string? value)
    {
        value = null;
        try
        {
            var database = GetDatabase();
            if (database is null)
            {
                return false;
            }

            var redisValue = database.StringGet(key);
            if (!redisValue.HasValue)
            {
                return false;
            }

            value = redisValue.ToString();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis read failed for key {RedisKey}", key);
            return false;
        }
    }

    public bool TrySetString(string key, string value, TimeSpan? expiry = null)
    {
        try
        {
            var database = GetDatabase();
            return database is not null && database.StringSet(key, value, expiry);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis write failed for key {RedisKey}", key);
            return false;
        }
    }

    public bool TryDelete(string key)
    {
        try
        {
            var database = GetDatabase();
            return database is not null && database.KeyDelete(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis delete failed for key {RedisKey}", key);
            return false;
        }
    }

    public async Task<RedisHealthStatus> CheckAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            return new RedisHealthStatus(false, false, null, "not_configured");
        }

        try
        {
            var database = GetDatabase();
            if (database is null)
            {
                return new RedisHealthStatus(true, false, null, "connection_unavailable");
            }

            var latency = await database.PingAsync().WaitAsync(cancellationToken);
            return new RedisHealthStatus(true, true, (long)latency.TotalMilliseconds, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis health check failed");
            return new RedisHealthStatus(true, false, null, ex.GetType().Name);
        }
    }

    private IDatabase? GetDatabase()
    {
        var connection = GetConnection();
        return connection?.IsConnected == true ? connection.GetDatabase() : null;
    }

    private IConnectionMultiplexer? GetConnection()
    {
        if (!IsConfigured)
        {
            return null;
        }

        if (_connection?.IsConnected == true)
        {
            return _connection;
        }

        if (DateTimeOffset.UtcNow - _lastFailureAt < TimeSpan.FromSeconds(15))
        {
            return null;
        }

        lock (_syncRoot)
        {
            if (_connection?.IsConnected == true)
            {
                return _connection;
            }

            try
            {
                _connection?.Dispose();
                _connection = ConnectionMultiplexer.Connect(_connectionString!);
                _logger.LogInformation("Redis connection established");
                return _connection;
            }
            catch (Exception ex)
            {
                _lastFailureAt = DateTimeOffset.UtcNow;
                _logger.LogWarning(ex, "Redis connection unavailable; falling back to in-memory cache");
                return null;
            }
        }
    }
}

public sealed record RedisHealthStatus(
    bool Configured,
    bool Available,
    long? LatencyMs,
    string? Error
);
