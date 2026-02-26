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

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = new();

    // Navigation to online order details (only populated for online orders)
    public OnlineOrderDetail? OnlineDetail { get; set; }
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
