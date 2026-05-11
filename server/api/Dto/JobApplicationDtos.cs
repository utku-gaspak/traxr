using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.Dto;

// Use property-targeted attributes so ASP.NET model validation and OpenAPI mark these fields as required.
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
