using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("saved_recommendations")]
public class SavedRecommendation
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("analysis_record_id")]
    public Guid? AnalysisRecordId { get; set; }

    [Column("item_type")]
    [Required]
    [MaxLength(16)]
    public string ItemType { get; set; } = string.Empty;

    [Column("item_id")]
    [Required]
    [MaxLength(240)]
    public string ItemId { get; set; } = string.Empty;

    [Column("item_title")]
    [Required]
    [MaxLength(500)]
    public string ItemTitle { get; set; } = string.Empty;

    [Column("item_data", TypeName = "jsonb")]
    public string ItemData { get; set; } = "{}";

    [Column("saved_at")]
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [ForeignKey("AnalysisRecordId")]
    public AnalysisRecord? AnalysisRecord { get; set; }
}
