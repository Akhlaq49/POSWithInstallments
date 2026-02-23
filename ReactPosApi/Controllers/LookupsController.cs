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

// ============================
// Orders
// ============================
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public OrdersController(AppDbContext db) => _db = db;

    // GET api/orders
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerId = o.CustomerId,
                CustomerName = o.CustomerName,
                CustomerImage = o.CustomerImage,
                PaymentType = o.PaymentType,
                Amount = o.Amount,
                Status = o.Status,
                OrderDate = o.OrderDate.ToString("dd MMM yyyy, hh:mm tt"),
                Items = o.Items.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Quantity = i.Quantity,
                    Price = i.Price
                }).ToList()
            })
            .ToListAsync();
        return Ok(orders);
    }

    // GET api/orders/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var o = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (o == null) return NotFound();
        return Ok(new OrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            CustomerId = o.CustomerId,
            CustomerName = o.CustomerName,
            CustomerImage = o.CustomerImage,
            PaymentType = o.PaymentType,
            Amount = o.Amount,
            Status = o.Status,
            OrderDate = o.OrderDate.ToString("dd MMM yyyy, hh:mm tt"),
            Items = o.Items.Select(i => new OrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        });
    }

    // POST api/orders
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
    {
        var order = new Order
        {
            OrderNumber = new Random().Next(1000000, 9999999).ToString(),
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName,
            CustomerImage = dto.CustomerImage,
            PaymentType = dto.PaymentType,
            Amount = dto.Amount,
            Status = dto.Status,
            OrderDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.OrderNumber });
    }

    // PUT api/orders/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateOrderDto dto)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        order.CustomerId = dto.CustomerId;
        order.CustomerName = dto.CustomerName;
        order.CustomerImage = dto.CustomerImage;
        order.PaymentType = dto.PaymentType;
        order.Amount = dto.Amount;
        order.Status = dto.Status;

        _db.OrderItems.RemoveRange(order.Items);
        order.Items = dto.Items.Select(i => new OrderItem
        {
            OrderId = id,
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            Quantity = i.Quantity,
            Price = i.Price
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { order.Id });
    }

    // PATCH api/orders/5/status
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();
        order.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.Status });
    }

    // DELETE api/orders/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ============================
