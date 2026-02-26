using System.ComponentModel.DataAnnotations;

namespace ReactPosApi.Models;

public class Order
{
    public int Id { get; set; }

    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    public int? CustomerId { get; set; }
    public Party? Customer { get; set; }

    [MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? CustomerImage { get; set; }

    [MaxLength(50)]
    public string PaymentType { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "Pending";

    /// <summary>POS or Online</summary>
    [MaxLength(20)]
    public string OrderSource { get; set; } = "POS";

    [MaxLength(200)]
    public string? CustomerEmail { get; set; }

    [MaxLength(50)]
    public string? CustomerPhone { get; set; }

    public string? ShippingAddress { get; set; }
    public string? BillingAddress { get; set; }
    public string? Notes { get; set; }

    public decimal SubTotal { get; set; }
    public decimal Shipping { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int ProductId { get; set; }

    [MaxLength(200)]
    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; } = 1;

    public decimal Price { get; set; }
}
