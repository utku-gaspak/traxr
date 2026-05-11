using api.Data;
using api.Dto;
using api.Exceptions;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class JobApplicationService(AppDbContext dbContext) : IJobApplicationService
{
    public async Task<JobApplication> CreateAsync(JobApplicationCreateDto dto, string userId)
    {
        var jobApplication = new JobApplication
        {
            Id = Guid.NewGuid().ToString(),
            CompanyName = dto.CompanyName,
            Position = dto.Position,
            Status = dto.Status,
            DateApplied = DateTime.UtcNow,
            UserId = userId,
        };

        dbContext.JobApplications.Add(jobApplication);
        await dbContext.SaveChangesAsync();
        return jobApplication;
    }

    public async Task<List<JobApplication>> GetAllAsync(string userId)
    {
        return await dbContext
            .JobApplications.Where(jobApplication => jobApplication.UserId == userId)
            .OrderByDescending(jobApplication => jobApplication.DateApplied)
            .ToListAsync();
    }

    public async Task<JobApplication> GetByIdAsync(string id, string userId)
    {
        return await dbContext.JobApplications.FirstOrDefaultAsync(jobApplication =>
                jobApplication.Id == id && jobApplication.UserId == userId
            ) ?? throw new NotFoundException("Job application could not be found");
    }

    public async Task<JobApplication> UpdateAsync(
        string id,
        JobApplicationUpdateDto dto,
        string userId
    )
    {
        var jobApplication = await dbContext.JobApplications.FirstOrDefaultAsync(current =>
                current.Id == id && current.UserId == userId
            ) ?? throw new NotFoundException("Job application could not be found");

        jobApplication.CompanyName = dto.CompanyName;
        jobApplication.Position = dto.Position;
        jobApplication.Status = dto.Status;
        jobApplication.DateApplied = dto.DateApplied;

        await dbContext.SaveChangesAsync();
        return jobApplication;
    }

    public async Task<bool> DeleteAsync(string id, string userId)
    {
        var jobApplication = await dbContext.JobApplications.FirstOrDefaultAsync(current =>
            current.Id == id && current.UserId == userId
        );

        if (jobApplication == null)
            return false;

        dbContext.JobApplications.Remove(jobApplication);
        await dbContext.SaveChangesAsync();
        return true;
    }
}
