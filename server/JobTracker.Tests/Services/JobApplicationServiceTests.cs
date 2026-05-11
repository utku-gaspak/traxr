namespace JobTracker.Tests.Services;

public class JobApplicationServiceTests(TestAppDbContextFactory dbContextFactory)
    : IClassFixture<TestAppDbContextFactory>
{
    [Fact]
    public async Task CreateAsync_ValidRequest_PersistsJobApplication()
    {
        await using var dbContext = dbContextFactory.CreateContext();
        var service = new JobApplicationService(dbContext);
        var dto = new JobApplicationCreateDto("Acme", "Backend Engineer", JobApplicationStatus.Applied);

        var result = await service.CreateAsync(dto, "user-1");

        result.Should().NotBeNull();
        result.CompanyName.Should().Be("Acme");
        result.Position.Should().Be("Backend Engineer");
        result.UserId.Should().Be("user-1");
        result.Id.Should().NotBeNullOrWhiteSpace();

        var persisted = await dbContext.JobApplications.SingleAsync();
        persisted.CompanyName.Should().Be("Acme");
        persisted.Position.Should().Be("Backend Engineer");
        persisted.UserId.Should().Be("user-1");
    }

    [Fact]
    public async Task GetAllAsync_MultipleUsersExist_ReturnsOnlyCurrentUsersData()
    {
        await using var dbContext = dbContextFactory.CreateContext();
        var service = new JobApplicationService(dbContext);

        dbContext.JobApplications.AddRange(
            new JobApplication
            {
                Id = "user-1-latest",
                CompanyName = "Contoso",
                Position = "Senior Engineer",
                Status = JobApplicationStatus.Interviewing,
                DateApplied = new DateTime(2026, 05, 10, 10, 00, 00, DateTimeKind.Utc),
                UserId = "user-1",
            },
            new JobApplication
            {
                Id = "user-2-only",
                CompanyName = "Globex",
                Position = "Platform Engineer",
                Status = JobApplicationStatus.Applied,
                DateApplied = new DateTime(2026, 05, 09, 10, 00, 00, DateTimeKind.Utc),
                UserId = "user-2",
            },
            new JobApplication
            {
                Id = "user-1-earlier",
                CompanyName = "Fabrikam",
                Position = "Software Engineer",
                Status = JobApplicationStatus.Offer,
                DateApplied = new DateTime(2026, 05, 08, 10, 00, 00, DateTimeKind.Utc),
                UserId = "user-1",
            }
        );

        await dbContext.SaveChangesAsync();

        var result = await service.GetAllAsync("user-1");

        result.Should().HaveCount(2);
        result.Should().OnlyContain(jobApplication => jobApplication.UserId == "user-1");
        result.Select(jobApplication => jobApplication.Id)
            .Should()
            .Equal("user-1-latest", "user-1-earlier");
    }

    [Fact]
    public async Task UpdateAsync_RecordOwnedByAnotherUser_ShouldThrowNotFoundException()
    {
        await using var dbContext = dbContextFactory.CreateContext();
        var service = new JobApplicationService(dbContext);
        var existing = new JobApplication
        {
            Id = "job-1",
            CompanyName = "Acme",
            Position = "Engineer",
            Status = JobApplicationStatus.Applied,
            DateApplied = new DateTime(2026, 05, 01, 12, 00, 00, DateTimeKind.Utc),
            UserId = "owner-user",
        };

        dbContext.JobApplications.Add(existing);
        await dbContext.SaveChangesAsync();

        var dto = new JobApplicationUpdateDto(
            "Acme Updated",
            "Staff Engineer",
            JobApplicationStatus.Interviewing,
            new DateTime(2026, 05, 11, 12, 00, 00, DateTimeKind.Utc)
        );

        Func<Task> act = async () => await service.UpdateAsync(existing.Id, dto, "other-user");

        await act.Should().ThrowAsync<NotFoundException>();

        var persisted = await dbContext.JobApplications.SingleAsync();
        persisted.CompanyName.Should().Be("Acme");
        persisted.Position.Should().Be("Engineer");
        persisted.Status.Should().Be(JobApplicationStatus.Applied);
    }

    [Fact]
    public async Task DeleteAsync_RecordOwnedByAnotherUser_ShouldReturnFalse()
    {
        await using var dbContext = dbContextFactory.CreateContext();
        var service = new JobApplicationService(dbContext);
        var existing = new JobApplication
        {
            Id = "job-1",
            CompanyName = "Acme",
            Position = "Engineer",
            Status = JobApplicationStatus.Applied,
            UserId = "owner-user",
        };

        dbContext.JobApplications.Add(existing);
        await dbContext.SaveChangesAsync();

        var result = await service.DeleteAsync(existing.Id, "other-user");

        result.Should().BeFalse();
        dbContext.JobApplications.Should().ContainSingle();
        (await dbContext.JobApplications.SingleAsync()).Id.Should().Be(existing.Id);
    }

    [Fact]
    public async Task CreateAsync_NullDto_ShouldThrowValidationException()
    {
        await using var dbContext = dbContextFactory.CreateContext();
        var service = new JobApplicationService(dbContext);

        Func<Task> act = async () => await service.CreateAsync(null!, "user-1");

        var exceptionAssertions = await act.Should().ThrowAsync<ValidationException>();

        exceptionAssertions.WithMessage("Job application payload is required.");
        dbContext.JobApplications.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateAsync_EmptyCompanyName_ShouldThrowValidationException()
    {
        await using var dbContext = dbContextFactory.CreateContext();
        var service = new JobApplicationService(dbContext);
        var dto = new JobApplicationCreateDto(" ", "Backend Engineer", JobApplicationStatus.Applied);

        Func<Task> act = async () => await service.CreateAsync(dto, "user-1");

        var exceptionAssertions = await act.Should().ThrowAsync<ValidationException>();

        exceptionAssertions.WithMessage("CompanyName is required.");
        dbContext.JobApplications.Should().BeEmpty();
    }

    [Fact]
    public async Task UpdateAsync_EmptyPosition_ShouldThrowValidationException()
    {
        await using var dbContext = dbContextFactory.CreateContext();
        var service = new JobApplicationService(dbContext);
        var existing = new JobApplication
        {
            Id = "job-1",
            CompanyName = "Acme",
            Position = "Engineer",
            Status = JobApplicationStatus.Applied,
            DateApplied = new DateTime(2026, 05, 01, 12, 00, 00, DateTimeKind.Utc),
            UserId = "owner-user",
        };

        dbContext.JobApplications.Add(existing);
        await dbContext.SaveChangesAsync();

        var dto = new JobApplicationUpdateDto(
            "Acme Updated",
            "",
            JobApplicationStatus.Interviewing,
            new DateTime(2026, 05, 11, 12, 00, 00, DateTimeKind.Utc)
        );

        Func<Task> act = async () => await service.UpdateAsync(existing.Id, dto, "owner-user");

        var exceptionAssertions = await act.Should().ThrowAsync<ValidationException>();

        exceptionAssertions.WithMessage("Position is required.");

        var persisted = await dbContext.JobApplications.SingleAsync();
        persisted.CompanyName.Should().Be("Acme");
        persisted.Position.Should().Be("Engineer");
        persisted.Status.Should().Be(JobApplicationStatus.Applied);
    }
}
