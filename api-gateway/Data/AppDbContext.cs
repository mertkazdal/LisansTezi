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
    public DbSet<UserPersonalityProfile> UserPersonalityProfiles { get; set; } = null!;
    public DbSet<AnalysisRecord> AnalysisRecords { get; set; } = null!;
    public DbSet<PersonalityUpdateLog> PersonalityUpdateLogs { get; set; } = null!;
    public DbSet<UserMediaLog> UserMediaLogs { get; set; } = null!;

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
            entity.Property(e => e.PreferredColorTheme).HasDefaultValue("kirmizi");
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

        modelBuilder.Entity<UserPersonalityProfile>(entity =>
        {
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.BigFiveJson).HasDefaultValueSql("'{}'::jsonb");
            entity.Property(e => e.RawSurveyAnswers).HasDefaultValueSql("'{}'::jsonb");
            entity.Property(e => e.LastUpdated).HasDefaultValueSql("NOW()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.HasOne(e => e.User)
                  .WithOne(u => u.PersonalityProfile)
                  .HasForeignKey<UserPersonalityProfile>(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AnalysisRecord>(entity =>
        {
            entity.ToTable(tableBuilder =>
            {
                tableBuilder.HasCheckConstraint(
                    "CK_analysis_records_input_type",
                    "\"input_type\" IN ('image', 'text', 'both')"
                );
                tableBuilder.HasCheckConstraint(
                    "CK_analysis_records_emotion_result",
                    "\"emotion_result\" IN ('happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'tired', 'stressed', 'nostalgic', 'motivated', 'hopeful', 'overwhelmed')"
                );
                tableBuilder.HasCheckConstraint(
                    "CK_analysis_records_status",
                    "\"status\" IN ('complete', 'partial', 'failed')"
                );
            });
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ShareToken).IsUnique().HasFilter("\"share_token\" IS NOT NULL");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ConflictDetected).HasDefaultValue(false);
            entity.Property(e => e.RecommendationsJson).HasDefaultValueSql("'{}'::jsonb");
            entity.Property(e => e.Language).HasDefaultValue("tr");
            entity.Property(e => e.Status).HasDefaultValue("complete");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.AnalysisRecords)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PersonalityUpdateLog>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.UpdatedAt);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.PersonalityUpdateLogs)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserMediaLog>(entity =>
        {
            entity.ToTable(tableBuilder =>
            {
                tableBuilder.HasCheckConstraint(
                    "CK_user_media_log_type",
                    "\"type\" IN ('film', 'book')"
                );
            });
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.LoggedAt);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.LoggedAt).HasDefaultValueSql("NOW()");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.MediaLogs)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
