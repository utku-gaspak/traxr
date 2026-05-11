using api;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace JobTracker.Tests;

public class GlobalExceptionHandlerTests
{
    [Theory]
    [MemberData(nameof(KnownExceptionCases))]
    public async Task TryHandleAsync_KnownException_ShouldWriteMappedProblemDetails(
        Exception exception,
        int expectedStatusCode,
        string expectedTitle,
        string expectedDetail
    )
    {
        var handler = CreateHandler();
        var httpContext = CreateHttpContext();

        var handled = await handler.TryHandleAsync(httpContext, exception, CancellationToken.None);

        handled.Should().BeTrue();
        httpContext.Response.StatusCode.Should().Be(expectedStatusCode);

        var problemDetails = await ReadProblemDetailsAsync(httpContext);
        problemDetails.Status.Should().Be(expectedStatusCode);
        problemDetails.Title.Should().Be(expectedTitle);
        problemDetails.Detail.Should().Be(expectedDetail);
        problemDetails.Instance.Should().Be("/api/test");
    }

    [Fact]
    public async Task TryHandleAsync_UnknownException_ShouldWriteGenericInternalServerError()
    {
        var handler = CreateHandler();
        var httpContext = CreateHttpContext();

        var handled = await handler.TryHandleAsync(
            httpContext,
            new InvalidOperationException("sensitive detail"),
            CancellationToken.None
        );

        handled.Should().BeTrue();
        httpContext.Response.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);

        var problemDetails = await ReadProblemDetailsAsync(httpContext);
        problemDetails.Status.Should().Be((int)HttpStatusCode.InternalServerError);
        problemDetails.Title.Should().Be("Internal Server Error");
        problemDetails.Detail.Should().Be("An unexpected error occurred.");
        problemDetails.Instance.Should().Be("/api/test");
    }

    public static TheoryData<Exception, int, string, string> KnownExceptionCases()
    {
        return new TheoryData<Exception, int, string, string>
        {
            {
                new ValidationException("Invalid payload."),
                (int)HttpStatusCode.BadRequest,
                "Bad Request",
                "Invalid payload."
            },
            {
                new NotFoundException("Missing record."),
                (int)HttpStatusCode.NotFound,
                "Not Found",
                "Missing record."
            },
            {
                new UnauthorizedAccessException("No access."),
                (int)HttpStatusCode.Unauthorized,
                "Unauthorized",
                "No access."
            },
        };
    }

    private static GlobalExceptionHandler CreateHandler()
    {
        return new GlobalExceptionHandler(Mock.Of<ILogger<GlobalExceptionHandler>>());
    }

    private static DefaultHttpContext CreateHttpContext()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = HttpMethods.Get;
        httpContext.Request.Path = "/api/test";
        httpContext.Response.Body = new MemoryStream();
        return httpContext;
    }

    private static async Task<ProblemDetails> ReadProblemDetailsAsync(HttpContext httpContext)
    {
        httpContext.Response.Body.Position = 0;

        var problemDetails = await JsonSerializer.DeserializeAsync<ProblemDetails>(
            httpContext.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        return problemDetails!;
    }
}
