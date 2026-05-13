using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoodLens.ApiGateway.Models;

[Table("personality_update_logs")]
public class PersonalityUpdateLog
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("trigger_source")]
    [MaxLength(64)]
    public string TriggerSource { get; set; } = "survey";

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
