using System.Net;
using System.Net.Http.Json;
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

    [Fact]
    public async Task CreateJobApplication_MissingRequiredFields_ShouldReturnBadRequest()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/JobApplications")
        {
            Content = JsonContent.Create(new
            {
                status = JobApplicationStatus.Applied,
            }),
        };
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {CreateToken()}");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateJobApplication_MissingRequiredFields_ShouldReturnBadRequest()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Put, "/api/JobApplications/job-1")
        {
            Content = JsonContent.Create(new
            {
                status = JobApplicationStatus.Interviewing,
                dateApplied = new DateTime(2026, 05, 11, 12, 00, 00, DateTimeKind.Utc),
            }),
        };
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {CreateToken()}");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
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
