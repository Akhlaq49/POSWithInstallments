using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;
using ReactPosApi.Models;

namespace ReactPosApi.Controllers;

[Authorize]
[ApiController]
[Route("api/sub-categories")]
public class SubCategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public SubCategoriesController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // GET api/sub-categories
    [HttpGet]
    public async Task<ActionResult<List<SubCategoryDto>>> GetAll()
    {
        var list = await _db.SubCategories
            .Include(sc => sc.Category)
            .OrderByDescending(sc => sc.CreatedAt)
            .Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Image = sc.Image,
                SubCategory = sc.SubCategoryName,
                Category = sc.Category != null ? sc.Category.Name : "",
                CategoryCode = sc.CategoryCode ?? "",
                Description = sc.Description,
                Status = sc.Status
            })
            .ToListAsync();
        return Ok(list);
    }

    // GET api/sub-categories/5
    [HttpGet("{id}")]
    public async Task<ActionResult<SubCategoryDto>> GetById(int id)
    {
        var sc = await _db.SubCategories
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (sc == null) return NotFound();

        return Ok(new SubCategoryDto
        {
            Id = sc.Id,
            Image = sc.Image,
            SubCategory = sc.SubCategoryName,
            Category = sc.Category?.Name ?? "",
            CategoryCode = sc.CategoryCode ?? "",
            Description = sc.Description,
            Status = sc.Status
        });
    }

    // POST api/sub-categories
    [HttpPost]
    public async Task<ActionResult<SubCategoryDto>> Create([FromForm] CreateSubCategoryDto dto, IFormFile? image)
    {
        string? imagePath = null;
        if (image != null)
        {
            imagePath = await SaveFile(image, "subcategories");
        }

        var entity = new SubCategory
        {
            SubCategoryName = dto.SubCategory,
            CategoryId = dto.CategoryId,
            CategoryCode = dto.CategoryCode,
            Description = dto.Description,
            Image = imagePath,
            Status = dto.Status
        };
        _db.SubCategories.Add(entity);
        await _db.SaveChangesAsync();

        // Reload with category
        await _db.Entry(entity).Reference(e => e.Category).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new SubCategoryDto
        {
            Id = entity.Id,
            Image = entity.Image,
            SubCategory = entity.SubCategoryName,
            Category = entity.Category?.Name ?? "",
            CategoryCode = entity.CategoryCode ?? "",
            Description = entity.Description,
            Status = entity.Status
        });
    }

    // PUT api/sub-categories/5
    [HttpPut("{id}")]
    public async Task<ActionResult<SubCategoryDto>> Update(int id, [FromForm] CreateSubCategoryDto dto, IFormFile? image)
    {
        var entity = await _db.SubCategories.Include(s => s.Category).FirstOrDefaultAsync(s => s.Id == id);
        if (entity == null) return NotFound();

        entity.SubCategoryName = dto.SubCategory;
        entity.CategoryId = dto.CategoryId;
        entity.CategoryCode = dto.CategoryCode;
        entity.Description = dto.Description;
        entity.Status = dto.Status;

        if (image != null)
        {
            entity.Image = await SaveFile(image, "subcategories");
        }

        await _db.SaveChangesAsync();

        return Ok(new SubCategoryDto
        {
            Id = entity.Id,
            Image = entity.Image,
            SubCategory = entity.SubCategoryName,
            Category = entity.Category?.Name ?? "",
            CategoryCode = entity.CategoryCode ?? "",
            Description = entity.Description,
            Status = entity.Status
        });
    }

    // DELETE api/sub-categories/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.SubCategories.FindAsync(id);
        if (entity == null) return NotFound();

        _db.SubCategories.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string> SaveFile(IFormFile file, string folder)
    {
        var uploadsDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", folder);
        Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);
        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);
        return $"/uploads/{folder}/{fileName}";
    }
}
