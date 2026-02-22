using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;
using ReactPosApi.Models;

namespace ReactPosApi.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ProductsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // GET api/products
    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll()
    {
        var products = await _db.Products
            .Include(p => p.Images)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(products.Select(MapToDto).ToList());
    }

    // GET api/products/expired
    [HttpGet("expired")]
    public async Task<ActionResult<List<ProductDto>>> GetExpired()
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var products = await _db.Products
            .Include(p => p.Images)
            .Where(p => p.ExpiryDate != null && p.ExpiryDate.CompareTo(today) <= 0)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(products.Select(MapToDto).ToList());
    }

    // GET api/products/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await _db.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound();
        return Ok(MapToDto(product));
    }

    // POST api/products  (multipart/form-data)
    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create([FromForm] ProductFormModel form)
    {
        var entity = new Product
        {
            Store = form.Store,
            Warehouse = form.Warehouse,
            ProductName = form.ProductName ?? "",
            Slug = form.Slug,
            SKU = form.Sku,
            SellingType = form.SellingType,
            Category = form.Category,
            SubCategory = form.SubCategory,
            Brand = form.Brand,
            Unit = form.Unit,
            BarcodeSymbology = form.BarcodeSymbology,
            ItemBarcode = form.ItemBarcode,
            Description = form.Description,
            ProductType = form.ProductType ?? "single",
            Quantity = form.Quantity,
            Price = form.Price,
            TaxType = form.TaxType,
            Tax = form.Tax,
            DiscountType = form.DiscountType,
            DiscountValue = form.DiscountValue,
            QuantityAlert = form.QuantityAlert,
            Warranty = form.Warranty,
            Manufacturer = form.Manufacturer,
            ManufacturedDate = form.ManufacturedDate,
            ExpiryDate = form.ExpiryDate
        };

        _db.Products.Add(entity);
        await _db.SaveChangesAsync();

        // Save images
        if (form.Images != null && form.Images.Count > 0)
        {
            foreach (var file in form.Images)
            {
                var path = await SaveFile(file, "products");
                _db.ProductImages.Add(new ProductImage
                {
                    ProductId = entity.Id,
                    ImagePath = path
                });
            }
            await _db.SaveChangesAsync();
        }

        // Reload with images
        await _db.Entry(entity).Collection(e => e.Images).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, MapToDto(entity));
    }

    // PUT api/products/5
    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromForm] ProductFormModel form)
    {
        var entity = await _db.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (entity == null) return NotFound();

        entity.Store = form.Store;
        entity.Warehouse = form.Warehouse;
        entity.ProductName = form.ProductName ?? entity.ProductName;
        entity.Slug = form.Slug;
        entity.SKU = form.Sku;
        entity.SellingType = form.SellingType;
        entity.Category = form.Category;
        entity.SubCategory = form.SubCategory;
        entity.Brand = form.Brand;
        entity.Unit = form.Unit;
        entity.BarcodeSymbology = form.BarcodeSymbology;
        entity.ItemBarcode = form.ItemBarcode;
        entity.Description = form.Description;
        entity.ProductType = form.ProductType ?? entity.ProductType;
        entity.Quantity = form.Quantity;
        entity.Price = form.Price;
        entity.TaxType = form.TaxType;
        entity.Tax = form.Tax;
        entity.DiscountType = form.DiscountType;
        entity.DiscountValue = form.DiscountValue;
        entity.QuantityAlert = form.QuantityAlert;
        entity.Warranty = form.Warranty;
        entity.Manufacturer = form.Manufacturer;
        entity.ManufacturedDate = form.ManufacturedDate;
        entity.ExpiryDate = form.ExpiryDate;
        entity.UpdatedAt = DateTime.UtcNow;

        // Replace images if new ones uploaded
        if (form.Images != null && form.Images.Count > 0)
        {
            _db.ProductImages.RemoveRange(entity.Images);
            foreach (var file in form.Images)
            {
                var path = await SaveFile(file, "products");
                _db.ProductImages.Add(new ProductImage
                {
                    ProductId = entity.Id,
                    ImagePath = path
                });
            }
        }

        await _db.SaveChangesAsync();

        // Reload images
        await _db.Entry(entity).Collection(e => e.Images).LoadAsync();

        return Ok(MapToDto(entity));
    }

    // DELETE api/products/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Products.FindAsync(id);
        if (entity == null) return NotFound();

        _db.Products.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---- Helpers ----

    private ProductDto MapToDto(Product p) => new()
    {
        Id = p.Id.ToString(),
        Store = p.Store ?? "",
        Warehouse = p.Warehouse ?? "",
        ProductName = p.ProductName,
        Slug = p.Slug ?? "",
        Sku = p.SKU ?? "",
        SellingType = p.SellingType ?? "",
        Category = p.Category ?? "",
        SubCategory = p.SubCategory ?? "",
        Brand = p.Brand ?? "",
        Unit = p.Unit ?? "",
        BarcodeSymbology = p.BarcodeSymbology ?? "",
        ItemBarcode = p.ItemBarcode ?? "",
        Description = p.Description ?? "",
        ProductType = p.ProductType,
        Quantity = p.Quantity,
        Price = p.Price,
        TaxType = p.TaxType ?? "",
        Tax = p.Tax ?? "",
        DiscountType = p.DiscountType ?? "",
        DiscountValue = p.DiscountValue,
        QuantityAlert = p.QuantityAlert,
        Warranty = p.Warranty ?? "",
        Manufacturer = p.Manufacturer ?? "",
        ManufacturedDate = p.ManufacturedDate ?? "",
        ExpiryDate = p.ExpiryDate ?? "",
        Images = p.Images.Select(i => i.ImagePath).ToArray(),
        CreatedAt = p.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
        UpdatedAt = p.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss")
    };

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

// Form model for multipart binding
public class ProductFormModel
{
    public string? Store { get; set; }
    public string? Warehouse { get; set; }
    public string? ProductName { get; set; }
    public string? Slug { get; set; }
    public string? Sku { get; set; }
    public string? SellingType { get; set; }
    public string? Category { get; set; }
    public string? SubCategory { get; set; }
    public string? Brand { get; set; }
    public string? Unit { get; set; }
    public string? BarcodeSymbology { get; set; }
    public string? ItemBarcode { get; set; }
    public string? Description { get; set; }
    public string? ProductType { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string? TaxType { get; set; }
    public string? Tax { get; set; }
    public string? DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public int QuantityAlert { get; set; }
    public string? Warranty { get; set; }
    public string? Manufacturer { get; set; }
    public string? ManufacturedDate { get; set; }
    public string? ExpiryDate { get; set; }
    public List<IFormFile>? Images { get; set; }
}
