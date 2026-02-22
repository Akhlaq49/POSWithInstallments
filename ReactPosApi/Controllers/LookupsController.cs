using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;

namespace ReactPosApi.Controllers;

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

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly AppDbContext _db;
    public BrandsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<DropdownOptionDto>>> GetAll()
    {
        var items = await _db.Brands
            .Select(b => new DropdownOptionDto(b.Value, b.Label))
            .ToListAsync();
        return Ok(items);
    }
}

[ApiController]
[Route("api/[controller]")]
public class UnitsController : ControllerBase
{
    private readonly AppDbContext _db;
    public UnitsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<DropdownOptionDto>>> GetAll()
    {
        var items = await _db.Units
            .Select(u => new DropdownOptionDto(u.Value, u.Label))
            .ToListAsync();
        return Ok(items);
    }
}
