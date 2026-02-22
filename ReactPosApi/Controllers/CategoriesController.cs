using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;
using ReactPosApi.Models;

namespace ReactPosApi.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    // GET api/categories
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var list = await _db.Categories
            .OrderByDescending(c => c.CreatedOn)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                CreatedOn = c.CreatedOn.ToString("dd MMM yyyy"),
                Status = c.Status
            })
            .ToListAsync();
        return Ok(list);
    }

    // GET api/categories/5
    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var c = await _db.Categories.FindAsync(id);
        if (c == null) return NotFound();
        return Ok(new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            CreatedOn = c.CreatedOn.ToString("dd MMM yyyy"),
            Status = c.Status
        });
    }

    // POST api/categories
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto dto)
    {
        var entity = new Category
        {
            Name = dto.Name,
            Slug = dto.Slug,
            Status = dto.Status
        };
        _db.Categories.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new CategoryDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Slug = entity.Slug,
            CreatedOn = entity.CreatedOn.ToString("dd MMM yyyy"),
            Status = entity.Status
        });
    }

    // PUT api/categories/5
    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, [FromBody] CreateCategoryDto dto)
    {
        var entity = await _db.Categories.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Name = dto.Name;
        entity.Slug = dto.Slug;
        entity.Status = dto.Status;
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Slug = entity.Slug,
            CreatedOn = entity.CreatedOn.ToString("dd MMM yyyy"),
            Status = entity.Status
        });
    }

    // DELETE api/categories/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Categories.FindAsync(id);
        if (entity == null) return NotFound();

        _db.Categories.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
