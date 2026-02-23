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

// ============================
// Stock Entries (Manage Stock)
// ============================
[Authorize]
[ApiController]
[Route("api/stock-entries")]
public class StockEntriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public StockEntriesController(AppDbContext db) => _db = db;

    // GET api/stock-entries
    [HttpGet]
    public async Task<ActionResult<List<StockEntryDto>>> GetAll()
    {
        var entries = await _db.StockEntries
            .OrderByDescending(s => s.Date)
            .ToListAsync();

        var productIds = entries.Select(e => e.ProductId).Distinct().ToList();
        var products = await _db.Products
            .Include(p => p.Images)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var dtos = entries.Select(e =>
        {
            products.TryGetValue(e.ProductId, out var prod);
            return new StockEntryDto
            {
                Id = e.Id,
                Warehouse = e.Warehouse,
                Store = e.Store,
                ProductId = e.ProductId,
                ProductName = prod?.ProductName ?? "",
                ProductImage = prod?.Images.FirstOrDefault()?.ImagePath ?? "",
                Sku = prod?.SKU ?? "",
                Category = prod?.Category ?? "",
                Person = e.Person,
                Quantity = e.Quantity,
                Date = e.Date.ToString("dd MMM yyyy")
            };
        }).ToList();

        return Ok(dtos);
    }

    // POST api/stock-entries
    [HttpPost]
    public async Task<ActionResult<StockEntryDto>> Create([FromBody] CreateStockEntryDto dto)
    {
        var product = await _db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        // Update product quantity
        product.Quantity += dto.Quantity;

        var entity = new StockEntry
        {
            Warehouse = dto.Warehouse,
            Store = dto.Store,
            ProductId = dto.ProductId,
            Person = dto.Person,
            Quantity = dto.Quantity,
            Date = DateTime.UtcNow
        };
        _db.StockEntries.Add(entity);
        await _db.SaveChangesAsync();

        return Ok(new StockEntryDto
        {
            Id = entity.Id,
            Warehouse = entity.Warehouse,
            Store = entity.Store,
            ProductId = entity.ProductId,
            ProductName = product.ProductName,
            ProductImage = product.Images.FirstOrDefault()?.ImagePath ?? "",
            Sku = product.SKU ?? "",
            Category = product.Category ?? "",
            Person = entity.Person,
            Quantity = entity.Quantity,
            Date = entity.Date.ToString("dd MMM yyyy")
        });
    }

    // PUT api/stock-entries/5
    [HttpPut("{id}")]
    public async Task<ActionResult<StockEntryDto>> Update(int id, [FromBody] CreateStockEntryDto dto)
    {
        var entity = await _db.StockEntries.FindAsync(id);
        if (entity == null) return NotFound();

        var product = await _db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        // Adjust product quantity: revert old, apply new
        var oldProduct = await _db.Products.FindAsync(entity.ProductId);
        if (oldProduct != null) oldProduct.Quantity -= entity.Quantity;
        product.Quantity += dto.Quantity;

        entity.Warehouse = dto.Warehouse;
        entity.Store = dto.Store;
        entity.ProductId = dto.ProductId;
        entity.Person = dto.Person;
        entity.Quantity = dto.Quantity;

        await _db.SaveChangesAsync();

        return Ok(new StockEntryDto
        {
            Id = entity.Id,
            Warehouse = entity.Warehouse,
            Store = entity.Store,
            ProductId = entity.ProductId,
            ProductName = product.ProductName,
            ProductImage = product.Images.FirstOrDefault()?.ImagePath ?? "",
            Sku = product.SKU ?? "",
            Category = product.Category ?? "",
            Person = entity.Person,
            Quantity = entity.Quantity,
            Date = entity.Date.ToString("dd MMM yyyy")
        });
    }

    // DELETE api/stock-entries/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.StockEntries.FindAsync(id);
        if (entity == null) return NotFound();

        // Revert product quantity
        var product = await _db.Products.FindAsync(entity.ProductId);
        if (product != null) product.Quantity -= entity.Quantity;

        _db.StockEntries.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ============================
