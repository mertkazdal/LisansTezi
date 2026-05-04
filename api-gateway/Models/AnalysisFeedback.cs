using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("analysis_feedback")]
public class AnalysisFeedback
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("history_id")]
    [Required]
    public Guid HistoryId { get; set; }

    [Column("user_id")]
    public Guid? UserId { get; set; }

    [Column("guest_session_id")]
    public string? GuestSessionId { get; set; }

    [Column("overall_rating")]
    public int OverallRating { get; set; }

    [Column("analysis_accuracy_rating")]
    public int AnalysisAccuracyRating { get; set; }

    [Column("recommendation_quality_rating")]
    public int RecommendationQualityRating { get; set; }

    [Column("helpful")]
    public bool Helpful { get; set; }

    [Column("would_reuse")]
    public bool WouldReuse { get; set; }

    [Column("comment")]
    public string? Comment { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("HistoryId")]
    public EmotionHistory? EmotionHistory { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }
}
