using Microsoft.EntityFrameworkCore;
using ReactPosApi.Models;

namespace ReactPosApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Lookup tables
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Unit> Units => Set<Unit>();

    public DbSet<VariantAttribute> VariantAttributes => Set<VariantAttribute>();
    public DbSet<Warranty> Warranties => Set<Warranty>();
    public DbSet<StockEntry> StockEntries => Set<StockEntry>();
    public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();
    public DbSet<StockTransfer> StockTransfers => Set<StockTransfer>();
    public DbSet<StockTransferItem> StockTransferItems => Set<StockTransferItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<SalePayment> SalePayments => Set<SalePayment>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<SalesReturn> SalesReturns => Set<SalesReturn>();
    public DbSet<SalesReturnItem> SalesReturnItems => Set<SalesReturnItem>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<QuotationItem> QuotationItems => Set<QuotationItem>();

    // Inventory
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<SubCategory> SubCategories => Set<SubCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();

    // Customers
    public DbSet<Customer> Customers => Set<Customer>();

    // Installments
    public DbSet<InstallmentPlan> InstallmentPlans => Set<InstallmentPlan>();
    public DbSet<RepaymentEntry> RepaymentEntries => Set<RepaymentEntry>();

    // Auth
    public DbSet<User> Users => Set<User>();

    // Role Permissions
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Category
        modelBuilder.Entity<Category>(e =>
        {
            e.HasIndex(c => c.Slug).IsUnique();
            e.Property(c => c.Status).HasDefaultValue("active");
        });

        // SubCategory -> Category
        modelBuilder.Entity<SubCategory>(e =>
        {
            e.HasOne(sc => sc.Category)
             .WithMany(c => c.SubCategories)
             .HasForeignKey(sc => sc.CategoryId)
             .OnDelete(DeleteBehavior.Restrict);
            e.Property(sc => sc.Status).HasDefaultValue("active");
        });

        // Product
        modelBuilder.Entity<Product>(e =>
        {
            e.Property(p => p.Price).HasColumnType("decimal(18,2)");
            e.Property(p => p.DiscountValue).HasColumnType("decimal(18,2)");
            e.Property(p => p.ProductType).HasDefaultValue("single");
        });

        // ProductImage -> Product
        modelBuilder.Entity<ProductImage>(e =>
        {
            e.HasOne(pi => pi.Product)
             .WithMany(p => p.Images)
             .HasForeignKey(pi => pi.ProductId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Customer
        modelBuilder.Entity<Customer>(e =>
        {
            e.Property(c => c.Status).HasDefaultValue("active");
        });

        // InstallmentPlan
        modelBuilder.Entity<InstallmentPlan>(e =>
        {
            e.HasOne(ip => ip.Customer)
             .WithMany()
             .HasForeignKey(ip => ip.CustomerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(ip => ip.Product)
             .WithMany()
             .HasForeignKey(ip => ip.ProductId)
             .OnDelete(DeleteBehavior.Restrict);

            e.Property(p => p.ProductPrice).HasColumnType("decimal(18,2)");
            e.Property(p => p.DownPayment).HasColumnType("decimal(18,2)");
            e.Property(p => p.FinancedAmount).HasColumnType("decimal(18,2)");
            e.Property(p => p.InterestRate).HasColumnType("decimal(8,4)");
            e.Property(p => p.EmiAmount).HasColumnType("decimal(18,2)");
            e.Property(p => p.TotalPayable).HasColumnType("decimal(18,2)");
            e.Property(p => p.TotalInterest).HasColumnType("decimal(18,2)");
            e.Property(p => p.Status).HasDefaultValue("active");
        });

        // RepaymentEntry -> InstallmentPlan
        modelBuilder.Entity<RepaymentEntry>(e =>
        {
            e.HasOne(r => r.Plan)
             .WithMany(p => p.Schedule)
             .HasForeignKey(r => r.PlanId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(r => r.EmiAmount).HasColumnType("decimal(18,2)");
            e.Property(r => r.Principal).HasColumnType("decimal(18,2)");
            e.Property(r => r.Interest).HasColumnType("decimal(18,2)");
            e.Property(r => r.Balance).HasColumnType("decimal(18,2)");
            e.Property(r => r.Status).HasDefaultValue("upcoming");
        });

        // StockTransferItem -> StockTransfer
        modelBuilder.Entity<StockTransferItem>(e =>
        {
            e.HasOne(i => i.StockTransfer)
             .WithMany(t => t.Items)
             .HasForeignKey(i => i.StockTransferId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Order
        modelBuilder.Entity<Order>(e =>
        {
            e.HasOne(o => o.Customer)
             .WithMany()
             .HasForeignKey(o => o.CustomerId)
             .OnDelete(DeleteBehavior.SetNull);
            e.Property(o => o.Amount).HasColumnType("decimal(18,2)");
        });

        // OrderItem -> Order
        modelBuilder.Entity<OrderItem>(e =>
        {
            e.HasOne(i => i.Order)
             .WithMany(o => o.Items)
             .HasForeignKey(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(i => i.Price).HasColumnType("decimal(18,2)");
        });

        // Sale
        modelBuilder.Entity<Sale>(e =>
        {
            e.HasOne(s => s.Customer)
             .WithMany()
             .HasForeignKey(s => s.CustomerId)
             .OnDelete(DeleteBehavior.SetNull);
            e.Property(s => s.GrandTotal).HasColumnType("decimal(18,2)");
            e.Property(s => s.Paid).HasColumnType("decimal(18,2)");
            e.Property(s => s.Due).HasColumnType("decimal(18,2)");
            e.Property(s => s.OrderTax).HasColumnType("decimal(18,2)");
            e.Property(s => s.Discount).HasColumnType("decimal(18,2)");
            e.Property(s => s.Shipping).HasColumnType("decimal(18,2)");
        });

        // SaleItem -> Sale
        modelBuilder.Entity<SaleItem>(e =>
        {
            e.HasOne(i => i.Sale)
             .WithMany(s => s.Items)
             .HasForeignKey(i => i.SaleId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(i => i.PurchasePrice).HasColumnType("decimal(18,2)");
            e.Property(i => i.Discount).HasColumnType("decimal(18,2)");
            e.Property(i => i.TaxPercent).HasColumnType("decimal(8,4)");
            e.Property(i => i.TaxAmount).HasColumnType("decimal(18,2)");
            e.Property(i => i.UnitCost).HasColumnType("decimal(18,2)");
            e.Property(i => i.TotalCost).HasColumnType("decimal(18,2)");
        });

        // SalePayment -> Sale
        modelBuilder.Entity<SalePayment>(e =>
        {
            e.HasOne(p => p.Sale)
             .WithMany(s => s.Payments)
             .HasForeignKey(p => p.SaleId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(p => p.ReceivedAmount).HasColumnType("decimal(18,2)");
            e.Property(p => p.PayingAmount).HasColumnType("decimal(18,2)");
        });

        // Invoice
        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasOne(i => i.Customer)
             .WithMany()
             .HasForeignKey(i => i.CustomerId)
             .OnDelete(DeleteBehavior.SetNull);
            e.Property(i => i.SubTotal).HasColumnType("decimal(18,2)");
            e.Property(i => i.Discount).HasColumnType("decimal(18,2)");
            e.Property(i => i.DiscountPercent).HasColumnType("decimal(8,4)");
            e.Property(i => i.Tax).HasColumnType("decimal(18,2)");
            e.Property(i => i.TaxPercent).HasColumnType("decimal(8,4)");
            e.Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
            e.Property(i => i.Paid).HasColumnType("decimal(18,2)");
            e.Property(i => i.AmountDue).HasColumnType("decimal(18,2)");
        });

        // InvoiceItem -> Invoice
        modelBuilder.Entity<InvoiceItem>(e =>
        {
            e.HasOne(i => i.Invoice)
             .WithMany(inv => inv.Items)
             .HasForeignKey(i => i.InvoiceId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(i => i.Cost).HasColumnType("decimal(18,2)");
            e.Property(i => i.Discount).HasColumnType("decimal(18,2)");
            e.Property(i => i.Total).HasColumnType("decimal(18,2)");
        });

        // SalesReturn
        modelBuilder.Entity<SalesReturn>(e =>
        {
            e.HasOne(r => r.Customer)
             .WithMany()
             .HasForeignKey(r => r.CustomerId)
             .OnDelete(DeleteBehavior.SetNull);
            e.Property(r => r.OrderTax).HasColumnType("decimal(18,2)");
            e.Property(r => r.Discount).HasColumnType("decimal(18,2)");
            e.Property(r => r.Shipping).HasColumnType("decimal(18,2)");
            e.Property(r => r.GrandTotal).HasColumnType("decimal(18,2)");
            e.Property(r => r.Paid).HasColumnType("decimal(18,2)");
            e.Property(r => r.Due).HasColumnType("decimal(18,2)");
        });

        // SalesReturnItem -> SalesReturn
        modelBuilder.Entity<SalesReturnItem>(e =>
        {
            e.HasOne(i => i.SalesReturn)
             .WithMany(r => r.Items)
             .HasForeignKey(i => i.SalesReturnId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(i => i.NetUnitPrice).HasColumnType("decimal(18,2)");
            e.Property(i => i.Discount).HasColumnType("decimal(18,2)");
            e.Property(i => i.TaxPercent).HasColumnType("decimal(8,4)");
            e.Property(i => i.Subtotal).HasColumnType("decimal(18,2)");
        });

        // Quotation
        modelBuilder.Entity<Quotation>(e =>
        {
            e.HasOne(q => q.Customer)
             .WithMany()
             .HasForeignKey(q => q.CustomerId)
             .OnDelete(DeleteBehavior.SetNull);
            e.Property(q => q.OrderTax).HasColumnType("decimal(18,2)");
            e.Property(q => q.Discount).HasColumnType("decimal(18,2)");
            e.Property(q => q.Shipping).HasColumnType("decimal(18,2)");
            e.Property(q => q.GrandTotal).HasColumnType("decimal(18,2)");
        });

        // QuotationItem -> Quotation
        modelBuilder.Entity<QuotationItem>(e =>
        {
            e.HasOne(i => i.Quotation)
             .WithMany(q => q.Items)
             .HasForeignKey(i => i.QuotationId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(i => i.PurchasePrice).HasColumnType("decimal(18,2)");
            e.Property(i => i.Discount).HasColumnType("decimal(18,2)");
            e.Property(i => i.TaxPercent).HasColumnType("decimal(8,4)");
            e.Property(i => i.TaxAmount).HasColumnType("decimal(18,2)");
            e.Property(i => i.UnitCost).HasColumnType("decimal(18,2)");
            e.Property(i => i.TotalCost).HasColumnType("decimal(18,2)");
        });

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("User");
        });

        // RolePermission
        modelBuilder.Entity<RolePermission>(e =>
        {
            e.HasIndex(rp => new { rp.Role, rp.MenuKey }).IsUnique();
        });
    }
}
