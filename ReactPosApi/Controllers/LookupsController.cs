using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;
using ReactPosApi.Models;

namespace ReactPosApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StoresController : ControllerBase
{
    private readonly AppDbContext _db;
    public StoresController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<DropdownOptionDto>>> GetAll()
    {
        var items = await _db.Stores
            .Select(s => new DropdownOptionDto(s.Value, s.Label))
            .ToListAsync();
        return Ok(items);
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly AppDbContext _db;
    public WarehousesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<DropdownOptionDto>>> GetAll()
    {
        var items = await _db.Warehouses
            .Select(w => new DropdownOptionDto(w.Value, w.Label))
            .ToListAsync();
        return Ok(items);
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    public BrandsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // GET api/brands  (dropdown format)
    [HttpGet]
    public async Task<ActionResult<List<DropdownOptionDto>>> GetAll()
    {
        var items = await _db.Brands
            .Select(b => new DropdownOptionDto(b.Value, b.Label))
            .ToListAsync();
        return Ok(items);
    }

    // GET api/brands/list  (full brand list)
    [HttpGet("list")]
    public async Task<ActionResult<List<BrandDto>>> GetList()
    {
        var list = await _db.Brands
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BrandDto
            {
                Id = b.Id,
                Name = b.Label,
                Image = b.Image,
                Status = b.Status,
                CreatedAt = b.CreatedAt.ToString("dd MMM yyyy")
            })
            .ToListAsync();
        return Ok(list);
    }

    // POST api/brands
    [HttpPost]
    public async Task<ActionResult<BrandDto>> Create([FromForm] CreateBrandDto dto, IFormFile? image)
    {
        string? imagePath = null;
        if (image != null)
        {
            imagePath = await SaveFile(image, "brands");
        }

        var entity = new Brand
        {
            Value = dto.Name.ToLower().Replace(" ", "-"),
            Label = dto.Name,
            Image = imagePath,
            Status = dto.Status
        };
        _db.Brands.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetList), null, new BrandDto
        {
            Id = entity.Id,
            Name = entity.Label,
            Image = entity.Image,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt.ToString("dd MMM yyyy")
        });
    }

    // PUT api/brands/5
    [HttpPut("{id}")]
    public async Task<ActionResult<BrandDto>> Update(int id, [FromForm] CreateBrandDto dto, IFormFile? image)
    {
        var entity = await _db.Brands.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Value = dto.Name.ToLower().Replace(" ", "-");
        entity.Label = dto.Name;
        entity.Status = dto.Status;

        if (image != null)
        {
            entity.Image = await SaveFile(image, "brands");
        }

        await _db.SaveChangesAsync();

        return Ok(new BrandDto
        {
            Id = entity.Id,
            Name = entity.Label,
            Image = entity.Image,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt.ToString("dd MMM yyyy")
        });
    }

    // DELETE api/brands/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Brands.FindAsync(id);
        if (entity == null) return NotFound();

        var productCount = await _db.Products.CountAsync(p => p.Brand == entity.Label);
        if (productCount > 0)
            return Conflict(new { message = $"Cannot delete this brand. It is used by {productCount} product(s)." });

        _db.Brands.Remove(entity);
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

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UnitsController : ControllerBase
{
    private readonly AppDbContext _db;
    public UnitsController(AppDbContext db) => _db = db;

    // GET api/units  (dropdown format)
    [HttpGet]
    public async Task<ActionResult<List<DropdownOptionDto>>> GetAll()
    {
        var items = await _db.Units
            .Select(u => new DropdownOptionDto(u.Value, u.Label))
            .ToListAsync();
        return Ok(items);
    }

    // GET api/units/list  (full unit list with product count)
    [HttpGet("list")]
    public async Task<ActionResult<List<UnitDto>>> GetList()
    {
        var units = await _db.Units
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var result = new List<UnitDto>();
        foreach (var u in units)
        {
            var count = await _db.Products.CountAsync(p => p.Unit == u.Label);
            result.Add(new UnitDto
            {
                Id = u.Id,
                Name = u.Label,
                ShortName = u.Value,
                ProductCount = count,
                Status = u.Status,
                CreatedAt = u.CreatedAt.ToString("dd MMM yyyy")
            });
        }
        return Ok(result);
    }

    // POST api/units
    [HttpPost]
    public async Task<ActionResult<UnitDto>> Create([FromBody] CreateUnitDto dto)
    {
        var entity = new Unit
        {
            Value = dto.ShortName,
            Label = dto.Name,
            Status = dto.Status
        };
        _db.Units.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetList), null, new UnitDto
        {
            Id = entity.Id,
            Name = entity.Label,
            ShortName = entity.Value,
            ProductCount = 0,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt.ToString("dd MMM yyyy")
        });
    }

    // PUT api/units/5
    [HttpPut("{id}")]
    public async Task<ActionResult<UnitDto>> Update(int id, [FromBody] CreateUnitDto dto)
    {
        var entity = await _db.Units.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Value = dto.ShortName;
        entity.Label = dto.Name;
        entity.Status = dto.Status;

        await _db.SaveChangesAsync();

        var count = await _db.Products.CountAsync(p => p.Unit == entity.Label);
        return Ok(new UnitDto
        {
            Id = entity.Id,
            Name = entity.Label,
            ShortName = entity.Value,
            ProductCount = count,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt.ToString("dd MMM yyyy")
        });
    }

    // DELETE api/units/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Units.FindAsync(id);
        if (entity == null) return NotFound();

        var productCount = await _db.Products.CountAsync(p => p.Unit == entity.Label);
        if (productCount > 0)
            return Conflict(new { message = $"Cannot delete this unit. It is used by {productCount} product(s)." });

        _db.Units.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[Authorize]
