using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("recommendations")]
public class Recommendation
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("history_id")]
    [Required]
    public Guid HistoryId { get; set; }

    [Column("category")]
    [Required]
    [MaxLength(20)]
    public string Category { get; set; } = string.Empty;

    [Column("content", TypeName = "jsonb")]
    public string Content { get; set; } = "{}";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("HistoryId")]
    public EmotionHistory? EmotionHistory { get; set; }
}
