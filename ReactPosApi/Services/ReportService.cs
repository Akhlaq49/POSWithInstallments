using Microsoft.EntityFrameworkCore;
using ReactPosApi.Data;
using ReactPosApi.DTOs;

namespace ReactPosApi.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db)
    {
        _db = db;
    }

    // ═══════════════════════════════════════════════════════════
    // FINANCIAL REPORTS
    // ═══════════════════════════════════════════════════════════

    public async Task<InstallmentCollectionReportDto> GetInstallmentCollectionReportAsync(DateTime? from, DateTime? to)
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var entries = await _db.RepaymentEntries
            .Include(e => e.Plan)
            .Where(e => e.Plan!.Status != "cancelled")
            .ToListAsync();

        // Filter by date range if provided
        var filteredEntries = entries;
        if (from.HasValue || to.HasValue)
        {
            filteredEntries = entries.Where(e =>
            {
                if (string.IsNullOrEmpty(e.PaidDate)) return false;
                if (DateTime.TryParse(e.PaidDate, out var pd))
                {
                    if (from.HasValue && pd < from.Value) return false;
                    if (to.HasValue && pd > to.Value.AddDays(1)) return false;
                    return true;
                }
                return false;
            }).ToList();
        }

        var paidEntries = filteredEntries.Where(e => e.Status == "paid" || e.Status == "partial").ToList();
        var dueEntries = entries.Where(e => e.Status == "due" || e.Status == "overdue").ToList();
        var overdueEntries = entries.Where(e => e.Status == "overdue").ToList();

        // Collection by date
        var collectionByDate = paidEntries
            .Where(e => !string.IsNullOrEmpty(e.PaidDate))
            .GroupBy(e => e.PaidDate!.Length >= 10 ? e.PaidDate![..10] : e.PaidDate!)
            .Select(g => new CollectionByDateDto
            {
                Date = g.Key,
                Count = g.Count(),
                Amount = g.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0))
            })
            .OrderByDescending(c => c.Date)
            .Take(30)
            .ToList();

        return new InstallmentCollectionReportDto
        {
            TotalInstallmentsDue = dueEntries.Count + overdueEntries.Count + paidEntries.Count,
            TotalCollected = paidEntries.Count,
            PendingCount = dueEntries.Count,
            LatePayments = overdueEntries.Count,
            TotalAmountDue = dueEntries.Sum(e => e.EmiAmount) + overdueEntries.Sum(e => e.EmiAmount),
            TotalAmountCollected = paidEntries.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0)),
            PendingAmount = dueEntries.Sum(e => e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0)),
            LateAmount = overdueEntries.Sum(e => e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0)),
            CollectionByDate = collectionByDate
        };
    }

    public async Task<OutstandingBalanceReportDto> GetOutstandingBalanceReportAsync()
    {
        var today = DateTime.UtcNow;
        var plans = await _db.InstallmentPlans
            .Include(p => p.Customer)
            .Include(p => p.Product)
            .Include(p => p.Schedule)
            .Where(p => p.Status == "active")
            .ToListAsync();

        var customers = new List<CustomerOutstandingDto>();
        decimal totalOutstanding = 0;
        decimal totalOverdue = 0;
        var aging = new AgingBucketDto();

        foreach (var plan in plans)
        {
            var unpaid = plan.Schedule.Where(e => e.Status != "paid").ToList();
            var remaining = unpaid.Sum(e => e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0));
            var overdueEntries = unpaid.Where(e => e.Status == "overdue").ToList();
            var overdueAmt = overdueEntries.Sum(e => e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0));
            var maxDays = 0;

            foreach (var oe in overdueEntries)
            {
                if (DateTime.TryParse(oe.DueDate, out var dueDate))
                {
                    var days = (int)(today - dueDate).TotalDays;
                    if (days > maxDays) maxDays = days;

                    var entryAmt = oe.EmiAmount - (oe.ActualPaidAmount ?? 0) - (oe.MiscAdjustedAmount ?? 0);
                    if (days <= 30) { aging.Days0To30 += entryAmt; aging.Count0To30++; }
                    else if (days <= 60) { aging.Days31To60 += entryAmt; aging.Count31To60++; }
                    else if (days <= 90) { aging.Days61To90 += entryAmt; aging.Count61To90++; }
                    else { aging.Days90Plus += entryAmt; aging.Count90Plus++; }
                }
            }

            totalOutstanding += remaining;
            totalOverdue += overdueAmt;

            if (remaining > 0)
            {
                customers.Add(new CustomerOutstandingDto
                {
                    CustomerId = plan.CustomerId,
                    CustomerName = plan.Customer?.FullName ?? "Unknown",
                    Phone = plan.Customer?.Phone,
                    RemainingBalance = remaining,
                    OverdueAmount = overdueAmt,
                    MaxDaysOverdue = maxDays,
                    PlanId = plan.Id,
                    ProductName = plan.Product?.ProductName ?? "Unknown"
                });
            }
        }

        return new OutstandingBalanceReportDto
        {
            TotalOutstanding = totalOutstanding,
            TotalOverdue = totalOverdue,
            TotalCustomers = customers.Count,
            Aging = aging,
            Customers = customers.OrderByDescending(c => c.OverdueAmount).ToList()
        };
    }

    public async Task<DailyCashFlowReportDto> GetDailyCashFlowReportAsync(DateTime? from, DateTime? to)
    {
        var startDate = from ?? DateTime.UtcNow.AddDays(-30);
        var endDate = to ?? DateTime.UtcNow;
        var startStr = startDate.ToString("yyyy-MM-dd");
        var endStr = endDate.AddDays(1).ToString("yyyy-MM-dd");

        // Get all paid installment entries in range
        var payments = await _db.RepaymentEntries
            .Include(e => e.Plan)
            .Where(e => e.PaidDate != null && e.PaidDate != "")
            .ToListAsync();

        var filteredPayments = payments.Where(e =>
        {
            if (!DateTime.TryParse(e.PaidDate, out var pd)) return false;
            return pd >= startDate && pd <= endDate.AddDays(1);
        }).ToList();

        // Get down payments (from plans created in range)
        var plansInRange = await _db.InstallmentPlans
            .Where(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate.AddDays(1))
            .ToListAsync();

        // Group by date
        var dateGroups = filteredPayments
            .GroupBy(e => e.PaidDate!.Length >= 10 ? e.PaidDate![..10] : e.PaidDate!)
            .ToDictionary(g => g.Key, g => g.ToList());

        var dailyEntries = new List<DailyCashFlowEntryDto>();
        var current = startDate.Date;
        while (current <= endDate.Date)
        {
            var dateStr = current.ToString("yyyy-MM-dd");
            var dayPayments = dateGroups.GetValueOrDefault(dateStr, new List<Models.RepaymentEntry>());
            var dayPlans = plansInRange.Where(p => p.CreatedAt.Date == current.Date).ToList();

            var cashCollected = dayPayments.Sum(p => p.ActualPaidAmount ?? 0);
            var onlinePayments = dayPayments.Sum(p => p.MiscAdjustedAmount ?? 0);
            var downPayments = dayPlans.Sum(p => p.DownPayment);

            dailyEntries.Add(new DailyCashFlowEntryDto
            {
                Date = dateStr,
                CashCollected = cashCollected,
                OnlinePayments = onlinePayments,
                DownPayments = downPayments,
                Expenses = 0, // Expenses would come from a separate expense table if integrated
                NetFlow = cashCollected + onlinePayments + downPayments
            });

            current = current.AddDays(1);
        }

        var totalCash = dailyEntries.Sum(d => d.CashCollected);
        var totalOnline = dailyEntries.Sum(d => d.OnlinePayments);
        var totalDown = dailyEntries.Sum(d => d.DownPayments);

        return new DailyCashFlowReportDto
        {
            Date = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
            OpeningBalance = 0,
            CashCollected = totalCash,
            OnlinePayments = totalOnline,
            DownPayments = totalDown,
            Expenses = 0,
            ClosingBalance = totalCash + totalOnline + totalDown,
            DailyEntries = dailyEntries
        };
    }

    public async Task<InstallmentProfitLossDto> GetInstallmentProfitLossAsync(DateTime? from, DateTime? to)
    {
        var startDate = from ?? DateTime.MinValue;
        var endDate = to ?? DateTime.UtcNow;

        var plans = await _db.InstallmentPlans
            .Include(p => p.Schedule)
            .ToListAsync();

        var filteredPlans = plans;
        if (from.HasValue)
        {
            filteredPlans = plans.Where(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate.AddDays(1)).ToList();
        }

        var allEntries = await _db.RepaymentEntries
            .Include(e => e.Plan)
            .Where(e => e.PaidDate != null && e.PaidDate != "")
            .ToListAsync();

        var filteredEntries = allEntries;
        if (from.HasValue)
        {
            filteredEntries = allEntries.Where(e =>
            {
                if (!DateTime.TryParse(e.PaidDate, out var pd)) return false;
                return pd >= startDate && pd <= endDate.AddDays(1);
            }).ToList();
        }

        var totalSales = filteredPlans.Sum(p => p.ProductPrice);
        var totalDown = filteredPlans.Sum(p => p.DownPayment);
        var interestEarned = filteredEntries.Sum(e => e.Interest > 0 && (e.Status == "paid" || e.Status == "partial")
            ? Math.Min(e.Interest, (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0)) : 0);
        var totalCollected = filteredEntries.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0));

        // Bad debts: amount from defaulted plans
        var defaultedPlans = plans.Where(p => p.Status == "defaulted").ToList();
        var badDebts = defaultedPlans.Sum(p =>
        {
            var paid = p.Schedule.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0)) + p.DownPayment;
            return p.TotalPayable - paid;
        });

        // Monthly breakdown
        var monthlyBreakdown = filteredEntries
            .Where(e => DateTime.TryParse(e.PaidDate, out _))
            .GroupBy(e => DateTime.Parse(e.PaidDate!).ToString("yyyy-MM"))
            .Select(g => new MonthlyProfitDto
            {
                Month = g.Key,
                Collections = g.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0)),
                Interest = g.Sum(e => e.Interest > 0 && (e.Status == "paid" || e.Status == "partial")
                    ? Math.Min(e.Interest, (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0)) : 0),
                DownPayments = 0,
                Expenses = 0,
                NetProfit = g.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0))
            })
            .OrderBy(m => m.Month)
            .ToList();

        return new InstallmentProfitLossDto
        {
            TotalSales = totalSales,
            TotalDownPayments = totalDown,
            InterestEarned = interestEarned,
            TotalCollected = totalCollected + totalDown,
            BadDebts = badDebts,
            TotalExpenses = 0,
            NetProfit = totalCollected + totalDown - badDebts,
            GrossRevenue = totalCollected + totalDown,
            MonthlyBreakdown = monthlyBreakdown
        };
    }


    // ═══════════════════════════════════════════════════════════
    // CUSTOMER REPORTS
    // ═══════════════════════════════════════════════════════════

    public async Task<CustomerLedgerDto> GetCustomerLedgerAsync(int customerId)
    {
        var customer = await _db.Parties.FirstOrDefaultAsync(p => p.Id == customerId)
            ?? throw new KeyNotFoundException("Customer not found");

        var plans = await _db.InstallmentPlans
            .Include(p => p.Product)
            .Include(p => p.Schedule)
            .Where(p => p.CustomerId == customerId)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();

        var miscEntries = await _db.MiscellaneousRegisters
            .Where(m => m.CustomerId == customerId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        var transactions = new List<LedgerTransactionDto>();
        decimal runningBalance = 0;

        foreach (var plan in plans)
        {
            // Down payment
            runningBalance += plan.TotalPayable;
            transactions.Add(new LedgerTransactionDto
            {
                Date = plan.StartDate,
                Type = "Purchase",
                Description = $"Installment Plan #{plan.Id} - {plan.Product?.ProductName ?? "Product"}",
                Debit = plan.TotalPayable,
                Credit = 0,
                RunningBalance = runningBalance,
                Reference = $"Plan #{plan.Id}"
            });

            runningBalance -= plan.DownPayment;
            transactions.Add(new LedgerTransactionDto
            {
                Date = plan.StartDate,
                Type = "Down Payment",
                Description = $"Down payment for Plan #{plan.Id}",
                Debit = 0,
                Credit = plan.DownPayment,
                RunningBalance = runningBalance,
                Reference = $"Plan #{plan.Id}"
            });

            // Paid installments
            foreach (var entry in plan.Schedule.Where(e => e.Status == "paid" || e.Status == "partial").OrderBy(e => e.InstallmentNo))
            {
                var paidAmt = (entry.ActualPaidAmount ?? 0) + (entry.MiscAdjustedAmount ?? 0);
                runningBalance -= paidAmt;
                transactions.Add(new LedgerTransactionDto
                {
                    Date = entry.PaidDate ?? entry.DueDate,
                    Type = "Installment",
                    Description = $"Installment #{entry.InstallmentNo} - Plan #{plan.Id}",
                    Debit = 0,
                    Credit = paidAmt,
                    RunningBalance = runningBalance,
                    Reference = $"Plan #{plan.Id}, Inst #{entry.InstallmentNo}"
                });
            }
        }

        var totalPurchases = plans.Sum(p => p.TotalPayable);
        var totalPaid = plans.Sum(p => p.DownPayment + p.Schedule.Where(e => e.Status == "paid" || e.Status == "partial")
            .Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0)));

        return new CustomerLedgerDto
        {
            CustomerId = customerId,
            CustomerName = customer.FullName,
            Phone = customer.Phone,
            Address = customer.Address,
            TotalPurchases = totalPurchases,
            TotalPaid = totalPaid,
            RemainingBalance = totalPurchases - totalPaid,
            TotalPenalties = 0,
            Transactions = transactions.OrderBy(t => t.Date).ToList()
        };
    }

    public async Task<DefaultersReportDto> GetDefaultersReportAsync()
    {
        var today = DateTime.UtcNow;
        var plans = await _db.InstallmentPlans
            .Include(p => p.Customer)
            .Include(p => p.Product)
            .Include(p => p.Schedule)
            .Where(p => p.Status == "active")
            .ToListAsync();

        var defaulters = new List<DefaulterDto>();

        foreach (var plan in plans)
        {
            var overdueEntries = plan.Schedule.Where(e => e.Status == "overdue").ToList();
            if (overdueEntries.Count == 0) continue;

            var overdueAmt = overdueEntries.Sum(e => e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0));
            var maxDays = 0;
            foreach (var oe in overdueEntries)
            {
                if (DateTime.TryParse(oe.DueDate, out var dueDate))
                {
                    var days = (int)(today - dueDate).TotalDays;
                    if (days > maxDays) maxDays = days;
                }
            }

            var lastPaid = plan.Schedule
                .Where(e => e.Status == "paid" || e.Status == "partial")
                .OrderByDescending(e => e.PaidDate)
                .FirstOrDefault()?.PaidDate;

            defaulters.Add(new DefaulterDto
            {
                CustomerId = plan.CustomerId,
                CustomerName = plan.Customer?.FullName ?? "Unknown",
                Phone = plan.Customer?.Phone,
                Address = plan.Customer?.Address,
                PlanId = plan.Id,
                ProductName = plan.Product?.ProductName ?? "Unknown",
                MissedInstallments = overdueEntries.Count,
                OverdueAmount = overdueAmt,
                MaxDaysOverdue = maxDays,
                Status = "overdue",
                LastPaidDate = lastPaid
            });
        }

        return new DefaultersReportDto
        {
            TotalDefaulters = defaulters.Count,
            TotalDefaultedAmount = defaulters.Sum(d => d.OverdueAmount),
            Defaulters = defaulters.OrderByDescending(d => d.MaxDaysOverdue).ToList()
        };
    }

    public async Task<PaymentHistoryReportDto> GetPaymentHistoryReportAsync(int? customerId, DateTime? from, DateTime? to)
    {
        var query = _db.RepaymentEntries
            .Include(e => e.Plan).ThenInclude(p => p!.Customer)
            .Include(e => e.Plan).ThenInclude(p => p!.Product)
            .Where(e => e.PaidDate != null && e.PaidDate != "" && (e.Status == "paid" || e.Status == "partial"));

        if (customerId.HasValue)
            query = query.Where(e => e.Plan!.CustomerId == customerId.Value);

        var entries = await query.ToListAsync();

        if (from.HasValue || to.HasValue)
        {
            entries = entries.Where(e =>
            {
                if (!DateTime.TryParse(e.PaidDate, out var pd)) return false;
                if (from.HasValue && pd < from.Value) return false;
                if (to.HasValue && pd > to.Value.AddDays(1)) return false;
                return true;
            }).ToList();
        }

        var payments = entries.Select(e => new PaymentHistoryEntryDto
        {
            CustomerId = e.Plan!.CustomerId,
            CustomerName = e.Plan.Customer?.FullName ?? "Unknown",
            Phone = e.Plan.Customer?.Phone,
            PlanId = e.PlanId,
            InstallmentNo = e.InstallmentNo,
            PaidDate = e.PaidDate ?? "",
            Amount = e.ActualPaidAmount ?? 0,
            MiscAmount = e.MiscAdjustedAmount,
            PaymentMethod = "Cash",
            ProductName = e.Plan.Product?.ProductName ?? "Unknown"
        }).OrderByDescending(p => p.PaidDate).ToList();

        var methodSummary = payments
            .GroupBy(p => p.PaymentMethod)
            .Select(g => new PaymentMethodSummaryDto
            {
                Method = g.Key,
                Count = g.Count(),
                Amount = g.Sum(p => p.Amount + (p.MiscAmount ?? 0))
            }).ToList();

        return new PaymentHistoryReportDto
        {
            TotalPayments = payments.Count,
            TotalAmount = payments.Sum(p => p.Amount + (p.MiscAmount ?? 0)),
            Payments = payments,
            MethodSummary = methodSummary
        };
    }


    // ═══════════════════════════════════════════════════════════
    // SALES REPORTS
    // ═══════════════════════════════════════════════════════════

    public async Task<InstallmentSalesSummaryDto> GetInstallmentSalesSummaryAsync(DateTime? from, DateTime? to)
    {
        var plans = await _db.InstallmentPlans.ToListAsync();

        var filtered = plans.AsEnumerable();
        if (from.HasValue)
            filtered = filtered.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue)
            filtered = filtered.Where(p => p.CreatedAt <= to.Value.AddDays(1));

        var list = filtered.ToList();

        var tenureBreakdown = list
            .GroupBy(p => p.Tenure)
            .Select(g => new TenureSummaryDto
            {
                Tenure = g.Key,
                TenureLabel = $"{g.Key} months",
                Count = g.Count(),
                TotalAmount = g.Sum(p => p.TotalPayable)
            })
            .OrderBy(t => t.Tenure)
            .ToList();

        var monthlySales = list
            .GroupBy(p => p.CreatedAt.ToString("yyyy-MM"))
            .Select(g => new MonthlySalesDto
            {
                Month = g.Key,
                Contracts = g.Count(),
                DownPayments = g.Sum(p => p.DownPayment),
                FinancedAmount = g.Sum(p => p.FinancedAmount)
            })
            .OrderBy(m => m.Month)
            .ToList();

        return new InstallmentSalesSummaryDto
        {
            TotalContracts = list.Count,
            ActiveContracts = list.Count(p => p.Status == "active"),
            CompletedContracts = list.Count(p => p.Status == "completed"),
            CancelledContracts = list.Count(p => p.Status == "cancelled"),
            TotalDownPayments = list.Sum(p => p.DownPayment),
            TotalFinancedAmount = list.Sum(p => p.FinancedAmount),
            TotalRevenue = list.Sum(p => p.TotalPayable),
            TenureBreakdown = tenureBreakdown,
            MonthlySales = monthlySales
        };
    }

    public async Task<ProductSalesReportDto> GetProductSalesReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.InstallmentPlans
            .Include(p => p.Product).ThenInclude(pr => pr!.Images)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(p => p.CreatedAt <= to.Value.AddDays(1));

        var plans = await query.ToListAsync();

        var products = plans
            .GroupBy(p => p.ProductId)
            .Select(g =>
            {
                var first = g.First();
                var image = first.Product?.Images?.FirstOrDefault()?.ImagePath;
                return new ProductSalesItemDto
                {
                    ProductId = g.Key,
                    ProductName = first.Product?.ProductName ?? "Unknown",
                    ProductImage = image,
                    UnitsSold = g.Count(),
                    TotalRevenue = g.Sum(p => p.TotalPayable),
                    AveragePrice = g.Average(p => p.ProductPrice),
                    DownPaymentCollected = g.Sum(p => p.DownPayment)
                };
            })
            .OrderByDescending(p => p.TotalRevenue)
            .ToList();

        return new ProductSalesReportDto
        {
            TotalProducts = products.Count,
            TotalUnitsSold = products.Sum(p => p.UnitsSold),
            TotalRevenue = products.Sum(p => p.TotalRevenue),
            Products = products
        };
    }


    // ═══════════════════════════════════════════════════════════
    // RISK & COMPLIANCE
    // ═══════════════════════════════════════════════════════════

    public async Task<DefaultRateReportDto> GetDefaultRateReportAsync()
    {
        var today = DateTime.UtcNow;
        var plans = await _db.InstallmentPlans
            .Include(p => p.Schedule)
            .Where(p => p.Status != "cancelled")
            .ToListAsync();

        var totalFinanced = plans.Count;
        var plansWithOverdue = plans.Where(p =>
            p.Schedule.Any(e => e.Status == "overdue")).ToList();
        var defaulters = plansWithOverdue.Count;
        var defaultPct = totalFinanced > 0 ? Math.Round((decimal)defaulters / totalFinanced * 100, 2) : 0;

        var totalFinancedAmt = plans.Sum(p => p.FinancedAmount);
        var defaultedAmt = plansWithOverdue.Sum(p =>
            p.Schedule.Where(e => e.Status == "overdue")
                .Sum(e => e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0)));

        // Monthly trend
        var monthlyTrend = plans
            .GroupBy(p => p.CreatedAt.ToString("yyyy-MM"))
            .Select(g =>
            {
                var active = g.Count();
                var defaults = g.Count(p => p.Schedule.Any(e => e.Status == "overdue"));
                return new DefaultTrendDto
                {
                    Month = g.Key,
                    TotalActive = active,
                    NewDefaults = defaults,
                    DefaultRate = active > 0 ? Math.Round((decimal)defaults / active * 100, 2) : 0
                };
            })
            .OrderBy(m => m.Month)
            .ToList();

        return new DefaultRateReportDto
        {
            TotalFinancedCustomers = totalFinanced,
            NumberOfDefaulters = defaulters,
            DefaultPercentage = defaultPct,
            TotalFinancedAmount = totalFinancedAmt,
            DefaultedAmount = defaultedAmt,
            MonthlyTrend = monthlyTrend
        };
    }

    public async Task<RecoveryPerformanceDto> GetRecoveryPerformanceAsync(DateTime? from, DateTime? to)
    {
        var entries = await _db.RepaymentEntries
            .Include(e => e.Plan)
            .Where(e => e.Plan!.Status != "cancelled")
            .ToListAsync();

        // All entries that were/are overdue
        var overdueEntries = entries.Where(e => e.Status == "overdue" || e.Status == "paid" || e.Status == "partial").ToList();

        // Entries that were overdue but got paid (recovered) — paid after due date
        var recoveredEntries = entries.Where(e =>
        {
            if (e.Status != "paid" && e.Status != "partial") return false;
            if (string.IsNullOrEmpty(e.PaidDate) || string.IsNullOrEmpty(e.DueDate)) return false;
            if (!DateTime.TryParse(e.PaidDate, out var pd) || !DateTime.TryParse(e.DueDate, out var dd)) return false;
            return pd > dd; // paid after due date = was overdue
        }).ToList();

        if (from.HasValue || to.HasValue)
        {
            recoveredEntries = recoveredEntries.Where(e =>
            {
                if (!DateTime.TryParse(e.PaidDate, out var pd)) return false;
                if (from.HasValue && pd < from.Value) return false;
                if (to.HasValue && pd > to.Value.AddDays(1)) return false;
                return true;
            }).ToList();
        }

        var currentlyOverdue = entries.Where(e => e.Status == "overdue").ToList();
        var totalOverdueAmt = currentlyOverdue.Sum(e => e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0));
        var recoveredAmt = recoveredEntries.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0));
        var totalTarget = totalOverdueAmt + recoveredAmt;
        var recoveryRate = totalTarget > 0 ? Math.Round(recoveredAmt / totalTarget * 100, 2) : 0;

        // Monthly recovery
        var monthlyRecovery = recoveredEntries
            .Where(e => DateTime.TryParse(e.PaidDate, out _))
            .GroupBy(e => DateTime.Parse(e.PaidDate!).ToString("yyyy-MM"))
            .Select(g => new MonthlyRecoveryDto
            {
                Month = g.Key,
                OverdueAmount = g.Sum(e => e.EmiAmount),
                Recovered = g.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0)),
                RecoveryRate = g.Sum(e => e.EmiAmount) > 0
                    ? Math.Round(g.Sum(e => (e.ActualPaidAmount ?? 0) + (e.MiscAdjustedAmount ?? 0)) / g.Sum(e => e.EmiAmount) * 100, 2)
                    : 0
            })
            .OrderBy(m => m.Month)
            .ToList();

        return new RecoveryPerformanceDto
        {
            TotalOverdueAmount = totalOverdueAmt,
            AmountRecovered = recoveredAmt,
            RecoveryRate = recoveryRate,
            TotalOverdueEntries = currentlyOverdue.Count,
            RecoveredEntries = recoveredEntries.Count,
            MonthlyRecovery = monthlyRecovery
        };
    }


    // ═══════════════════════════════════════════════════════════
    // OPERATIONAL REPORTS
    // ═══════════════════════════════════════════════════════════

    public async Task<DueTodayReportDto> GetDueTodayReportAsync()
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

        var entries = await _db.RepaymentEntries
            .Include(e => e.Plan).ThenInclude(p => p!.Customer)
            .Include(e => e.Plan).ThenInclude(p => p!.Product)
            .Where(e => e.DueDate == today && e.Status != "paid" && e.Plan!.Status == "active")
            .ToListAsync();

        // Also include overdue entries
        var overdueEntries = await _db.RepaymentEntries
            .Include(e => e.Plan).ThenInclude(p => p!.Customer)
            .Include(e => e.Plan).ThenInclude(p => p!.Product)
            .Where(e => e.Status == "overdue" && e.Plan!.Status == "active")
            .ToListAsync();

        var allItems = entries.Concat(overdueEntries)
            .GroupBy(e => new { e.PlanId, e.InstallmentNo })
            .Select(g => g.First())
            .ToList();

        var items = allItems.Select(e => new DueTodayItemDto
        {
            PlanId = e.PlanId,
            CustomerId = e.Plan!.CustomerId,
            CustomerName = e.Plan.Customer?.FullName ?? "Unknown",
            Phone = e.Plan.Customer?.Phone,
            Address = e.Plan.Customer?.Address,
            InstallmentNo = e.InstallmentNo,
            AmountDue = e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0),
            DueDate = e.DueDate,
            ProductName = e.Plan.Product?.ProductName ?? "Unknown",
            Status = e.Status
        }).OrderBy(i => i.DueDate).ToList();

        return new DueTodayReportDto
        {
            TotalDueToday = items.Count,
            TotalAmountDue = items.Sum(i => i.AmountDue),
            Items = items
        };
    }

    public async Task<UpcomingDueReportDto> GetUpcomingDueReportAsync(int days = 7)
    {
        var today = DateTime.UtcNow;
        var endDate = today.AddDays(days);
        var todayStr = today.ToString("yyyy-MM-dd");
        var endStr = endDate.ToString("yyyy-MM-dd");

        var entries = await _db.RepaymentEntries
            .Include(e => e.Plan).ThenInclude(p => p!.Customer)
            .Include(e => e.Plan).ThenInclude(p => p!.Product)
            .Where(e => e.Status != "paid" && e.Plan!.Status == "active")
            .ToListAsync();

        var upcoming = entries.Where(e =>
        {
            if (!DateTime.TryParse(e.DueDate, out var dd)) return false;
            return dd >= today.Date && dd <= endDate.Date;
        }).ToList();

        var items = upcoming.Select(e => new DueTodayItemDto
        {
            PlanId = e.PlanId,
            CustomerId = e.Plan!.CustomerId,
            CustomerName = e.Plan.Customer?.FullName ?? "Unknown",
            Phone = e.Plan.Customer?.Phone,
            Address = e.Plan.Customer?.Address,
            InstallmentNo = e.InstallmentNo,
            AmountDue = e.EmiAmount - (e.ActualPaidAmount ?? 0) - (e.MiscAdjustedAmount ?? 0),
            DueDate = e.DueDate,
            ProductName = e.Plan.Product?.ProductName ?? "Unknown",
            Status = e.Status
        }).OrderBy(i => i.DueDate).ToList();

        return new UpcomingDueReportDto
        {
            TotalUpcoming = items.Count,
            TotalAmountDue = items.Sum(i => i.AmountDue),
            Items = items
        };
    }

    public async Task<LateFeeReportDto> GetLateFeeReportAsync(DateTime? from, DateTime? to)
    {
        var entries = await _db.RepaymentEntries
            .Include(e => e.Plan).ThenInclude(p => p!.Customer)
            .Where(e => e.Plan!.Status != "cancelled")
            .ToListAsync();

        // Find entries paid late or still overdue
        var lateEntries = entries.Where(e =>
        {
            if (e.Status == "overdue") return true;
            if ((e.Status == "paid" || e.Status == "partial") && !string.IsNullOrEmpty(e.PaidDate) && !string.IsNullOrEmpty(e.DueDate))
            {
                if (DateTime.TryParse(e.PaidDate, out var pd) && DateTime.TryParse(e.DueDate, out var dd))
                    return pd.Date > dd.Date;
            }
            return false;
        }).ToList();

        if (from.HasValue || to.HasValue)
        {
            lateEntries = lateEntries.Where(e =>
            {
                var dateStr = e.PaidDate ?? e.DueDate;
                if (!DateTime.TryParse(dateStr, out var d)) return true;
                if (from.HasValue && d < from.Value) return false;
                if (to.HasValue && d > to.Value.AddDays(1)) return false;
                return true;
            }).ToList();
        }

        var items = lateEntries.Select(e =>
        {
            var daysLate = 0;
            if (DateTime.TryParse(e.DueDate, out var dd))
            {
                var compareDate = e.PaidDate != null && DateTime.TryParse(e.PaidDate, out var pd) ? pd : DateTime.UtcNow;
                daysLate = Math.Max(0, (int)(compareDate - dd).TotalDays);
            }

            // Simple late fee calculation: e.g., 1% of EMI per day late (capped at 30%)
            var lateFee = Math.Round(e.EmiAmount * 0.01m * Math.Min(daysLate, 30), 2);

            return new LateFeeItemDto
            {
                PlanId = e.PlanId,
                CustomerName = e.Plan?.Customer?.FullName ?? "Unknown",
                Phone = e.Plan?.Customer?.Phone,
                InstallmentNo = e.InstallmentNo,
                DueDate = e.DueDate,
                PaidDate = e.PaidDate,
                DaysLate = daysLate,
                LateFeeAmount = lateFee,
                IsPaid = e.Status == "paid"
            };
        }).OrderByDescending(i => i.DaysLate).ToList();

        return new LateFeeReportDto
        {
            TotalLateFees = items.Sum(i => i.LateFeeAmount),
            PaidLateFees = items.Where(i => i.IsPaid).Sum(i => i.LateFeeAmount),
            UnpaidLateFees = items.Where(i => !i.IsPaid).Sum(i => i.LateFeeAmount),
            TotalLateEntries = items.Count,
            Items = items
        };
    }


    // ═══════════════════════════════════════════════════════════
    // PRODUCT PROFIT REPORT
    // ═══════════════════════════════════════════════════════════

    public async Task<ProductProfitReportDto> GetProductProfitReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.InstallmentPlans
            .Include(p => p.Customer)
            .Include(p => p.Product).ThenInclude(pr => pr!.Images)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(p => p.CreatedAt <= to.Value.AddDays(1));

        var plans = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

        var items = plans.Select(p =>
        {
            var profit = p.TotalPayable - p.ProductPrice;
            var profitPct = p.ProductPrice > 0 ? Math.Round((profit / p.ProductPrice) * 100, 2) : 0;
            var image = p.Product?.Images?.FirstOrDefault()?.ImagePath;
            return new ProductProfitItemDto
            {
                PlanId = p.Id,
                CustomerName = p.Customer?.FullName ?? "Unknown",
                Phone = p.Customer?.Phone,
                ProductName = p.Product?.ProductName ?? "Unknown",
                ProductImage = image,
                ProductPrice = p.ProductPrice,
                FinancedAmount = p.FinancedAmount,
                TotalPayable = p.TotalPayable,
                DownPayment = p.DownPayment,
                InterestEarned = p.TotalInterest,
                Profit = profit,
                ProfitPercentage = profitPct,
                Status = p.Status,
                StartDate = p.StartDate,
                Tenure = p.Tenure,
                InterestRate = p.InterestRate
            };
        }).ToList();

        var totalProductCost = items.Sum(i => i.ProductPrice);
        var totalFinanced = items.Sum(i => i.TotalPayable);
        var totalProfit = items.Sum(i => i.Profit);

        return new ProductProfitReportDto
        {
            TotalPlans = items.Count(),
            TotalProductCost = totalProductCost,
            TotalFinancedAmount = totalFinanced,
            TotalProfit = totalProfit,
            TotalInterestEarned = items.Sum(i => i.InterestEarned),
            TotalDownPayments = items.Sum(i => i.DownPayment),
            AverageProfitPerPlan = items.Count() > 0 ? Math.Round(totalProfit / items.Count(), 2) : 0,
            Plans = items
        };
    }
}
