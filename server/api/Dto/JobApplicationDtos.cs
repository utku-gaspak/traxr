using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.Dto;

public record JobApplicationCreateDto(
    [property: Required] string CompanyName,
    [property: Required] string Position,
    JobApplicationStatus Status
);

public record JobApplicationUpdateDto(
    [property: Required] string CompanyName,
    [property: Required] string Position,
    JobApplicationStatus Status,
    DateTime DateApplied
);