// Stock Adjustments
// ============================
[Authorize]
// ============================
// Stock Transfers
// ============================
[ApiController]
[Route("api/stock-transfers")]
[Authorize]
public class StockTransfersController : ControllerBase
{
    private readonly AppDbContext _db;
    public StockTransfersController(AppDbContext db) => _db = db;

    // GET api/stock-transfers
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var transfers = await _db.StockTransfers
            .Include(t => t.Items)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var productIds = transfers.SelectMany(t => t.Items.Select(i => i.ProductId)).Distinct().ToList();
        var products = await _db.Products.Include(p => p.Images)
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();
        var productMap = products.ToDictionary(p => p.Id);

        var dtos = transfers.Select(t => new StockTransferDto
        {
            Id = t.Id,
            WarehouseFrom = t.WarehouseFrom,
            WarehouseTo = t.WarehouseTo,
            ReferenceNumber = t.ReferenceNumber,
            Notes = t.Notes,
            NoOfProducts = t.Items.Count,
            QuantityTransferred = t.Items.Sum(i => i.Quantity),
            Date = t.Date.ToString("dd MMM yyyy"),
            Items = t.Items.Select(i =>
            {
                productMap.TryGetValue(i.ProductId, out var prod);
                return new StockTransferItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = prod?.ProductName ?? "",
                    ProductImage = prod?.Images.FirstOrDefault()?.ImagePath ?? "",
                    Sku = prod?.SKU ?? "",
                    Category = prod?.Category ?? "",
                    Quantity = i.Quantity
                };
            }).ToList()
        }).ToList();

        return Ok(dtos);
    }

    // POST api/stock-transfers
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStockTransferDto dto)
    {
        var entity = new StockTransfer
        {
            WarehouseFrom = dto.WarehouseFrom,
            WarehouseTo = dto.WarehouseTo,
            ReferenceNumber = dto.ReferenceNumber,
            Notes = dto.Notes,
            Date = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new StockTransferItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity
            }).ToList()
        };
        _db.StockTransfers.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new { entity.Id });
    }

    // PUT api/stock-transfers/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateStockTransferDto dto)
    {
        var entity = await _db.StockTransfers.Include(t => t.Items).FirstOrDefaultAsync(t => t.Id == id);
        if (entity == null) return NotFound();

        entity.WarehouseFrom = dto.WarehouseFrom;
        entity.WarehouseTo = dto.WarehouseTo;
        entity.ReferenceNumber = dto.ReferenceNumber;
        entity.Notes = dto.Notes;

        // Replace items
        _db.StockTransferItems.RemoveRange(entity.Items);
        entity.Items = dto.Items.Select(i => new StockTransferItem
        {
            StockTransferId = id,
            ProductId = i.ProductId,
            Quantity = i.Quantity
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { entity.Id });
    }

    // DELETE api/stock-transfers/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.StockTransfers.Include(t => t.Items).FirstOrDefaultAsync(t => t.Id == id);
        if (entity == null) return NotFound();
        _db.StockTransfers.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController]
