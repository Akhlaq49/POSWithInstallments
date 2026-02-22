using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.Models;
using System.Security.Claims;

namespace ReactPosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolePermissionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RolePermissionsController(AppDbContext db) => _db = db;

    /// <summary>
    /// Get allowed menu keys for the currently authenticated user's role
    /// </summary>
    [HttpGet("my-permissions")]
    public async Task<ActionResult<List<string>>> GetMyPermissions()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (string.IsNullOrEmpty(role))
            return Ok(new List<string>());

        // Admin gets everything — return "*" which means "all allowed"
        if (role == "Admin")
            return Ok(new List<string> { "*" });

        var keys = await _db.RolePermissions
            .Where(rp => rp.Role == role)
            .Select(rp => rp.MenuKey)
            .ToListAsync();
        return Ok(keys);
    }

    /// <summary>
    /// Get all roles that have at least one permission configured
    /// </summary>
    [HttpGet("roles")]
    public async Task<ActionResult<List<string>>> GetConfiguredRoles()
    {
        var roles = await _db.RolePermissions
            .Select(rp => rp.Role)
            .Distinct()
            .OrderBy(r => r)
            .ToListAsync();
        return Ok(roles);
    }

    /// <summary>
    /// Get all allowed menu keys for a specific role
    /// </summary>
    [HttpGet("by-role/{role}")]
    public async Task<ActionResult<List<string>>> GetByRole(string role)
    {
        var keys = await _db.RolePermissions
            .Where(rp => rp.Role == role)
            .Select(rp => rp.MenuKey)
            .ToListAsync();
        return Ok(keys);
    }

    /// <summary>
    /// Replace all permissions for a given role with the provided list of menu keys
    /// </summary>
    [HttpPut("by-role/{role}")]
    public async Task<IActionResult> UpdateRole(string role, [FromBody] List<string> menuKeys)
    {
        // Only Admin can manage permissions
        var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (callerRole != "Admin")
            return Forbid();

        // Cannot modify Admin permissions (Admin always has full access)
        if (role == "Admin")
            return BadRequest(new { message = "Admin role always has full access and cannot be modified." });

        // Remove existing permissions for this role
        var existing = await _db.RolePermissions
            .Where(rp => rp.Role == role)
            .ToListAsync();
        _db.RolePermissions.RemoveRange(existing);

        // Add new permissions
        var newPerms = menuKeys
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Distinct()
            .Select(k => new RolePermission { Role = role, MenuKey = k })
            .ToList();
        _db.RolePermissions.AddRange(newPerms);

        await _db.SaveChangesAsync();
        return Ok(new { message = $"Permissions updated for role '{role}'.", count = newPerms.Count });
    }
}
