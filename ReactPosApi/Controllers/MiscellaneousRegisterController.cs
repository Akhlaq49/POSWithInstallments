using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;
using ReactPosApi.Models;

namespace ReactPosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MiscellaneousRegisterController : ControllerBase
{
    private readonly AppDbContext _db;

    public MiscellaneousRegisterController(AppDbContext db)
    {
        _db = db;
    }

    // GET api/miscellaneousregister/customer/{customerId}
    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<List<MiscellaneousRegisterDto>>> GetByCustomer(int customerId)
    {
        var transactions = await _db.MiscellaneousRegisters
            .Include(m => m.Customer)
            .Where(m => m.CustomerId == customerId)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new MiscellaneousRegisterDto
            {
                Id = m.Id.ToString(),
                CustomerId = m.CustomerId.ToString(),
                CustomerName = m.Customer!.Name,
                TransactionType = m.TransactionType,
                Amount = m.Amount,
                Description = m.Description,
                ReferenceId = m.ReferenceId,
                ReferenceType = m.ReferenceType,
                CreatedAt = m.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                CreatedBy = m.CreatedBy
            })
            .ToListAsync();

        return Ok(transactions);
    }

    // GET api/miscellaneousregister/customer/{customerId}/balance
    [HttpGet("customer/{customerId}/balance")]
    public async Task<ActionResult<decimal>> GetBalance(int customerId)
    {
        var transactions = await _db.MiscellaneousRegisters
            .Where(m => m.CustomerId == customerId)
            .ToListAsync();

        var credits = transactions.Where(t => t.TransactionType == "Credit").Sum(t => t.Amount);
        var debits = transactions.Where(t => t.TransactionType == "Debit").Sum(t => t.Amount);
        var balance = credits - debits;

        return Ok(balance);
    }

    // POST api/miscellaneousregister
    [HttpPost]
    public async Task<ActionResult<MiscellaneousRegisterDto>> Create([FromBody] CreateMiscTransactionDto dto)
    {
        // Validate customer exists
        var customer = await _db.Customers.FindAsync(dto.CustomerId);
        if (customer == null) return NotFound(new { message = "Customer not found" });

        var transaction = new MiscellaneousRegister
        {
            CustomerId = dto.CustomerId,
            TransactionType = dto.TransactionType,
            Amount = dto.Amount,
            Description = dto.Description,
            ReferenceId = dto.ReferenceId,
            ReferenceType = dto.ReferenceType,
            CreatedBy = "Admin" // You could get this from current user context
        };

        _db.MiscellaneousRegisters.Add(transaction);
        await _db.SaveChangesAsync();

        var result = new MiscellaneousRegisterDto
        {
            Id = transaction.Id.ToString(),
            CustomerId = transaction.CustomerId.ToString(),
            CustomerName = customer.Name,
            TransactionType = transaction.TransactionType,
            Amount = transaction.Amount,
            Description = transaction.Description,
            ReferenceId = transaction.ReferenceId,
            ReferenceType = transaction.ReferenceType,
            CreatedAt = transaction.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            CreatedBy = transaction.CreatedBy
        };

        return CreatedAtAction(nameof(GetByCustomer), new { customerId = dto.CustomerId }, result);
    }

    // DELETE api/miscellaneousregister/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var transaction = await _db.MiscellaneousRegisters.FindAsync(id);
        if (transaction == null) return NotFound();

        _db.MiscellaneousRegisters.Remove(transaction);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET api/miscellaneousregister/summary
    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary()
    {
        var transactions = await _db.MiscellaneousRegisters
            .Include(m => m.Customer)
            .GroupBy(m => m.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                CustomerName = g.First().Customer!.Name,
                TotalCredits = g.Where(t => t.TransactionType == "Credit").Sum(t => t.Amount),
                TotalDebits = g.Where(t => t.TransactionType == "Debit").Sum(t => t.Amount),
                Balance = g.Where(t => t.TransactionType == "Credit").Sum(t => t.Amount) - 
                         g.Where(t => t.TransactionType == "Debit").Sum(t => t.Amount),
                TransactionCount = g.Count(),
                LastTransaction = g.Max(t => t.CreatedAt)
            })
            .Where(x => x.Balance != 0)
            .OrderByDescending(x => x.Balance)
            .ToListAsync();

        return Ok(transactions);
    }
}