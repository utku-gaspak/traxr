using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.Dto;

// Record primary-constructor validation must stay on the constructor parameters or ASP.NET will reject the metadata at runtime.
public record JobApplicationCreateDto(
    [Required] string CompanyName,
    [Required] string Position,
    JobApplicationStatus Status
);

public record JobApplicationUpdateDto(
    [Required] string CompanyName,
    [Required] string Position,
    JobApplicationStatus Status,
    DateTime DateApplied
);
