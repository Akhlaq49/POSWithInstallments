using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.Models;

namespace ReactPosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchasesController : ControllerBase
{
    private readonly AppDbContext _context;

    public PurchasesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/purchases
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Purchase>>> GetAllPurchases()
    {
        try
        {
            var purchases = await _context.Purchases
                .OrderByDescending(p => p.Date)
                .ToListAsync();
            return Ok(purchases);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET: api/purchases/:id
    [HttpGet("{id}")]
    public async Task<ActionResult<Purchase>> GetPurchaseById(int id)
    {
        try
        {
            var purchase = await _context.Purchases.FindAsync(id);
            if (purchase == null)
                return NotFound(new { error = "Purchase not found" });

            return Ok(purchase);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // POST: api/purchases
    [HttpPost]
    public async Task<ActionResult<Purchase>> CreatePurchase([FromBody] CreatePurchaseDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var purchase = new Purchase
            {
                SupplierName = dto.SupplierName,
                SupplierRef = dto.SupplierRef,
                Reference = dto.Reference,
                Date = dto.Date,
                Status = dto.Status,
                Total = dto.Total,
                Paid = dto.Paid,
                Notes = dto.Notes,
                PaymentStatus = CalculatePaymentStatus(dto.Paid, dto.Total),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.Purchases.Add(purchase);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPurchaseById), new { id = purchase.Id }, purchase);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // PUT: api/purchases/:id
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePurchase(int id, [FromBody] UpdatePurchaseDto dto)
    {
        try
        {
            var purchase = await _context.Purchases.FindAsync(id);
            if (purchase == null)
                return NotFound(new { error = "Purchase not found" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            purchase.SupplierName = dto.SupplierName;
            purchase.SupplierRef = dto.SupplierRef;
            purchase.Reference = dto.Reference;
            purchase.Date = dto.Date;
            purchase.Status = dto.Status;
            purchase.Total = dto.Total;
            purchase.Paid = dto.Paid;
            purchase.Notes = dto.Notes;
            purchase.PaymentStatus = CalculatePaymentStatus(dto.Paid, dto.Total);
            purchase.UpdatedAt = DateTime.UtcNow;

            _context.Purchases.Update(purchase);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Purchase updated successfully", purchase });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE: api/purchases/:id
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePurchase(int id)
    {
        try
        {
            var purchase = await _context.Purchases.FindAsync(id);
            if (purchase == null)
                return NotFound(new { error = "Purchase not found" });

            _context.Purchases.Remove(purchase);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Purchase deleted successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private string CalculatePaymentStatus(decimal paid, decimal total)
    {
        if (paid >= total)
            return "Paid";
        else if (paid == 0)
            return "Unpaid";
        else if (paid > 0 && paid < total)
            return "Partial";
        else
            return "Overdue";
    }
}

public class CreatePurchaseDto
{
    public string SupplierName { get; set; } = string.Empty;
    public string? SupplierRef { get; set; }
    public string Reference { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Status { get; set; } = "Received";
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePurchaseDto
{
    public string SupplierName { get; set; } = string.Empty;
    public string? SupplierRef { get; set; }
    public string Reference { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Status { get; set; } = "Received";
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public string? Notes { get; set; }
}
