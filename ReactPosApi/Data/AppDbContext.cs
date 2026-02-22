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

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("User");
        });
    }
}
