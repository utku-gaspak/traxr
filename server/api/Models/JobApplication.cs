using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

public enum JobApplicationStatus
{
    Applied,
    Interviewing,
    Rejected,
    Offer,
}

public class JobApplication
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string CompanyName { get; set; } = string.Empty;

    [Required]
    public string Position { get; set; } = string.Empty;

    public string? JobUrl { get; set; }

    public string? Location { get; set; }

    public string? SalaryRange { get; set; }

    [Column(TypeName = "text")]
    public string? JobDescription { get; set; }

    public JobApplicationStatus Status { get; set; } = JobApplicationStatus.Applied;

    public DateTime DateApplied { get; set; } = DateTime.UtcNow;

    public string UserId { get; set; } = string.Empty;

    public AppUser User { get; set; } = null!;
}
