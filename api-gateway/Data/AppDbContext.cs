using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Models;

namespace MoodLens.ApiGateway.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<EmotionHistory> EmotionHistories { get; set; } = null!;
    public DbSet<Recommendation> Recommendations { get; set; } = null!;
    public DbSet<AnalysisFeedback> AnalysisFeedback { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresExtension("pgcrypto");

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        // EmotionHistory
        modelBuilder.Entity<EmotionHistory>(entity =>
        {
            entity.ToTable(tableBuilder =>
            {
                tableBuilder.HasCheckConstraint(
                    "CK_emotion_history_owner",
                    "\"user_id\" IS NOT NULL OR \"guest_session_id\" IS NOT NULL"
                );
            });
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.GuestSessionId);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Confidence).HasDefaultValue(0d);
            entity.Property(e => e.FaceDetected).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.EmotionHistories)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Recommendation
        modelBuilder.Entity<Recommendation>(entity =>
        {
            entity.ToTable(tableBuilder =>
            {
                tableBuilder.HasCheckConstraint(
                    "CK_recommendations_category",
                    "\"category\" IN ('music', 'movie', 'book', 'advice')"
                );
            });
            entity.HasIndex(e => e.HistoryId);
            entity.HasIndex(e => e.Category);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Content).HasDefaultValueSql("'{}'::jsonb");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.HasOne(e => e.EmotionHistory)
                  .WithMany(h => h.Recommendations)
                  .HasForeignKey(e => e.HistoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AnalysisFeedback>(entity =>
        {
            entity.ToTable(tableBuilder =>
            {
                tableBuilder.HasCheckConstraint(
                    "CK_analysis_feedback_overall_rating",
                    "\"overall_rating\" BETWEEN 1 AND 5"
                );
                tableBuilder.HasCheckConstraint(
                    "CK_analysis_feedback_accuracy_rating",
                    "\"analysis_accuracy_rating\" BETWEEN 1 AND 5"
                );
                tableBuilder.HasCheckConstraint(
                    "CK_analysis_feedback_recommendation_rating",
                    "\"recommendation_quality_rating\" BETWEEN 1 AND 5"
                );
            });
            entity.HasIndex(e => e.HistoryId).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.GuestSessionId);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Helpful).HasDefaultValue(false);
            entity.Property(e => e.WouldReuse).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.HasOne(e => e.EmotionHistory)
                  .WithMany(h => h.FeedbackEntries)
                  .HasForeignKey(e => e.HistoryId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.FeedbackEntries)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
