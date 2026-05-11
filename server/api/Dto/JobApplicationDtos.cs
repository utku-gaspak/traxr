using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.Dto;

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
