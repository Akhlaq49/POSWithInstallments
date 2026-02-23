using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;
using ReactPosApi.Models;

namespace ReactPosApi.Controllers;

[Authorize]
[ApiController]
[Route("api/installments")]
public class InstallmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    public InstallmentsController(AppDbContext db, IWebHostEnvironment env) { _db = db; _env = env; }

    // GET api/installments
    [HttpGet]
    public async Task<ActionResult<List<InstallmentPlanDto>>> GetAll()
    {
        var plans = await _db.InstallmentPlans
            .Include(p => p.Customer)
            .Include(p => p.Product).ThenInclude(pr => pr!.Images)
            .Include(p => p.Schedule.OrderBy(s => s.InstallmentNo))
            .Include(p => p.Guarantors)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(plans.Select(MapToDto).ToList());
    }

    // GET api/installments/5
    [HttpGet("{id}")]
    public async Task<ActionResult<InstallmentPlanDto>> GetById(int id)
    {
        var plan = await _db.InstallmentPlans
            .Include(p => p.Customer)
            .Include(p => p.Product).ThenInclude(pr => pr!.Images)
            .Include(p => p.Schedule.OrderBy(s => s.InstallmentNo))
            .Include(p => p.Guarantors)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return NotFound();
        return Ok(MapToDto(plan));
    }

    // POST api/installments
    [HttpPost]
    public async Task<ActionResult<InstallmentPlanDto>> Create([FromBody] CreateInstallmentDto dto)
    {
        // Validate customer exists
        var customer = await _db.Customers.FindAsync(dto.CustomerId);
        if (customer == null) return BadRequest(new { message = "Customer not found" });

        // Validate product exists
        var product = await _db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        var productPrice = product.Price;
        // Use custom finance amount if provided, otherwise fall back to product price
        var baseAmount = dto.FinanceAmount.HasValue && dto.FinanceAmount.Value > 0
            ? dto.FinanceAmount.Value
            : productPrice;
        var financedAmount = baseAmount - dto.DownPayment;
        var emi = CalculateEMI(financedAmount, dto.InterestRate, dto.Tenure);
        var totalPayable = dto.DownPayment + emi * dto.Tenure;
        var totalInterest = totalPayable - baseAmount;

        var plan = new InstallmentPlan
        {
            CustomerId = dto.CustomerId,
            ProductId = dto.ProductId,
            ProductPrice = productPrice,
            FinanceAmount = dto.FinanceAmount,
            DownPayment = dto.DownPayment,
            FinancedAmount = financedAmount,
            InterestRate = dto.InterestRate,
            Tenure = dto.Tenure,
            EmiAmount = Math.Round(emi, 2),
            TotalPayable = Math.Round(totalPayable, 2),
            TotalInterest = Math.Round(totalInterest, 2),
            StartDate = dto.StartDate,
            Status = "active",
            PaidInstallments = 0,
            RemainingInstallments = dto.Tenure
        };

        // Generate repayment schedule
        var schedule = GenerateSchedule(financedAmount, dto.InterestRate, dto.Tenure, dto.StartDate);
        plan.NextDueDate = schedule.FirstOrDefault(s => s.Status == "due" || s.Status == "upcoming")?.DueDate ?? "";

        _db.InstallmentPlans.Add(plan);
        await _db.SaveChangesAsync();

        // Add schedule entries
        foreach (var entry in schedule)
        {
            entry.PlanId = plan.Id;
            _db.RepaymentEntries.Add(entry);
        }
        await _db.SaveChangesAsync();

        // Reload with navigations
        await _db.Entry(plan).Collection(p => p.Schedule).LoadAsync();
        await _db.Entry(plan).Reference(p => p.Customer).LoadAsync();
        await _db.Entry(plan).Reference(p => p.Product).LoadAsync();
        if (plan.Product != null)
            await _db.Entry(plan.Product).Collection(pr => pr.Images).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, MapToDto(plan));
    }

    // PUT api/installments/5/pay/3
    [HttpPut("{planId}/pay/{installmentNo}")]
    public async Task<IActionResult> MarkPaid(int planId, int installmentNo, [FromBody] PayInstallmentDto paymentDto)
    {
        var plan = await _db.InstallmentPlans
            .Include(p => p.Customer)
            .Include(p => p.Product)
            .Include(p => p.Schedule)
            .FirstOrDefaultAsync(p => p.Id == planId);
        if (plan == null) return NotFound(new { message = "Plan not found" });

        var entry = plan.Schedule.FirstOrDefault(s => s.InstallmentNo == installmentNo);
        if (entry == null) return NotFound(new { message = "Installment entry not found" });
        if (entry.Status == "paid") return BadRequest(new { message = "Already paid" });

        var paidAmount = paymentDto.Amount;
        var emiAmount = entry.EmiAmount;

        // Calculate previously paid amount (for partial installments being completed)
        var previouslyPaid = (entry.ActualPaidAmount ?? 0m) + (entry.MiscAdjustedAmount ?? 0m);
        var remainingAmount = emiAmount - previouslyPaid;
        var totalPaidForEntry = previouslyPaid + paidAmount;

        decimal overpayment = 0;

        if (totalPaidForEntry >= emiAmount)
        {
            // Full payment (or completing a partial)
            entry.Status = "paid";
            entry.PaidDate = DateTime.UtcNow.ToString("yyyy-MM-dd");
            entry.ActualPaidAmount = (entry.ActualPaidAmount ?? 0m) + paidAmount;

            overpayment = totalPaidForEntry - emiAmount;

            // Handle overpayment - add to misc account
            if (overpayment > 0)
            {
                var miscTransaction = new MiscellaneousRegister
                {
                    CustomerId = plan.Customer!.Id,
                    TransactionType = "Credit",
                    Amount = overpayment,
                    Description = $"Overpayment for installment #{installmentNo} (Paid: {paidAmount:C}, EMI: {emiAmount:C})",
                    ReferenceId = planId.ToString(),
                    ReferenceType = "InstallmentPayment",
                    CreatedBy = "System"
                };
                _db.MiscellaneousRegisters.Add(miscTransaction);
            }
        }
        else
        {
            // Underpayment - mark as partial
            entry.Status = "partial";
            entry.ActualPaidAmount = (entry.ActualPaidAmount ?? 0m) + paidAmount;
        }

        // Check if customer wants to use misc balance for future installments
        if (paymentDto.UseMiscBalance && plan.Customer != null)
        {
            await ApplyMiscBalanceToInstallments(planId, plan.Customer.Id);
        }

        plan.PaidInstallments = plan.Schedule.Count(s => s.Status == "paid");
        plan.RemainingInstallments = plan.Tenure - plan.PaidInstallments;

        // Update next due date (partial installments are still due)
        var nextDue = plan.Schedule
            .Where(s => s.Status != "paid")
            .OrderBy(s => s.InstallmentNo)
            .FirstOrDefault();
        plan.NextDueDate = nextDue?.DueDate ?? "";

        // Check if all paid
        if (plan.PaidInstallments >= plan.Tenure)
        {
            plan.Status = "completed";
        }

        await _db.SaveChangesAsync();
        var totalSettled = (entry.ActualPaidAmount ?? 0) + (entry.MiscAdjustedAmount ?? 0);
        return Ok(new { 
            message = entry.Status == "partial" 
                ? $"Partial payment recorded. Remaining: {(emiAmount - totalSettled):C}" 
                : "Payment processed successfully", 
            overpayment = overpayment > 0 ? overpayment : 0,
            status = entry.Status,
            actualPaidAmount = entry.ActualPaidAmount,
            miscAdjustedAmount = entry.MiscAdjustedAmount ?? 0,
            remainingForEntry = entry.Status == "partial" ? emiAmount - totalSettled : 0
        });
    }

    // DELETE api/installments/5  (cancel)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var plan = await _db.InstallmentPlans.FindAsync(id);
        if (plan == null) return NotFound();

        plan.Status = "cancelled";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Guarantor Endpoints ─────────────────────────────────

    // POST api/installments/5/guarantors
    [HttpPost("{planId}/guarantors")]
    public async Task<IActionResult> AddGuarantor(int planId, [FromForm] string name, [FromForm] string? so, [FromForm] string? phone,
        [FromForm] string? cnic, [FromForm] string? address, [FromForm] string? relationship, IFormFile? picture)
    {
        var plan = await _db.InstallmentPlans.FindAsync(planId);
        if (plan == null) return NotFound(new { message = "Plan not found" });

        string? picturePath = null;
        if (picture != null)
            picturePath = await SaveFile(picture, "guarantors");

        var guarantor = new Guarantor
        {
            PlanId = planId,
            Name = name,
            SO = so,
            Phone = phone,
            Cnic = cnic,
            Address = address,
            Relationship = relationship,
            Picture = picturePath
        };

        _db.Guarantors.Add(guarantor);
        await _db.SaveChangesAsync();

        return Ok(new GuarantorDto
        {
            Id = guarantor.Id,
            Name = guarantor.Name,
            SO = guarantor.SO,
            Phone = guarantor.Phone,
            Cnic = guarantor.Cnic,
            Address = guarantor.Address,
            Relationship = guarantor.Relationship,
            Picture = guarantor.Picture
        });
    }

    // PUT api/installments/guarantors/7
    [HttpPut("guarantors/{guarantorId}")]
    public async Task<IActionResult> UpdateGuarantor(int guarantorId, [FromForm] string name, [FromForm] string? so, [FromForm] string? phone,
        [FromForm] string? cnic, [FromForm] string? address, [FromForm] string? relationship, IFormFile? picture)
    {
        var guarantor = await _db.Guarantors.FindAsync(guarantorId);
        if (guarantor == null) return NotFound();

        guarantor.Name = name;
        guarantor.SO = so;
        guarantor.Phone = phone;
        guarantor.Cnic = cnic;
        guarantor.Address = address;
        guarantor.Relationship = relationship;

        if (picture != null)
            guarantor.Picture = await SaveFile(picture, "guarantors");

        await _db.SaveChangesAsync();
        return Ok(new GuarantorDto
        {
            Id = guarantor.Id,
            Name = guarantor.Name,
            SO = guarantor.SO,
            Phone = guarantor.Phone,
            Cnic = guarantor.Cnic,
            Address = guarantor.Address,
            Relationship = guarantor.Relationship,
            Picture = guarantor.Picture
        });
    }

    // DELETE api/installments/guarantors/7
    [HttpDelete("guarantors/{guarantorId}")]
    public async Task<IActionResult> DeleteGuarantor(int guarantorId)
    {
        var guarantor = await _db.Guarantors.FindAsync(guarantorId);
        if (guarantor == null) return NotFound();
        _db.Guarantors.Remove(guarantor);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── File Upload Helper ──────────────────────────────────
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

    // ---- EMI Calculation ----

    private static decimal CalculateEMI(decimal principal, decimal annualRate, int months)
    {
        if (annualRate == 0) return principal / months;
        var r = (double)(annualRate / 12 / 100);
        var p = (double)principal;
        var factor = Math.Pow(1 + r, months);
        return (decimal)((p * r * factor) / (factor - 1));
    }

    private static List<RepaymentEntry> GenerateSchedule(decimal financedAmount, decimal annualRate, int tenure, string startDate)
    {
        var schedule = new List<RepaymentEntry>();
        var emi = CalculateEMI(financedAmount, annualRate, tenure);
        var r = annualRate == 0 ? 0 : (double)(annualRate / 12 / 100);
        var balance = (double)financedAmount;
        var start = DateTime.Parse(startDate);
        var today = DateTime.UtcNow;

        for (int i = 1; i <= tenure; i++)
        {
            var dueDate = start.AddMonths(i);
            var interest = annualRate == 0 ? 0 : balance * r;
            var principal = (double)emi - interest;
            balance = Math.Max(0, balance - principal);

            string status = "upcoming";
            if (dueDate < today)
                status = "overdue";
            else if (dueDate.Month == today.Month && dueDate.Year == today.Year)
                status = "due";

            schedule.Add(new RepaymentEntry
            {
                InstallmentNo = i,
                DueDate = dueDate.ToString("yyyy-MM-dd"),
                EmiAmount = Math.Round(emi, 2),
                Principal = Math.Round((decimal)principal, 2),
                Interest = Math.Round((decimal)interest, 2),
                Balance = Math.Round((decimal)balance, 2),
                Status = status
            });
        }
        return schedule;
    }

    private static InstallmentPlanDto MapToDto(InstallmentPlan p) => new()
    {
        Id = p.Id.ToString(),
        CustomerId = p.CustomerId.ToString(),
        CustomerName = p.Customer?.Name ?? "",
        CustomerSo = p.Customer?.SO,
        CustomerCnic = p.Customer?.Cnic,
        CustomerPhone = p.Customer?.Phone ?? "",
        CustomerAddress = p.Customer?.Address ?? "",
        CustomerImage = p.Customer?.Picture,
        ProductName = p.Product?.ProductName ?? "",
        ProductImage = p.Product?.Images.FirstOrDefault()?.ImagePath ?? "/assets/img/products/stock-img-01.png",
        ProductPrice = p.ProductPrice,
        FinanceAmount = p.FinanceAmount,
        DownPayment = p.DownPayment,
        FinancedAmount = p.FinancedAmount,
        InterestRate = p.InterestRate,
        Tenure = p.Tenure,
        EmiAmount = p.EmiAmount,
        TotalPayable = p.TotalPayable,
        TotalInterest = p.TotalInterest,
        StartDate = p.StartDate,
        Status = p.Status,
        PaidInstallments = p.PaidInstallments,
        RemainingInstallments = p.RemainingInstallments,
        NextDueDate = p.NextDueDate ?? "",
        CreatedAt = p.CreatedAt.ToString("yyyy-MM-dd"),
        Schedule = p.Schedule.OrderBy(s => s.InstallmentNo).Select(s => new RepaymentEntryDto
        {
            InstallmentNo = s.InstallmentNo,
            DueDate = s.DueDate,
            EmiAmount = s.EmiAmount,
            Principal = s.Principal,
            Interest = s.Interest,
            Balance = s.Balance,
            Status = s.Status,
            PaidDate = s.PaidDate,
            ActualPaidAmount = s.ActualPaidAmount,
            MiscAdjustedAmount = s.MiscAdjustedAmount
        }).ToList(),
        Guarantors = (p.Guarantors ?? new List<Guarantor>()).Select(g => new GuarantorDto
        {
            Id = g.Id,
            Name = g.Name,
            SO = g.SO,
            Phone = g.Phone,
            Cnic = g.Cnic,
            Address = g.Address,
            Relationship = g.Relationship,
            Picture = g.Picture
        }).ToList()
    };

    private async Task ApplyMiscBalanceToInstallments(int planId, int customerId)
    {
        // Calculate current misc balance
        var transactions = await _db.MiscellaneousRegisters
            .Where(m => m.CustomerId == customerId)
            .ToListAsync();

        var credits = transactions.Where(t => t.TransactionType == "Credit").Sum(t => t.Amount);
        var debits = transactions.Where(t => t.TransactionType == "Debit").Sum(t => t.Amount);
        var availableBalance = credits - debits;

        if (availableBalance <= 0) return;

        // Get unpaid installments for this plan
        var plan = await _db.InstallmentPlans
            .Include(p => p.Schedule)
            .FirstOrDefaultAsync(p => p.Id == planId);

        if (plan == null) return;

        var unpaidInstallments = plan.Schedule
            .Where(s => s.Status != "paid")
            .OrderBy(s => s.InstallmentNo)
            .ToList();

        foreach (var installment in unpaidInstallments)
        {
            if (availableBalance <= 0) break;

            var emiAmount = installment.EmiAmount;
            var previouslyPaid = (installment.ActualPaidAmount ?? 0m) + (installment.MiscAdjustedAmount ?? 0m);
            var remainingForEntry = emiAmount - previouslyPaid;
            var amountToApply = Math.Min(availableBalance, remainingForEntry);

            if (amountToApply >= remainingForEntry)
            {
                // Full payment from misc balance
                installment.Status = "paid";
                installment.PaidDate = DateTime.UtcNow.ToString("yyyy-MM-dd");
                // Don't overwrite ActualPaidAmount - keep original cash amount
                installment.MiscAdjustedAmount = (installment.MiscAdjustedAmount ?? 0m) + remainingForEntry;

                // Create debit transaction
                var miscTransaction = new MiscellaneousRegister
                {
                    CustomerId = customerId,
                    TransactionType = "Debit",
                    Amount = remainingForEntry,
                    Description = $"Adjusted {remainingForEntry:C} from misc balance for installment #{installment.InstallmentNo}",
                    ReferenceId = planId.ToString(),
                    ReferenceType = "InstallmentPayment",
                    CreatedBy = "System"
                };
                _db.MiscellaneousRegisters.Add(miscTransaction);

                availableBalance -= remainingForEntry;
            }
            else if (amountToApply > 0)
            {
                // Partial payment from misc balance
                installment.Status = "partial";
                // Don't overwrite ActualPaidAmount - keep original cash amount
                installment.MiscAdjustedAmount = (installment.MiscAdjustedAmount ?? 0m) + amountToApply;

                var miscTransaction = new MiscellaneousRegister
                {
                    CustomerId = customerId,
                    TransactionType = "Debit",
                    Amount = amountToApply,
                    Description = $"Partially adjusted {amountToApply:C} from misc balance for installment #{installment.InstallmentNo}",
                    ReferenceId = planId.ToString(),
                    ReferenceType = "PartialInstallmentPayment",
                    CreatedBy = "System"
                };
                _db.MiscellaneousRegisters.Add(miscTransaction);

                availableBalance = 0;
            }
        }

        // Update plan statistics
        plan.PaidInstallments = plan.Schedule.Count(s => s.Status == "paid");
        plan.RemainingInstallments = plan.Tenure - plan.PaidInstallments;

        var nextDue = plan.Schedule
            .Where(s => s.Status != "paid")
            .OrderBy(s => s.InstallmentNo)
            .FirstOrDefault();
        plan.NextDueDate = nextDue?.DueDate ?? "";

        if (plan.PaidInstallments >= plan.Tenure)
        {
            plan.Status = "completed";
        }
    }
}
