using System.ComponentModel.DataAnnotations;
using api.Data;
using api.Dto;
using api.Exceptions;
using api.Models;
using Npgsql;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class JobApplicationService(AppDbContext dbContext) : IJobApplicationService
{
    public async Task<JobApplication> CreateAsync(JobApplicationCreateDto dto, string userId)
    {
        ValidateCreateRequest(dto, userId);

        var jobApplication = new JobApplication
        {
            Id = Guid.NewGuid().ToString(),
            CompanyName = dto.CompanyName,
            Position = dto.Position,
            JobUrl = NormalizeOptionalText(dto.JobUrl),
            Location = NormalizeOptionalText(dto.Location),
            SalaryRange = NormalizeOptionalText(dto.SalaryRange),
            JobDescription = NormalizeOptionalText(dto.JobDescription),
            Notes = NormalizeOptionalText(dto.Notes),
            InterestLevel = dto.InterestLevel,
            TechnicalStack = NormalizeOptionalText(dto.TechnicalStack),
            Status = dto.Status,
            DateApplied = DateTime.UtcNow,
            UserId = userId,
        };

        dbContext.JobApplications.Add(jobApplication);
        try
        {
            await dbContext.SaveChangesAsync();
        }
        catch (PostgresException ex) when (IsMissingNotesColumn(ex))
        {
            dbContext.ChangeTracker.Clear();
            await EnsureNotesColumnExistsAsync();
            dbContext.JobApplications.Add(jobApplication);
            await dbContext.SaveChangesAsync();
        }

        return jobApplication;
    }

    public async Task<List<JobApplication>> GetAllAsync(string userId)
    {
        ValidateUserId(userId);

        try
        {
            return await dbContext
                .JobApplications.Where(jobApplication => jobApplication.UserId == userId)
                .OrderByDescending(jobApplication => jobApplication.DateApplied)
                .ToListAsync();
        }
        catch (PostgresException ex) when (IsMissingNotesColumn(ex))
        {
            return await LoadJobApplicationsWithoutNotesAsync(userId);
        }
    }

    public async Task<JobApplication> GetByIdAsync(string id, string userId)
    {
        ValidateId(id);
        ValidateUserId(userId);

        try
        {
            return await dbContext.JobApplications.FirstOrDefaultAsync(jobApplication =>
                    jobApplication.Id == id && jobApplication.UserId == userId
                ) ?? throw new NotFoundException("Job application could not be found");
        }
        catch (PostgresException ex) when (IsMissingNotesColumn(ex))
        {
            return await LoadJobApplicationWithoutNotesAsync(id, userId);
        }
    }

    public async Task UpdateAsync(string id, JobApplicationUpdateDto dto, string userId)
    {
        ValidateId(id);
        ValidateUpdateRequest(dto, userId);

        var jobApplication = await dbContext.JobApplications.FirstOrDefaultAsync(current =>
                current.Id == id && current.UserId == userId
            ) ?? throw new NotFoundException("Job application could not be found");

        jobApplication.CompanyName = dto.CompanyName;
        jobApplication.Position = dto.Position;
        jobApplication.JobUrl = NormalizeOptionalText(dto.JobUrl);
        jobApplication.Location = NormalizeOptionalText(dto.Location);
        jobApplication.SalaryRange = NormalizeOptionalText(dto.SalaryRange);
        jobApplication.JobDescription = NormalizeOptionalText(dto.JobDescription);
        jobApplication.Notes = NormalizeOptionalText(dto.Notes);
        jobApplication.InterestLevel = dto.InterestLevel;
        jobApplication.TechnicalStack = NormalizeOptionalText(dto.TechnicalStack);
        jobApplication.Status = dto.Status;
        jobApplication.DateApplied = dto.DateApplied;

        try
        {
            await dbContext.SaveChangesAsync();
        }
        catch (PostgresException ex) when (IsMissingNotesColumn(ex))
        {
            await EnsureNotesColumnExistsAsync();
            await dbContext.SaveChangesAsync();
        }
    }

    public async Task<bool> DeleteAsync(string id, string userId)
    {
        ValidateId(id);
        ValidateUserId(userId);

        var jobApplication = await dbContext.JobApplications.FirstOrDefaultAsync(current =>
            current.Id == id && current.UserId == userId
        );

        if (jobApplication == null)
            return false;

        dbContext.JobApplications.Remove(jobApplication);
        await dbContext.SaveChangesAsync();
        return true;
    }

    private static void ValidateCreateRequest(JobApplicationCreateDto? dto, string userId)
    {
        if (dto is null)
            throw new ValidationException("Job application payload is required.");

        ValidateUserId(userId);
        ValidateRequiredText(dto.CompanyName, nameof(dto.CompanyName));
        ValidateRequiredText(dto.Position, nameof(dto.Position));
        ValidateInterestLevel(dto.InterestLevel);
    }

    private static void ValidateUpdateRequest(JobApplicationUpdateDto? dto, string userId)
    {
        if (dto is null)
            throw new ValidationException("Job application payload is required.");

        ValidateUserId(userId);
        ValidateRequiredText(dto.CompanyName, nameof(dto.CompanyName));
        ValidateRequiredText(dto.Position, nameof(dto.Position));
        ValidateInterestLevel(dto.InterestLevel);
    }

    private static void ValidateId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ValidationException("Id is required.");
    }

    private static void ValidateUserId(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ValidationException("UserId is required.");
    }

    private static void ValidateRequiredText(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ValidationException($"{fieldName} is required.");
    }

    private static string? NormalizeOptionalText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }

    private static void ValidateInterestLevel(int? interestLevel)
    {
        if (interestLevel is < 1 or > 5)
            throw new ValidationException("InterestLevel must be between 1 and 5.");
    }

    private async Task<List<JobApplication>> LoadJobApplicationsWithoutNotesAsync(string userId) =>
        await dbContext
            .JobApplications.Where(jobApplication => jobApplication.UserId == userId)
            .OrderByDescending(jobApplication => jobApplication.DateApplied)
            .Select(jobApplication => new JobApplication
            {
                Id = jobApplication.Id,
                CompanyName = jobApplication.CompanyName,
                Position = jobApplication.Position,
                JobUrl = jobApplication.JobUrl,
                Location = jobApplication.Location,
                SalaryRange = jobApplication.SalaryRange,
                JobDescription = jobApplication.JobDescription,
                InterestLevel = jobApplication.InterestLevel,
                TechnicalStack = jobApplication.TechnicalStack,
                Status = jobApplication.Status,
                DateApplied = jobApplication.DateApplied,
                UserId = jobApplication.UserId,
            })
            .ToListAsync();

    private async Task<JobApplication> LoadJobApplicationWithoutNotesAsync(
        string id,
        string userId
    )
    {
        return await dbContext
                .JobApplications.Where(jobApplication =>
                    jobApplication.Id == id && jobApplication.UserId == userId
                )
                .Select(jobApplication => new JobApplication
                {
                    Id = jobApplication.Id,
                    CompanyName = jobApplication.CompanyName,
                    Position = jobApplication.Position,
                    JobUrl = jobApplication.JobUrl,
                    Location = jobApplication.Location,
                    SalaryRange = jobApplication.SalaryRange,
                    JobDescription = jobApplication.JobDescription,
                    InterestLevel = jobApplication.InterestLevel,
                    TechnicalStack = jobApplication.TechnicalStack,
                    Status = jobApplication.Status,
                    DateApplied = jobApplication.DateApplied,
                    UserId = jobApplication.UserId,
                })
                .FirstOrDefaultAsync()
            ?? throw new NotFoundException("Job application could not be found");
    }

    private static bool IsMissingNotesColumn(PostgresException exception) =>
        exception.SqlState == PostgresErrorCodes.UndefinedColumn
        && exception.MessageText.Contains("Notes", StringComparison.OrdinalIgnoreCase);

    private async Task EnsureNotesColumnExistsAsync() =>
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "JobApplications"
            ADD COLUMN IF NOT EXISTS "Notes" text NULL;
            """);
}
