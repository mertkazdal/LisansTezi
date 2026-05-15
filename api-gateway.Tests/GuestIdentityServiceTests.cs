using System.Net;
using Microsoft.AspNetCore.Http;
using MoodLens.ApiGateway.Services;
using Xunit;

namespace MoodLens.ApiGateway.Tests;

public class GuestIdentityServiceTests
{
    [Fact]
    public void ResolveActorKey_ReturnsStableHashForSameRequestFingerprint()
    {
        var service = new GuestIdentityService();
        var firstContext = CreateContext();
        var secondContext = CreateContext();

        var first = service.ResolveActorKey(firstContext);
        var second = service.ResolveActorKey(secondContext);

        Assert.Equal(first, second);
        Assert.StartsWith("guest:", first);
        Assert.Equal("guest:".Length + 32, first.Length);
    }

    [Fact]
    public void ResolveActorKey_UsesFirstForwardedIpWhenPresent()
    {
        var service = new GuestIdentityService();
        var context = CreateContext();
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.9, 198.51.100.5";

        var actorKey = service.ResolveActorKey(context);

        Assert.StartsWith("guest:", actorKey);
        Assert.Equal("guest:".Length + 32, actorKey.Length);
    }

    private static DefaultHttpContext CreateContext()
    {
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = IPAddress.Parse("127.0.0.1");
        context.Request.Headers["User-Agent"] = "test-agent";
        context.Request.Headers["Accept-Language"] = "tr-TR";
        return context;
    }
}