[ApiController]
[Route("api/variant-attributes")]
public class VariantAttributesController : ControllerBase
{
    private readonly AppDbContext _db;
    public VariantAttributesController(AppDbContext db) => _db = db;

    // GET api/variant-attributes
    [HttpGet]
    public async Task<ActionResult<List<VariantAttributeDto>>> GetAll()
    {
        var list = await _db.VariantAttributes
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new VariantAttributeDto
            {
                Id = v.Id,
                Name = v.Name,
                Values = v.Values,
                Status = v.Status,
                CreatedAt = v.CreatedAt.ToString("dd MMM yyyy")
            })
            .ToListAsync();
        return Ok(list);
    }

    // POST api/variant-attributes
    [HttpPost]
    public async Task<ActionResult<VariantAttributeDto>> Create([FromBody] CreateVariantAttributeDto dto)
    {
        var entity = new VariantAttribute
        {
            Name = dto.Name,
            Values = dto.Values,
            Status = dto.Status
        };
        _db.VariantAttributes.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), null, new VariantAttributeDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Values = entity.Values,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt.ToString("dd MMM yyyy")
        });
    }

    // PUT api/variant-attributes/5
    [HttpPut("{id}")]
    public async Task<ActionResult<VariantAttributeDto>> Update(int id, [FromBody] CreateVariantAttributeDto dto)
    {
        var entity = await _db.VariantAttributes.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Name = dto.Name;
        entity.Values = dto.Values;
        entity.Status = dto.Status;

        await _db.SaveChangesAsync();

        return Ok(new VariantAttributeDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Values = entity.Values,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt.ToString("dd MMM yyyy")
        });
    }

    // DELETE api/variant-attributes/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.VariantAttributes.FindAsync(id);
        if (entity == null) return NotFound();

        _db.VariantAttributes.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WarrantiesController : ControllerBase
{
    private readonly AppDbContext _db;
    public WarrantiesController(AppDbContext db) => _db = db;

    // GET api/warranties
    [HttpGet]
    public async Task<ActionResult<List<WarrantyDto>>> GetAll()
    {
        var list = await _db.Warranties
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WarrantyDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description,
                Duration = w.Duration,
                Period = w.Period,
                DurationDisplay = w.Duration + " " + w.Period + (w.Duration != 1 ? "s" : ""),
                Status = w.Status
            })
            .ToListAsync();
        return Ok(list);
    }

    // POST api/warranties
    [HttpPost]
    public async Task<ActionResult<WarrantyDto>> Create([FromBody] CreateWarrantyDto dto)
    {
        var entity = new Warranty
        {
            Name = dto.Name,
            Description = dto.Description,
            Duration = dto.Duration,
            Period = dto.Period,
            Status = dto.Status
        };
        _db.Warranties.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), null, new WarrantyDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Duration = entity.Duration,
            Period = entity.Period,
            DurationDisplay = entity.Duration + " " + entity.Period + (entity.Duration != 1 ? "s" : ""),
            Status = entity.Status
        });
    }

    // PUT api/warranties/5
    [HttpPut("{id}")]
    public async Task<ActionResult<WarrantyDto>> Update(int id, [FromBody] CreateWarrantyDto dto)
    {
        var entity = await _db.Warranties.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Duration = dto.Duration;
        entity.Period = dto.Period;
        entity.Status = dto.Status;

        await _db.SaveChangesAsync();

        return Ok(new WarrantyDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Duration = entity.Duration,
            Period = entity.Period,
            DurationDisplay = entity.Duration + " " + entity.Period + (entity.Duration != 1 ? "s" : ""),
            Status = entity.Status
        });
    }

    // DELETE api/warranties/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Warranties.FindAsync(id);
        if (entity == null) return NotFound();

        _db.Warranties.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
