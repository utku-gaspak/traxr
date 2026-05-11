using System.Net;
using Microsoft.Extensions.Configuration;

namespace JobTracker.Tests.Integration;

public class ApiStartupAndAuthTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    [Fact]
    public async Task ProtectedEndpoint_WithoutAuth_ShouldReturnUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/JobApplications");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidBearerToken_ShouldReturnSuccess()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/JobApplications");
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {CreateToken()}");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithWhitespaceInBearerToken_ShouldReturnSuccess()
    {
        var client = factory.CreateClient();
        var tokenWithWhitespace = string.Join(" ", CreateToken().Chunk(20).Select(chars => new string(chars)));
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/JobApplications");
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {tokenWithWhitespace}");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CorsPolicy_ShouldAllowReactDevelopmentOrigin()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/JobApplications");
        request.Headers.TryAddWithoutValidation("Origin", "http://localhost:5173");
        request.Headers.TryAddWithoutValidation("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.Headers.GetValues("Access-Control-Allow-Origin")
            .Should()
            .ContainSingle()
            .Which.Should()
            .Be("http://localhost:5173");
    }

    private static string CreateToken()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["JWT:SigningKey"] = ApiApplicationFactory.SigningKey,
                    ["JWT:Issuer"] = "job-tracker-tests",
                    ["JWT:Audience"] = "job-tracker-client-tests",
                }
            )
            .Build();

        return new TokenService(configuration)
            .CreateToken(
                new AppUser
                {
                    Id = "user-1",
                    UserName = "utku",
                    Email = "utku@example.com",
                }
            );
    }
}
