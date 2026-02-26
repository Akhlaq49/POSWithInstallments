using System.ComponentModel.DataAnnotations;

namespace ReactPosApi.Models;

/// <summary>
/// Unified table for all person/entity types: Admin, Manager, User, Customer, Guarantor, etc.
/// The Role field distinguishes between types.
/// </summary>
public class Party
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? SO { get; set; }  // Son/Daughter Of

    [MaxLength(50)]
    public string? Cnic { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(500)]
    public string? Picture { get; set; }

    // Auth fields (only used when Role is Admin/Manager/User)
    [MaxLength(500)]
    public string? PasswordHash { get; set; }

    /// <summary>
    /// Determines the party type: "Admin", "Manager", "User", "Customer", "Guarantor"
    /// </summary>
    [Required, MaxLength(30)]
    public string Role { get; set; } = "Customer";

    [Required, MaxLength(20)]
    public string Status { get; set; } = "active";   // active / inactive

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation — plans this party guarantees
    public ICollection<PlanGuarantor> GuaranteedPlans { get; set; } = new List<PlanGuarantor>();

    // Navigation — addresses (billing/shipping)
    public ICollection<PartyAddress> Addresses { get; set; } = new List<PartyAddress>();
}