[Route("api/stock-adjustments")]
public class StockAdjustmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public StockAdjustmentsController(AppDbContext db) => _db = db;

    // GET api/stock-adjustments
    [HttpGet]
    public async Task<ActionResult<List<StockAdjustmentDto>>> GetAll()
    {
        var entries = await _db.StockAdjustments
            .OrderByDescending(s => s.Date)
            .ToListAsync();

        var productIds = entries.Select(e => e.ProductId).Distinct().ToList();
        var products = await _db.Products
            .Include(p => p.Images)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var dtos = entries.Select(e =>
        {
            products.TryGetValue(e.ProductId, out var prod);
            return new StockAdjustmentDto
            {
                Id = e.Id,
                Warehouse = e.Warehouse,
                Store = e.Store,
                ProductId = e.ProductId,
                ProductName = prod?.ProductName ?? "",
                ProductImage = prod?.Images.FirstOrDefault()?.ImagePath ?? "",
                Sku = prod?.SKU ?? "",
                Category = prod?.Category ?? "",
                ReferenceNumber = e.ReferenceNumber,
                Person = e.Person,
                Quantity = e.Quantity,
                Notes = e.Notes,
                Date = e.Date.ToString("dd MMM yyyy")
            };
        }).ToList();

        return Ok(dtos);
    }

    // POST api/stock-adjustments
    [HttpPost]
    public async Task<ActionResult<StockAdjustmentDto>> Create([FromBody] CreateStockAdjustmentDto dto)
    {
        var product = await _db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        // Adjust product quantity (adjustment can be positive or negative)
        product.Quantity += dto.Quantity;

        var entity = new StockAdjustment
        {
            Warehouse = dto.Warehouse,
            Store = dto.Store,
            ProductId = dto.ProductId,
            ReferenceNumber = dto.ReferenceNumber,
            Person = dto.Person,
            Quantity = dto.Quantity,
            Notes = dto.Notes,
            Date = DateTime.UtcNow
        };
        _db.StockAdjustments.Add(entity);
        await _db.SaveChangesAsync();

        return Ok(new StockAdjustmentDto
        {
            Id = entity.Id,
            Warehouse = entity.Warehouse,
            Store = entity.Store,
            ProductId = entity.ProductId,
            ProductName = product.ProductName,
            ProductImage = product.Images.FirstOrDefault()?.ImagePath ?? "",
            Sku = product.SKU ?? "",
            Category = product.Category ?? "",
            ReferenceNumber = entity.ReferenceNumber,
            Person = entity.Person,
            Quantity = entity.Quantity,
            Notes = entity.Notes,
            Date = entity.Date.ToString("dd MMM yyyy")
        });
    }

    // PUT api/stock-adjustments/5
    [HttpPut("{id}")]
    public async Task<ActionResult<StockAdjustmentDto>> Update(int id, [FromBody] CreateStockAdjustmentDto dto)
    {
        var entity = await _db.StockAdjustments.FindAsync(id);
        if (entity == null) return NotFound();

        var product = await _db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        // Revert old adjustment, apply new
        var oldProduct = await _db.Products.FindAsync(entity.ProductId);
        if (oldProduct != null) oldProduct.Quantity -= entity.Quantity;
        product.Quantity += dto.Quantity;

        entity.Warehouse = dto.Warehouse;
        entity.Store = dto.Store;
        entity.ProductId = dto.ProductId;
        entity.ReferenceNumber = dto.ReferenceNumber;
        entity.Person = dto.Person;
        entity.Quantity = dto.Quantity;
        entity.Notes = dto.Notes;

        await _db.SaveChangesAsync();

        return Ok(new StockAdjustmentDto
        {
            Id = entity.Id,
            Warehouse = entity.Warehouse,
            Store = entity.Store,
            ProductId = entity.ProductId,
            ProductName = product.ProductName,
            ProductImage = product.Images.FirstOrDefault()?.ImagePath ?? "",
            Sku = product.SKU ?? "",
            Category = product.Category ?? "",
            ReferenceNumber = entity.ReferenceNumber,
            Person = entity.Person,
            Quantity = entity.Quantity,
            Notes = entity.Notes,
            Date = entity.Date.ToString("dd MMM yyyy")
        });
    }

    // DELETE api/stock-adjustments/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.StockAdjustments.FindAsync(id);
        if (entity == null) return NotFound();

        // Revert product quantity
        var product = await _db.Products.FindAsync(entity.ProductId);
        if (product != null) product.Quantity -= entity.Quantity;

        _db.StockAdjustments.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
