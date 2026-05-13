using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("user_personality_profiles")]
public class UserPersonalityProfile
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("big_five_json", TypeName = "jsonb")]
    public string BigFiveJson { get; set; } = "{}";

    [Column("mbti_type")]
    [MaxLength(8)]
    public string? MbtiType { get; set; }

    [Column("raw_survey_answers", TypeName = "jsonb")]
    public string RawSurveyAnswers { get; set; } = "{}";

    [Column("spotify_top_tracks_json", TypeName = "jsonb")]
    public string? SpotifyTopTracksJson { get; set; }

    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("avatar_generated_at")]
    public DateTime? AvatarGeneratedAt { get; set; }

    [Column("last_updated")]
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

}
