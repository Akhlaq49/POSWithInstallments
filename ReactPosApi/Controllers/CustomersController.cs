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
    public CustomersController(AppDbContext db) => _db = db;

    // GET api/customers
    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> GetAll()
    {
        var list = await _db.Customers
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CustomerDto
            {
                Id = c.Id.ToString(),
                Name = c.Name,
                Phone = c.Phone ?? "",
                Email = c.Email ?? "",
                Address = c.Address ?? "",
                City = c.City ?? "",
                Status = c.Status
            })
            .ToListAsync();
        return Ok(list);
    }

    // GET api/customers/5
    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetById(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        return Ok(new CustomerDto
        {
            Id = c.Id.ToString(),
            Name = c.Name,
            Phone = c.Phone ?? "",
            Email = c.Email ?? "",
            Address = c.Address ?? "",
            City = c.City ?? "",
            Status = c.Status
        });
    }

    // POST api/customers
    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerDto dto)
    {
        var entity = new Customer
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            City = dto.City,
            Status = dto.Status
        };
        _db.Customers.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new CustomerDto
        {
            Id = entity.Id.ToString(),
            Name = entity.Name,
            Phone = entity.Phone ?? "",
            Email = entity.Email ?? "",
            Address = entity.Address ?? "",
            City = entity.City ?? "",
            Status = entity.Status
        });
    }

    // PUT api/customers/5
    [HttpPut("{id}")]
    public async Task<ActionResult<CustomerDto>> Update(int id, [FromBody] CreateCustomerDto dto)
    {
        var entity = await _db.Customers.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Name = dto.Name;
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
            Phone = entity.Phone ?? "",
            Email = entity.Email ?? "",
            Address = entity.Address ?? "",
            City = entity.City ?? "",
            Status = entity.Status
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
}
