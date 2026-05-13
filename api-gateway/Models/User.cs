using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("username")]
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Column("email")]
    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Column("password_hash")]
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("preferred_color_theme")]
    [Required]
    [MaxLength(24)]
    public string PreferredColorTheme { get; set; } = "kirmizi";

    [Column("recommendation_goal")]
    [MaxLength(32)]
    public string? RecommendationGoal { get; set; }

    [Column("energy_preference")]
    [MaxLength(32)]
    public string? EnergyPreference { get; set; }

    [Column("favorite_music_genres")]
    public string? FavoriteMusicGenres { get; set; }

    [Column("favorite_movie_genres")]
    public string? FavoriteMovieGenres { get; set; }

    [Column("favorite_book_genres")]
    public string? FavoriteBookGenres { get; set; }

    [Column("spotify_access_token")]
    public string? SpotifyAccessToken { get; set; }

    [Column("spotify_refresh_token")]
    public string? SpotifyRefreshToken { get; set; }

    [Column("spotify_token_expiry")]
    public DateTime? SpotifyTokenExpiry { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<EmotionHistory> EmotionHistories { get; set; } = new List<EmotionHistory>();
    public ICollection<AnalysisFeedback> FeedbackEntries { get; set; } = new List<AnalysisFeedback>();
    public UserPersonalityProfile? PersonalityProfile { get; set; }
    public ICollection<AnalysisRecord> AnalysisRecords { get; set; } = new List<AnalysisRecord>();
    public ICollection<PersonalityUpdateLog> PersonalityUpdateLogs { get; set; } = new List<PersonalityUpdateLog>();
    public ICollection<UserMediaLog> MediaLogs { get; set; } = new List<UserMediaLog>();
}
