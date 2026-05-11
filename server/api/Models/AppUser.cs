using Microsoft.AspNetCore.Identity;

namespace api.Models;

public class AppUser : IdentityUser
{
    public List<JobApplication> JobApplications { get; set; } = new();
}
