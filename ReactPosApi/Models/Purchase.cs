using System.ComponentModel.DataAnnotations;

namespace ReactPosApi.Models;

public class Purchase
{
    public int Id { get; set; }

    [MaxLength(100)]
    [Required]
    public string SupplierName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? SupplierRef { get; set; }

    [MaxLength(50)]
    [Required]
    public string Reference { get; set; } = string.Empty;

    public DateTime Date { get; set; } = DateTime.UtcNow;

    [MaxLength(30)]
    public string Status { get; set; } = "Received"; // Received, Pending, Ordered, Cancelled

    [MaxLength(30)]
    public string PaymentStatus { get; set; } = "Unpaid"; // Paid, Unpaid, Overdue, Partial

    public decimal Total { get; set; }
    public decimal Paid { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
