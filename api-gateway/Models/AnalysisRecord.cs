using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("analysis_records")]
public class AnalysisRecord
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid? UserId { get; set; }

    [Column("session_id")]
    [MaxLength(128)]
    public string? SessionId { get; set; }

    [Column("input_type")]
    [Required]
    [MaxLength(16)]
    public string InputType { get; set; } = "text";

    [Column("emotion_result")]
    [Required]
    [MaxLength(50)]
    public string EmotionResult { get; set; } = string.Empty;

    [Column("emotion_confidence")]
    public double EmotionConfidence { get; set; }

    [Column("image_emotion")]
    [MaxLength(50)]
    public string? ImageEmotion { get; set; }

    [Column("image_confidence")]
    public double? ImageConfidence { get; set; }

    [Column("text_emotion")]
    [MaxLength(50)]
    public string? TextEmotion { get; set; }

    [Column("text_confidence")]
    public double? TextConfidence { get; set; }

    [Column("conflict_detected")]
    public bool ConflictDetected { get; set; }

    [Column("personality_snapshot", TypeName = "jsonb")]
    public string? PersonalitySnapshot { get; set; }

    [Column("recommendations_json", TypeName = "jsonb")]
    public string RecommendationsJson { get; set; } = "{}";

    [Column("language")]
    [MaxLength(8)]
    public string Language { get; set; } = "tr";

    [Column("status")]
    [MaxLength(16)]
    public string Status { get; set; } = "complete";

    [Column("share_token")]
    [MaxLength(80)]
    public string? ShareToken { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
}