// Sales (Online Orders)
// ============================
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly AppDbContext _db;
    public SalesController(AppDbContext db) => _db = db;

    // GET api/sales?source=online|pos
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? source = null)
    {
        var query = _db.Sales.AsQueryable();
        if (!string.IsNullOrEmpty(source))
            query = query.Where(s => s.Source == source);

        var sales = await query
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SaleDto
            {
                Id = s.Id,
                Reference = s.Reference,
                CustomerId = s.CustomerId,
                CustomerName = s.CustomerName,
                CustomerImage = s.CustomerImage,
                Biller = s.Biller,
                GrandTotal = s.GrandTotal,
                Paid = s.Paid,
                Due = s.Due,
                OrderTax = s.OrderTax,
                Discount = s.Discount,
                Shipping = s.Shipping,
                Status = s.Status,
                PaymentStatus = s.PaymentStatus,
                Notes = s.Notes,
                Source = s.Source,
                SaleDate = s.SaleDate.ToString("dd MMM yyyy"),
                Items = s.Items.Select(i => new SaleItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Quantity = i.Quantity,
                    PurchasePrice = i.PurchasePrice,
                    Discount = i.Discount,
                    TaxPercent = i.TaxPercent,
                    TaxAmount = i.TaxAmount,
                    UnitCost = i.UnitCost,
                    TotalCost = i.TotalCost
                }).ToList(),
                Payments = s.Payments.Select(p => new SalePaymentDto
                {
                    Id = p.Id,
                    Reference = p.Reference,
                    ReceivedAmount = p.ReceivedAmount,
                    PayingAmount = p.PayingAmount,
                    PaymentType = p.PaymentType,
                    Description = p.Description,
                    PaymentDate = p.PaymentDate.ToString("dd MMM yyyy")
                }).ToList()
            })
            .ToListAsync();
        return Ok(sales);
    }

    // GET api/sales/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var s = await _db.Sales
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return NotFound();
        return Ok(new SaleDto
        {
            Id = s.Id,
            Reference = s.Reference,
            CustomerId = s.CustomerId,
            CustomerName = s.CustomerName,
            CustomerImage = s.CustomerImage,
            Biller = s.Biller,
            GrandTotal = s.GrandTotal,
            Paid = s.Paid,
            Due = s.Due,
            OrderTax = s.OrderTax,
            Discount = s.Discount,
            Shipping = s.Shipping,
            Status = s.Status,
            PaymentStatus = s.PaymentStatus,
            Notes = s.Notes,
            Source = s.Source,
            SaleDate = s.SaleDate.ToString("dd MMM yyyy"),
            Items = s.Items.Select(i => new SaleItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                PurchasePrice = i.PurchasePrice,
                Discount = i.Discount,
                TaxPercent = i.TaxPercent,
                TaxAmount = i.TaxAmount,
                UnitCost = i.UnitCost,
                TotalCost = i.TotalCost
            }).ToList(),
            Payments = s.Payments.Select(p => new SalePaymentDto
            {
                Id = p.Id,
                Reference = p.Reference,
                ReceivedAmount = p.ReceivedAmount,
                PayingAmount = p.PayingAmount,
                PaymentType = p.PaymentType,
                Description = p.Description,
                PaymentDate = p.PaymentDate.ToString("dd MMM yyyy")
            }).ToList()
        });
    }

    // POST api/sales
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSaleDto dto)
    {
        // Auto-generate reference SL001, SL002, ...
        var lastRef = await _db.Sales
            .OrderByDescending(s => s.Id)
            .Select(s => s.Reference)
            .FirstOrDefaultAsync();
        int nextNum = 1;
        if (!string.IsNullOrEmpty(lastRef) && lastRef.StartsWith("SL"))
        {
            int.TryParse(lastRef.Substring(2), out nextNum);
            nextNum++;
        }
        var reference = $"SL{nextNum:D3}";

        var sale = new Sale
        {
            Reference = reference,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName,
            CustomerImage = dto.CustomerImage,
            Biller = dto.Biller,
            Source = dto.Source,
            GrandTotal = dto.GrandTotal,
            Paid = 0,
            Due = dto.GrandTotal,
            OrderTax = dto.OrderTax,
            Discount = dto.Discount,
            Shipping = dto.Shipping,
            Status = dto.Status,
            PaymentStatus = "Unpaid",
            Notes = dto.Notes,
            SaleDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new SaleItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                PurchasePrice = i.PurchasePrice,
                Discount = i.Discount,
                TaxPercent = i.TaxPercent,
                TaxAmount = i.TaxAmount,
                UnitCost = i.UnitCost,
                TotalCost = i.TotalCost
            }).ToList()
        };
        _db.Sales.Add(sale);
        await _db.SaveChangesAsync();
        return Ok(new { sale.Id, sale.Reference });
    }

    // PUT api/sales/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateSaleDto dto)
    {
        var sale = await _db.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null) return NotFound();

        sale.CustomerId = dto.CustomerId;
        sale.CustomerName = dto.CustomerName;
        sale.CustomerImage = dto.CustomerImage;
        sale.Biller = dto.Biller;
        sale.GrandTotal = dto.GrandTotal;
        sale.OrderTax = dto.OrderTax;
        sale.Discount = dto.Discount;
        sale.Shipping = dto.Shipping;
        sale.Status = dto.Status;
        sale.Notes = dto.Notes;
        sale.Due = dto.GrandTotal - sale.Paid;
        if (sale.Due <= 0) { sale.Due = 0; sale.PaymentStatus = "Paid"; }
        else if (sale.Paid > 0) { sale.PaymentStatus = "Overdue"; }
        else { sale.PaymentStatus = "Unpaid"; }

        _db.SaleItems.RemoveRange(sale.Items);
        sale.Items = dto.Items.Select(i => new SaleItem
        {
            SaleId = id,
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            Quantity = i.Quantity,
            PurchasePrice = i.PurchasePrice,
            Discount = i.Discount,
            TaxPercent = i.TaxPercent,
            TaxAmount = i.TaxAmount,
            UnitCost = i.UnitCost,
            TotalCost = i.TotalCost
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { sale.Id });
    }

    // DELETE api/sales/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var sale = await _db.Sales
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null) return NotFound();
        _db.Sales.Remove(sale);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---- Payment sub-resources ----

    // GET api/sales/5/payments
    [HttpGet("{id}/payments")]
    public async Task<IActionResult> GetPayments(int id)
    {
        var sale = await _db.Sales.Include(s => s.Payments).FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null) return NotFound();
        return Ok(sale.Payments.Select(p => new SalePaymentDto
        {
            Id = p.Id,
            Reference = p.Reference,
            ReceivedAmount = p.ReceivedAmount,
            PayingAmount = p.PayingAmount,
            PaymentType = p.PaymentType,
            Description = p.Description,
            PaymentDate = p.PaymentDate.ToString("dd MMM yyyy")
        }));
    }

    // POST api/sales/5/payments
    [HttpPost("{id}/payments")]
    public async Task<IActionResult> CreatePayment(int id, [FromBody] CreateSalePaymentDto dto)
    {
        var sale = await _db.Sales.FindAsync(id);
        if (sale == null) return NotFound();

        var payment = new SalePayment
        {
            SaleId = id,
            Reference = dto.Reference,
            ReceivedAmount = dto.ReceivedAmount,
            PayingAmount = dto.PayingAmount,
            PaymentType = dto.PaymentType,
            Description = dto.Description,
            PaymentDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _db.SalePayments.Add(payment);

        // Update sale paid/due/payment status
        sale.Paid += dto.PayingAmount;
        sale.Due = sale.GrandTotal - sale.Paid;
        if (sale.Due <= 0) { sale.Due = 0; sale.PaymentStatus = "Paid"; }
        else { sale.PaymentStatus = "Overdue"; }

        await _db.SaveChangesAsync();
        return Ok(new { payment.Id });
    }

    // PUT api/sales/5/payments/10
    [HttpPut("{id}/payments/{paymentId}")]
    public async Task<IActionResult> UpdatePayment(int id, int paymentId, [FromBody] CreateSalePaymentDto dto)
    {
        var sale = await _db.Sales.FindAsync(id);
        if (sale == null) return NotFound();
        var payment = await _db.SalePayments.FirstOrDefaultAsync(p => p.Id == paymentId && p.SaleId == id);
        if (payment == null) return NotFound();

        // Revert old amount, apply new
        sale.Paid -= payment.PayingAmount;
        payment.Reference = dto.Reference;
        payment.ReceivedAmount = dto.ReceivedAmount;
        payment.PayingAmount = dto.PayingAmount;
        payment.PaymentType = dto.PaymentType;
        payment.Description = dto.Description;

        sale.Paid += dto.PayingAmount;
        sale.Due = sale.GrandTotal - sale.Paid;
        if (sale.Due <= 0) { sale.Due = 0; sale.PaymentStatus = "Paid"; }
        else if (sale.Paid > 0) { sale.PaymentStatus = "Overdue"; }
        else { sale.PaymentStatus = "Unpaid"; }

        await _db.SaveChangesAsync();
        return Ok(new { payment.Id });
    }

    // DELETE api/sales/5/payments/10
    [HttpDelete("{id}/payments/{paymentId}")]
    public async Task<IActionResult> DeletePayment(int id, int paymentId)
    {
        var sale = await _db.Sales.FindAsync(id);
        if (sale == null) return NotFound();
        var payment = await _db.SalePayments.FirstOrDefaultAsync(p => p.Id == paymentId && p.SaleId == id);
        if (payment == null) return NotFound();

        sale.Paid -= payment.PayingAmount;
        sale.Due = sale.GrandTotal - sale.Paid;
        if (sale.Due <= 0) { sale.Due = 0; sale.PaymentStatus = "Paid"; }
        else if (sale.Paid > 0) { sale.PaymentStatus = "Overdue"; }
        else { sale.PaymentStatus = "Unpaid"; }

        _db.SalePayments.Remove(payment);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ============================
// Invoices
// ============================
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _db;
    public InvoicesController(AppDbContext db) => _db = db;

    // GET api/invoices
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Invoices
            .Include(i => i.Items)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNo = i.InvoiceNo,
                CustomerId = i.CustomerId,
                CustomerName = i.CustomerName,
                CustomerImage = i.CustomerImage,
                CustomerAddress = i.CustomerAddress,
                CustomerEmail = i.CustomerEmail,
                CustomerPhone = i.CustomerPhone,
                FromName = i.FromName,
                FromAddress = i.FromAddress,
                FromEmail = i.FromEmail,
                FromPhone = i.FromPhone,
                InvoiceFor = i.InvoiceFor,
                SubTotal = i.SubTotal,
                Discount = i.Discount,
                DiscountPercent = i.DiscountPercent,
                Tax = i.Tax,
                TaxPercent = i.TaxPercent,
                TotalAmount = i.TotalAmount,
                Paid = i.Paid,
                AmountDue = i.AmountDue,
                Status = i.Status,
                Notes = i.Notes,
                Terms = i.Terms,
                DueDate = i.DueDate.ToString("dd MMM yyyy"),
                CreatedAt = i.CreatedAt.ToString("dd MMM yyyy"),
                Items = i.Items.Select(it => new InvoiceItemDto
                {
                    Id = it.Id,
                    Description = it.Description,
                    Quantity = it.Quantity,
                    Cost = it.Cost,
                    Discount = it.Discount,
                    Total = it.Total
                }).ToList()
            })
            .ToListAsync();
        return Ok(list);
    }

    // GET api/invoices/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var i = await _db.Invoices
            .Include(inv => inv.Items)
            .FirstOrDefaultAsync(inv => inv.Id == id);
        if (i == null) return NotFound();

        return Ok(new InvoiceDto
        {
            Id = i.Id,
            InvoiceNo = i.InvoiceNo,
            CustomerId = i.CustomerId,
            CustomerName = i.CustomerName,
            CustomerImage = i.CustomerImage,
            CustomerAddress = i.CustomerAddress,
            CustomerEmail = i.CustomerEmail,
            CustomerPhone = i.CustomerPhone,
            FromName = i.FromName,
            FromAddress = i.FromAddress,
            FromEmail = i.FromEmail,
            FromPhone = i.FromPhone,
            InvoiceFor = i.InvoiceFor,
            SubTotal = i.SubTotal,
            Discount = i.Discount,
            DiscountPercent = i.DiscountPercent,
            Tax = i.Tax,
            TaxPercent = i.TaxPercent,
            TotalAmount = i.TotalAmount,
            Paid = i.Paid,
            AmountDue = i.AmountDue,
            Status = i.Status,
            Notes = i.Notes,
            Terms = i.Terms,
            DueDate = i.DueDate.ToString("dd MMM yyyy"),
            CreatedAt = i.CreatedAt.ToString("dd MMM yyyy"),
            Items = i.Items.Select(it => new InvoiceItemDto
            {
                Id = it.Id,
                Description = it.Description,
                Quantity = it.Quantity,
                Cost = it.Cost,
                Discount = it.Discount,
                Total = it.Total
            }).ToList()
        });
    }

    // POST api/invoices
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto)
    {
        // Auto-generate invoice number
        var lastNo = await _db.Invoices
            .OrderByDescending(i => i.Id)
            .Select(i => i.InvoiceNo)
            .FirstOrDefaultAsync();
        int next = 1;
        if (lastNo != null && lastNo.StartsWith("INV") && int.TryParse(lastNo[3..], out var n))
            next = n + 1;
        var invoiceNo = $"INV{next:D4}";

        var invoice = new Invoice
        {
            InvoiceNo = invoiceNo,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName,
            CustomerImage = dto.CustomerImage,
            CustomerAddress = dto.CustomerAddress,
            CustomerEmail = dto.CustomerEmail,
            CustomerPhone = dto.CustomerPhone,
            FromName = dto.FromName,
            FromAddress = dto.FromAddress,
            FromEmail = dto.FromEmail,
            FromPhone = dto.FromPhone,
            InvoiceFor = dto.InvoiceFor,
            SubTotal = dto.SubTotal,
            Discount = dto.Discount,
            DiscountPercent = dto.DiscountPercent,
            Tax = dto.Tax,
            TaxPercent = dto.TaxPercent,
            TotalAmount = dto.TotalAmount,
            Paid = dto.Paid,
            AmountDue = dto.AmountDue,
            Status = dto.Status,
            Notes = dto.Notes,
            Terms = dto.Terms,
            DueDate = dto.DueDate != null ? DateTime.Parse(dto.DueDate) : DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(it => new InvoiceItem
            {
                Description = it.Description,
                Quantity = it.Quantity,
                Cost = it.Cost,
                Discount = it.Discount,
                Total = it.Total
            }).ToList()
        };
        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();
        return Ok(new { invoice.Id, invoice.InvoiceNo });
    }

    // PUT api/invoices/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateInvoiceDto dto)
    {
        var invoice = await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();

        invoice.CustomerId = dto.CustomerId;
        invoice.CustomerName = dto.CustomerName;
        invoice.CustomerImage = dto.CustomerImage;
        invoice.CustomerAddress = dto.CustomerAddress;
        invoice.CustomerEmail = dto.CustomerEmail;
        invoice.CustomerPhone = dto.CustomerPhone;
        invoice.FromName = dto.FromName;
        invoice.FromAddress = dto.FromAddress;
        invoice.FromEmail = dto.FromEmail;
        invoice.FromPhone = dto.FromPhone;
        invoice.InvoiceFor = dto.InvoiceFor;
        invoice.SubTotal = dto.SubTotal;
        invoice.Discount = dto.Discount;
        invoice.DiscountPercent = dto.DiscountPercent;
        invoice.Tax = dto.Tax;
        invoice.TaxPercent = dto.TaxPercent;
        invoice.TotalAmount = dto.TotalAmount;
        invoice.Paid = dto.Paid;
        invoice.AmountDue = dto.AmountDue;
        invoice.Status = dto.Status;
        invoice.Notes = dto.Notes;
        invoice.Terms = dto.Terms;
        if (dto.DueDate != null) invoice.DueDate = DateTime.Parse(dto.DueDate);

        _db.InvoiceItems.RemoveRange(invoice.Items);
        invoice.Items = dto.Items.Select(it => new InvoiceItem
        {
            InvoiceId = id,
            Description = it.Description,
            Quantity = it.Quantity,
            Cost = it.Cost,
            Discount = it.Discount,
            Total = it.Total
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { invoice.Id });
    }

    // DELETE api/invoices/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var invoice = await _db.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();
        _db.Invoices.Remove(invoice);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── Sales Returns ──────────────────────────────────────────
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesReturnsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SalesReturnsController(AppDbContext db) => _db = db;

    // GET api/salesreturns
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? customer,
        [FromQuery] string? status,
        [FromQuery] string? paymentStatus,
        [FromQuery] string? sort)
    {
        var q = _db.SalesReturns.AsQueryable();

        if (!string.IsNullOrEmpty(customer))
            q = q.Where(r => r.CustomerName.Contains(customer));
        if (!string.IsNullOrEmpty(status))
            q = q.Where(r => r.Status == status);
        if (!string.IsNullOrEmpty(paymentStatus))
            q = q.Where(r => r.PaymentStatus == paymentStatus);

        q = sort switch
        {
            "asc" => q.OrderBy(r => r.ReturnDate),
            "desc" => q.OrderByDescending(r => r.ReturnDate),
            _ => q.OrderByDescending(r => r.Id)
        };

        var list = await q.Select(r => new SalesReturnDto
        {
            Id = r.Id,
            Reference = r.Reference,
            CustomerId = r.CustomerId,
            CustomerName = r.CustomerName,
            CustomerImage = r.CustomerImage,
            ProductId = r.ProductId,
            ProductName = r.ProductName,
            ProductImage = r.ProductImage,
            OrderTax = r.OrderTax,
            Discount = r.Discount,
            Shipping = r.Shipping,
            GrandTotal = r.GrandTotal,
            Paid = r.Paid,
            Due = r.Due,
            Status = r.Status,
            PaymentStatus = r.PaymentStatus,
            ReturnDate = r.ReturnDate.ToString("dd MMM yyyy"),
            CreatedAt = r.CreatedAt.ToString("dd MMM yyyy")
        }).ToListAsync();

        return Ok(list);
    }

    // GET api/salesreturns/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.SalesReturns
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return NotFound();

        return Ok(new SalesReturnDto
        {
            Id = r.Id,
            Reference = r.Reference,
            CustomerId = r.CustomerId,
            CustomerName = r.CustomerName,
            CustomerImage = r.CustomerImage,
            ProductId = r.ProductId,
            ProductName = r.ProductName,
            ProductImage = r.ProductImage,
            OrderTax = r.OrderTax,
            Discount = r.Discount,
            Shipping = r.Shipping,
            GrandTotal = r.GrandTotal,
            Paid = r.Paid,
            Due = r.Due,
            Status = r.Status,
            PaymentStatus = r.PaymentStatus,
            ReturnDate = r.ReturnDate.ToString("dd MMM yyyy"),
            CreatedAt = r.CreatedAt.ToString("dd MMM yyyy"),
            Items = r.Items.Select(i => new SalesReturnItemDto
            {
                Id = i.Id,
                ProductName = i.ProductName,
                NetUnitPrice = i.NetUnitPrice,
                Stock = i.Stock,
                Quantity = i.Quantity,
                Discount = i.Discount,
                TaxPercent = i.TaxPercent,
                Subtotal = i.Subtotal
            }).ToList()
        });
    }

    // POST api/salesreturns
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalesReturnDto dto)
    {
        var entity = new SalesReturn
        {
            Reference = dto.Reference ?? string.Empty,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName,
            CustomerImage = dto.CustomerImage,
            ProductId = dto.ProductId,
            ProductName = dto.ProductName,
            ProductImage = dto.ProductImage,
            OrderTax = dto.OrderTax,
            Discount = dto.Discount,
            Shipping = dto.Shipping,
            GrandTotal = dto.GrandTotal,
            Paid = dto.Paid,
            Due = dto.Due,
            Status = dto.Status,
            PaymentStatus = dto.PaymentStatus,
            ReturnDate = dto.ReturnDate != null ? DateTime.Parse(dto.ReturnDate) : DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new SalesReturnItem
            {
                ProductName = i.ProductName,
                NetUnitPrice = i.NetUnitPrice,
                Stock = i.Stock,
                Quantity = i.Quantity,
                Discount = i.Discount,
                TaxPercent = i.TaxPercent,
                Subtotal = i.Subtotal
            }).ToList()
        };
        _db.SalesReturns.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new { entity.Id });
    }

    // PUT api/salesreturns/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateSalesReturnDto dto)
    {
        var entity = await _db.SalesReturns.Include(r => r.Items).FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null) return NotFound();

        entity.CustomerId = dto.CustomerId;
        entity.CustomerName = dto.CustomerName;
        entity.CustomerImage = dto.CustomerImage;
        entity.ProductId = dto.ProductId;
        entity.ProductName = dto.ProductName;
        entity.ProductImage = dto.ProductImage;
        entity.OrderTax = dto.OrderTax;
        entity.Discount = dto.Discount;
        entity.Shipping = dto.Shipping;
        entity.GrandTotal = dto.GrandTotal;
        entity.Paid = dto.Paid;
        entity.Due = dto.Due;
        entity.Status = dto.Status;
        entity.PaymentStatus = dto.PaymentStatus;
        if (dto.ReturnDate != null) entity.ReturnDate = DateTime.Parse(dto.ReturnDate);

        _db.SalesReturnItems.RemoveRange(entity.Items);
        entity.Items = dto.Items.Select(i => new SalesReturnItem
        {
            SalesReturnId = id,
            ProductName = i.ProductName,
            NetUnitPrice = i.NetUnitPrice,
            Stock = i.Stock,
            Quantity = i.Quantity,
            Discount = i.Discount,
            TaxPercent = i.TaxPercent,
            Subtotal = i.Subtotal
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { entity.Id });
    }

    // DELETE api/salesreturns/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.SalesReturns
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null) return NotFound();
        _db.SalesReturns.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── Quotations ──────────────────────────────────────────
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuotationsController : ControllerBase
{
    private readonly AppDbContext _db;
    public QuotationsController(AppDbContext db) => _db = db;

    // GET api/quotations
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? product,
        [FromQuery] string? customer,
        [FromQuery] string? status,
        [FromQuery] string? sort)
    {
        var q = _db.Quotations.AsQueryable();

        if (!string.IsNullOrEmpty(product))
            q = q.Where(x => x.ProductName.Contains(product));
        if (!string.IsNullOrEmpty(customer))
            q = q.Where(x => x.CustomerName.Contains(customer));
        if (!string.IsNullOrEmpty(status))
            q = q.Where(x => x.Status == status);

        q = sort switch
        {
            "asc" => q.OrderBy(x => x.GrandTotal),
            "desc" => q.OrderByDescending(x => x.GrandTotal),
            _ => q.OrderByDescending(x => x.Id)
        };

        var list = await q.Select(x => new QuotationDto
        {
            Id = x.Id,
            Reference = x.Reference,
            CustomerId = x.CustomerId,
            CustomerName = x.CustomerName,
            CustomerImage = x.CustomerImage,
            ProductId = x.ProductId,
            ProductName = x.ProductName,
            ProductImage = x.ProductImage,
            OrderTax = x.OrderTax,
            Discount = x.Discount,
            Shipping = x.Shipping,
            GrandTotal = x.GrandTotal,
            Status = x.Status,
            Description = x.Description,
            QuotationDate = x.QuotationDate.ToString("dd MMM yyyy"),
            CreatedAt = x.CreatedAt.ToString("dd MMM yyyy")
        }).ToListAsync();

        return Ok(list);
    }

    // GET api/quotations/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var x = await _db.Quotations
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (x == null) return NotFound();

        return Ok(new QuotationDto
        {
            Id = x.Id,
            Reference = x.Reference,
            CustomerId = x.CustomerId,
            CustomerName = x.CustomerName,
            CustomerImage = x.CustomerImage,
            ProductId = x.ProductId,
            ProductName = x.ProductName,
            ProductImage = x.ProductImage,
            OrderTax = x.OrderTax,
            Discount = x.Discount,
            Shipping = x.Shipping,
            GrandTotal = x.GrandTotal,
            Status = x.Status,
            Description = x.Description,
            QuotationDate = x.QuotationDate.ToString("dd MMM yyyy"),
            CreatedAt = x.CreatedAt.ToString("dd MMM yyyy"),
            Items = x.Items.Select(i => new QuotationItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                PurchasePrice = i.PurchasePrice,
                Discount = i.Discount,
                TaxPercent = i.TaxPercent,
                TaxAmount = i.TaxAmount,
                UnitCost = i.UnitCost,
                TotalCost = i.TotalCost
            }).ToList()
        });
    }

    // POST api/quotations
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuotationDto dto)
    {
        var entity = new Quotation
        {
            Reference = dto.Reference ?? string.Empty,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName,
            CustomerImage = dto.CustomerImage,
            ProductId = dto.ProductId,
            ProductName = dto.ProductName,
            ProductImage = dto.ProductImage,
            OrderTax = dto.OrderTax,
            Discount = dto.Discount,
            Shipping = dto.Shipping,
            GrandTotal = dto.GrandTotal,
            Status = dto.Status,
            Description = dto.Description,
            QuotationDate = dto.QuotationDate != null ? DateTime.Parse(dto.QuotationDate) : DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new QuotationItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                PurchasePrice = i.PurchasePrice,
                Discount = i.Discount,
                TaxPercent = i.TaxPercent,
                TaxAmount = i.TaxAmount,
                UnitCost = i.UnitCost,
                TotalCost = i.TotalCost
            }).ToList()
        };
        _db.Quotations.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new { entity.Id });
    }

    // PUT api/quotations/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateQuotationDto dto)
    {
        var entity = await _db.Quotations.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
        if (entity == null) return NotFound();

        entity.Reference = dto.Reference ?? entity.Reference;
        entity.CustomerId = dto.CustomerId;
        entity.CustomerName = dto.CustomerName;
        entity.CustomerImage = dto.CustomerImage;
        entity.ProductId = dto.ProductId;
        entity.ProductName = dto.ProductName;
        entity.ProductImage = dto.ProductImage;
        entity.OrderTax = dto.OrderTax;
        entity.Discount = dto.Discount;
        entity.Shipping = dto.Shipping;
        entity.GrandTotal = dto.GrandTotal;
        entity.Status = dto.Status;
        entity.Description = dto.Description;
        if (dto.QuotationDate != null) entity.QuotationDate = DateTime.Parse(dto.QuotationDate);

        _db.QuotationItems.RemoveRange(entity.Items);
        entity.Items = dto.Items.Select(i => new QuotationItem
        {
            QuotationId = id,
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            Quantity = i.Quantity,
            PurchasePrice = i.PurchasePrice,
            Discount = i.Discount,
            TaxPercent = i.TaxPercent,
            TaxAmount = i.TaxAmount,
            UnitCost = i.UnitCost,
            TotalCost = i.TotalCost
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { entity.Id });
    }

    // DELETE api/quotations/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Quotations
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (entity == null) return NotFound();
        _db.Quotations.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
