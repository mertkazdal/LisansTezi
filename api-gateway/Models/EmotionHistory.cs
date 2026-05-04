using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("emotion_history")]
public class EmotionHistory
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid? UserId { get; set; }

    [Column("guest_session_id")]
    public string? GuestSessionId { get; set; }

    [Column("detected_emotion")]
    [Required]
    [MaxLength(50)]
    public string DetectedEmotion { get; set; } = string.Empty;

    [Column("confidence")]
    public double Confidence { get; set; }

    [Column("explanation")]
    public string? Explanation { get; set; }

    [Column("image_path")]
    public string? ImagePath { get; set; }

    [Column("user_text")]
    public string? UserText { get; set; }

    [Column("modality_used")]
    [Required]
    [MaxLength(32)]
    public string ModalityUsed { get; set; } = "multimodal";

    [Column("model_used")]
    [Required]
    [MaxLength(64)]
    public string ModelUsed { get; set; } = "gemini-multimodal";

    [Column("response_time_ms")]
    public int? ResponseTimeMs { get; set; }

    [Column("face_detected")]
    public bool FaceDetected { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }

    public ICollection<Recommendation> Recommendations { get; set; } = new List<Recommendation>();
    public ICollection<AnalysisFeedback> FeedbackEntries { get; set; } = new List<AnalysisFeedback>();
}
