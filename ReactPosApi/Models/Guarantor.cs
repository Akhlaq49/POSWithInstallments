using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactPosApi.Models;

public class Guarantor
{
    [Key]
    public int Id { get; set; }

    public int PlanId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? SO { get; set; }  // Son/Daughter Of

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(50)]
    public string? Cnic { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Relationship { get; set; }

    [MaxLength(500)]
    public string? Picture { get; set; }  // path to uploaded image

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("PlanId")]
    public InstallmentPlan? Plan { get; set; }
}
