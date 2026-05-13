using Moq;

namespace JobTracker.Tests.Controllers;

public class JobApplicationsControllerTests
{
    [Fact]
    public async Task GetAll_AuthenticatedUser_ShouldPassClaimUserIdToService()
    {
        const string userId = "user-123";
        var expectedApplications = new List<JobApplication>
        {
            new()
            {
                Id = "job-1",
                CompanyName = "Acme",
                Position = "Backend Engineer",
                Status = JobApplicationStatus.Applied,
                UserId = userId,
            },
        };

        var serviceMock = new Mock<IJobApplicationService>(MockBehavior.Strict);
        serviceMock.Setup(service => service.GetAllAsync(userId)).ReturnsAsync(expectedApplications);

        var controller = new ControllerTestContext(userId).AttachTo(
            new JobApplicationsController(serviceMock.Object)
        );

        var result = await controller.GetAll();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(expectedApplications);
        serviceMock.Verify(service => service.GetAllAsync(userId), Times.Once);
    }

    [Fact]
    public async Task GetAll_MissingNameIdentifierClaim_ShouldReturnUnauthorized()
    {
        var serviceMock = new Mock<IJobApplicationService>(MockBehavior.Strict);
        var controller = new JobApplicationsController(serviceMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(authenticationType: "TestAuthentication")),
                },
            },
        };

        var result = await controller.GetAll();

        result.Result.Should().BeOfType<UnauthorizedResult>();
        serviceMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetById_AuthenticatedUser_ShouldPassClaimUserIdToService()
    {
        const string userId = "user-123";
        const string jobId = "job-1";
        var expectedApplication = new JobApplication
        {
            Id = jobId,
            CompanyName = "Acme",
            Position = "Backend Engineer",
            Status = JobApplicationStatus.Applied,
            UserId = userId,
        };

        var serviceMock = new Mock<IJobApplicationService>(MockBehavior.Strict);
        serviceMock
            .Setup(service => service.GetByIdAsync(jobId, userId))
            .ReturnsAsync(expectedApplication);

        var controller = new ControllerTestContext(userId).AttachTo(
            new JobApplicationsController(serviceMock.Object)
        );

        var result = await controller.GetById(jobId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(expectedApplication);
        serviceMock.Verify(service => service.GetByIdAsync(jobId, userId), Times.Once);
    }

    [Fact]
    public async Task Create_AuthenticatedUser_ShouldPassClaimUserIdToService()
    {
        const string userId = "user-123";
        var dto = new JobApplicationCreateDto(
            "Acme",
            "Backend Engineer",
            "https://example.com/jobs/acme-backend",
            "Remote",
            "$100k - $120k",
            "Full role description",
            "Private note",
            4,
            "C#, React",
            JobApplicationStatus.Applied
        );
        var createdApplication = new JobApplication
        {
            Id = "job-1",
            CompanyName = dto.CompanyName,
            Position = dto.Position,
            JobUrl = dto.JobUrl,
            Location = dto.Location,
            SalaryRange = dto.SalaryRange,
            JobDescription = dto.JobDescription,
            Notes = dto.Notes,
            InterestLevel = dto.InterestLevel,
            TechnicalStack = dto.TechnicalStack,
            Status = dto.Status,
            UserId = userId,
        };

        var serviceMock = new Mock<IJobApplicationService>(MockBehavior.Strict);
        serviceMock
            .Setup(service => service.CreateAsync(dto, userId))
            .ReturnsAsync(createdApplication);

        var controller = new ControllerTestContext(userId).AttachTo(
            new JobApplicationsController(serviceMock.Object)
        );

        var result = await controller.Create(dto);

        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(JobApplicationsController.GetById));
        createdResult.RouteValues.Should().ContainKey("id").WhoseValue.Should().Be(createdApplication.Id);
        createdResult.Value.Should().BeEquivalentTo(createdApplication);
        serviceMock.Verify(service => service.CreateAsync(dto, userId), Times.Once);
    }

    [Fact]
    public async Task Update_AuthenticatedUser_ShouldPassClaimUserIdToService()
    {
        const string userId = "user-123";
        const string jobId = "job-1";
        var dto = new JobApplicationUpdateDto(
            "Acme",
            "Staff Engineer",
            null,
            "London",
            null,
            "Updated role description",
            "Updated note",
            3,
            "TypeScript, .NET",
            JobApplicationStatus.Interviewing,
            new DateTime(2026, 05, 11, 12, 00, 00, DateTimeKind.Utc)
        );

        var serviceMock = new Mock<IJobApplicationService>(MockBehavior.Strict);
        serviceMock
            .Setup(service => service.UpdateAsync(jobId, dto, userId))
            .Returns(Task.CompletedTask);

        var controller = new ControllerTestContext(userId).AttachTo(
            new JobApplicationsController(serviceMock.Object)
        );

        var result = await controller.Update(jobId, dto);

        result.Should().BeOfType<NoContentResult>();
        serviceMock.Verify(service => service.UpdateAsync(jobId, dto, userId), Times.Once);
    }

    [Fact]
    public async Task Delete_AuthenticatedUser_ShouldPassClaimUserIdToService()
    {
        const string userId = "user-123";
        const string jobId = "job-1";

        var serviceMock = new Mock<IJobApplicationService>(MockBehavior.Strict);
        serviceMock.Setup(service => service.DeleteAsync(jobId, userId)).ReturnsAsync(true);

        var controller = new ControllerTestContext(userId).AttachTo(
            new JobApplicationsController(serviceMock.Object)
        );

        var result = await controller.Delete(jobId);

        result.Should().BeOfType<NoContentResult>();
        serviceMock.Verify(service => service.DeleteAsync(jobId, userId), Times.Once);
    }
}
