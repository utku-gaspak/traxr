using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.Dto;

// Record primary-constructor validation must stay on the constructor parameters or ASP.NET will reject the metadata at runtime.
public record JobApplicationCreateDto(
    [Required] string CompanyName,
    [Required] string Position,
    string? JobUrl,
    string? Location,
    string? SalaryRange,
    string? JobDescription,
    JobApplicationStatus Status
);

public record JobApplicationUpdateDto(
    [Required] string CompanyName,
    [Required] string Position,
    string? JobUrl,
    string? Location,
    string? SalaryRange,
    string? JobDescription,
    JobApplicationStatus Status,
    DateTime DateApplied
);
