using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("user_media_log")]
public class UserMediaLog
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("type")]
    [Required]
    [MaxLength(16)]
    public string Type { get; set; } = "film";

    [Column("title")]
    [Required]
    [MaxLength(240)]
    public string Title { get; set; } = string.Empty;

    [Column("note")]
    [MaxLength(1000)]
    public string? Note { get; set; }

    [Column("logged_at")]
    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
