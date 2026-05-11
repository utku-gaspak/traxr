using api.Dto;
using api.Models;

namespace api.Services;

public interface IJobApplicationService
{
    Task<JobApplication> CreateAsync(JobApplicationCreateDto dto, string userId);
    Task<List<JobApplication>> GetAllAsync(string userId);
    Task<JobApplication> GetByIdAsync(string id, string userId);
    Task<JobApplication> UpdateAsync(string id, JobApplicationUpdateDto dto, string userId);
    Task<bool> DeleteAsync(string id, string userId);
}
