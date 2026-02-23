namespace ReactPosApi.DTOs;

// ============================
// Dropdown
// ============================
public record DropdownOptionDto(string Value, string Label);

// ============================
// Category
// ============================
public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string CreatedOn { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

// ============================
// SubCategory
// ============================
public class SubCategoryDto
{
    public int Id { get; set; }
    public string? Image { get; set; }
    public string SubCategory { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string CategoryCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "active";
}

public class CreateSubCategoryDto
{
    public string SubCategory { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string? CategoryCode { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "active";
    // Image uploaded as IFormFile in the controller
}

// ============================
// Product
// ============================
public class ProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Store { get; set; } = string.Empty;
    public string Warehouse { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string SellingType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string SubCategory { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string BarcodeSymbology { get; set; } = string.Empty;
    public string ItemBarcode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ProductType { get; set; } = "single";
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string TaxType { get; set; } = string.Empty;
    public string Tax { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public int QuantityAlert { get; set; }
    public string Warranty { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string ManufacturedDate { get; set; } = string.Empty;
    public string ExpiryDate { get; set; } = string.Empty;
    public string[] Images { get; set; } = Array.Empty<string>();
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

// ============================
// Customer
// ============================
public class CustomerDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

public class CreateCustomerDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

// ============================
// Installment
// ============================
public class RepaymentEntryDto
{
    public int InstallmentNo { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public decimal EmiAmount { get; set; }
    public decimal Principal { get; set; }
    public decimal Interest { get; set; }
    public decimal Balance { get; set; }
    public string Status { get; set; } = "upcoming";
    public string? PaidDate { get; set; }
}

public class InstallmentPlanDto
{
    public string Id { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductImage { get; set; } = string.Empty;
    public decimal ProductPrice { get; set; }
    public decimal DownPayment { get; set; }
    public decimal FinancedAmount { get; set; }
    public decimal InterestRate { get; set; }
    public int Tenure { get; set; }
    public decimal EmiAmount { get; set; }
    public decimal TotalPayable { get; set; }
    public decimal TotalInterest { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public int PaidInstallments { get; set; }
    public int RemainingInstallments { get; set; }
    public string NextDueDate { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public List<RepaymentEntryDto> Schedule { get; set; } = new();
}

public class CreateInstallmentDto
{
    public int CustomerId { get; set; }
    public int ProductId { get; set; }
    public decimal DownPayment { get; set; }
    public decimal InterestRate { get; set; }
    public int Tenure { get; set; }
    public string StartDate { get; set; } = string.Empty;
}

// ============================
// Warranty
// ============================
public class WarrantyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Duration { get; set; }
    public string Period { get; set; } = "Month";
    public string DurationDisplay { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

public class CreateWarrantyDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Duration { get; set; }
    public string Period { get; set; } = "Month";
    public string Status { get; set; } = "active";
}

// ============================
// Variant Attribute
// ============================
public class VariantAttributeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Values { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateVariantAttributeDto
{
    public string Name { get; set; } = string.Empty;
    public string Values { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

// ============================
// Unit
// ============================
public class UnitDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public string Status { get; set; } = "active";
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateUnitDto
{
    public string Name { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

// ============================
// Brand
// ============================
public class BrandDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string Status { get; set; } = "active";
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateBrandDto
{
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
}

// ============================
// Expired Product Update
// ============================
public class UpdateExpiredDto
{
    public string? Sku { get; set; }
    public string? ProductName { get; set; }
    public string? ManufacturedDate { get; set; }
    public string? ExpiryDate { get; set; }
}

// ============================
// Low Stock Update
// ============================
public class UpdateLowStockDto
{
    public string? Warehouse { get; set; }
    public string? Store { get; set; }
    public string? Sku { get; set; }
    public string? Category { get; set; }
    public string? ProductName { get; set; }
    public int? Quantity { get; set; }
    public int? QuantityAlert { get; set; }
}
