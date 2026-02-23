using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;
using ReactPosApi.Models;

namespace ReactPosApi.Controllers;

[Authorize]
[ApiController]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    public CustomersController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // GET api/customers
    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> GetAll()
    {
        var list = await _db.Customers
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var customerDtos = new List<CustomerDto>();
        foreach (var c in list)
        {
            var miscBalance = await CalculateMiscBalance(c.Id);
            customerDtos.Add(new CustomerDto
            {
                Id = c.Id.ToString(),
                Name = c.Name,
                SO = c.SO,
                Cnic = c.Cnic,
                Phone = c.Phone ?? "",
                Email = c.Email ?? "",
                Address = c.Address ?? "",
                City = c.City ?? "",
                Picture = c.Picture,
                Status = c.Status,
                MiscBalance = miscBalance
            });
        }
        return Ok(customerDtos);
    }

    // GET api/customers/5
    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetById(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        
        var miscBalance = await CalculateMiscBalance(id);
        return Ok(new CustomerDto
        {
            Id = c.Id.ToString(),
            Name = c.Name,
            SO = c.SO,
            Cnic = c.Cnic,
            Phone = c.Phone ?? "",
            Email = c.Email ?? "",
            Address = c.Address ?? "",
            City = c.City ?? "",
            Picture = c.Picture,
            Status = c.Status,
            MiscBalance = miscBalance
        });
    }

    // POST api/customers
    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerDto dto)
    {
        var entity = new Customer
        {
            Name = dto.Name,
            SO = dto.SO,
            Cnic = dto.Cnic,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            City = dto.City,
            Status = dto.Status
        };
        _db.Customers.Add(entity);
        await _db.SaveChangesAsync();

        var miscBalance = await CalculateMiscBalance(entity.Id);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new CustomerDto
        {
            Id = entity.Id.ToString(),
            Name = entity.Name,
            SO = entity.SO,
            Cnic = entity.Cnic,
            Phone = entity.Phone ?? "",
            Email = entity.Email ?? "",
            Address = entity.Address ?? "",
            City = entity.City ?? "",
            Picture = entity.Picture,
            Status = entity.Status,
            MiscBalance = miscBalance
        });
    }

    // PUT api/customers/5
    [HttpPut("{id}")]
    public async Task<ActionResult<CustomerDto>> Update(int id, [FromBody] CreateCustomerDto dto)
    {
        var entity = await _db.Customers.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Name = dto.Name;
        entity.SO = dto.SO;
        entity.Cnic = dto.Cnic;
        entity.Phone = dto.Phone;
        entity.Email = dto.Email;
        entity.Address = dto.Address;
        entity.City = dto.City;
        entity.Status = dto.Status;
        await _db.SaveChangesAsync();

        return Ok(new CustomerDto
        {
            Id = entity.Id.ToString(),
            Name = entity.Name,
            SO = entity.SO,
            Cnic = entity.Cnic,
            Phone = entity.Phone ?? "",
            Email = entity.Email ?? "",
            Address = entity.Address ?? "",
            City = entity.City ?? "",
            Picture = entity.Picture,
            Status = entity.Status
        });
    }

    // POST api/customers/{id}/picture
    [HttpPost("{id}/picture")]
    public async Task<ActionResult<CustomerDto>> UploadPicture(int id, IFormFile picture)
    {
        var entity = await _db.Customers.FindAsync(id);
        if (entity == null) return NotFound();

        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "customers");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(picture.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await picture.CopyToAsync(stream);
        }
        entity.Picture = $"/uploads/customers/{fileName}";
        await _db.SaveChangesAsync();

        var miscBalance = await CalculateMiscBalance(id);
        return Ok(new CustomerDto
        {
            Id = entity.Id.ToString(),
            Name = entity.Name,
            SO = entity.SO,
            Cnic = entity.Cnic,
            Phone = entity.Phone ?? "",
            Email = entity.Email ?? "",
            Address = entity.Address ?? "",
            City = entity.City ?? "",
            Picture = entity.Picture,
            Status = entity.Status,
            MiscBalance = miscBalance
        });
    }

    // DELETE api/customers/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Customers.FindAsync(id);
        if (entity == null) return NotFound();

        _db.Customers.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<decimal> CalculateMiscBalance(int customerId)
    {
        var transactions = await _db.MiscellaneousRegisters
            .Where(m => m.CustomerId == customerId)
            .ToListAsync();

        var credits = transactions.Where(t => t.TransactionType == "Credit").Sum(t => t.Amount);
        var debits = transactions.Where(t => t.TransactionType == "Debit").Sum(t => t.Amount);

        return credits - debits;
    }
}
