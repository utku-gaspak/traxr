using System.Security.Claims;
using api.Dto;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobApplicationsController(IJobApplicationService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<JobApplication>>> GetAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var jobApplications = await service.GetAllAsync(userId);
        return Ok(jobApplications);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JobApplication>> GetById([FromRoute] string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var jobApplication = await service.GetByIdAsync(id, userId);
        return Ok(jobApplication);
    }

    [HttpPost]
    public async Task<ActionResult<JobApplication>> Create([FromBody] JobApplicationCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var jobApplication = await service.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = jobApplication.Id }, jobApplication);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        [FromRoute] string id,
        [FromBody] JobApplicationUpdateDto dto
    )
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        await service.UpdateAsync(id, dto, userId);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var deleted = await service.DeleteAsync(id, userId);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
