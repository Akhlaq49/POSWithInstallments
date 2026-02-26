using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactPosApi.Models;

/// <summary>
/// Stores additional details for orders placed from the online storefront.
/// Linked to the Order table via FK (1:1 relationship).
/// Customer info comes from Party (via Order.CustomerId).
/// Addresses reference PartyAddress table.
/// </summary>
public class OnlineOrderDetail
{
    [Key]
    public int Id { get; set; }

    /// <summary>FK to Order</summary>
    public int OrderId { get; set; }

    [ForeignKey("OrderId")]
    public Order Order { get; set; } = null!;

    /// <summary>FK to PartyAddress for billing</summary>
    public int? BillingAddressId { get; set; }

    [ForeignKey("BillingAddressId")]
    public PartyAddress? BillingAddress { get; set; }

    /// <summary>FK to PartyAddress for shipping</summary>
    public int? ShippingAddressId { get; set; }

    [ForeignKey("ShippingAddressId")]
    public PartyAddress? ShippingAddress { get; set; }

    public string? Notes { get; set; }

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    public decimal SubTotal { get; set; }
    public decimal Shipping { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal GrandTotal { get; set; }

    /// <summary>e.g. "Online"</summary>
    [MaxLength(20)]
    public string OrderSource { get; set; } = "Online";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
