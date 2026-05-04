using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pgcrypto", ",,");

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    avatar_url = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "emotion_history",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    guest_session_id = table.Column<string>(type: "text", nullable: true),
                    detected_emotion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    confidence = table.Column<double>(type: "double precision", nullable: false, defaultValue: 0.0),
                    explanation = table.Column<string>(type: "text", nullable: true),
                    image_path = table.Column<string>(type: "text", nullable: true),
                    user_text = table.Column<string>(type: "text", nullable: true),
                    modality_used = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    model_used = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    response_time_ms = table.Column<int>(type: "integer", nullable: true),
                    face_detected = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_emotion_history", x => x.id);
                    table.CheckConstraint("CK_emotion_history_owner", "\"user_id\" IS NOT NULL OR \"guest_session_id\" IS NOT NULL");
                    table.ForeignKey(
                        name: "FK_emotion_history_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "analysis_feedback",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    history_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    guest_session_id = table.Column<string>(type: "text", nullable: true),
                    overall_rating = table.Column<int>(type: "integer", nullable: false),
                    analysis_accuracy_rating = table.Column<int>(type: "integer", nullable: false),
                    recommendation_quality_rating = table.Column<int>(type: "integer", nullable: false),
                    helpful = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    would_reuse = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    comment = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_analysis_feedback", x => x.id);
                    table.CheckConstraint("CK_analysis_feedback_accuracy_rating", "\"analysis_accuracy_rating\" BETWEEN 1 AND 5");
                    table.CheckConstraint("CK_analysis_feedback_overall_rating", "\"overall_rating\" BETWEEN 1 AND 5");
                    table.CheckConstraint("CK_analysis_feedback_recommendation_rating", "\"recommendation_quality_rating\" BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "FK_analysis_feedback_emotion_history_history_id",
                        column: x => x.history_id,
                        principalTable: "emotion_history",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_analysis_feedback_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "recommendations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    history_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    content = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recommendations", x => x.id);
                    table.CheckConstraint("CK_recommendations_category", "\"category\" IN ('music', 'movie', 'book', 'advice')");
                    table.ForeignKey(
                        name: "FK_recommendations_emotion_history_history_id",
                        column: x => x.history_id,
                        principalTable: "emotion_history",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_analysis_feedback_guest_session_id",
                table: "analysis_feedback",
                column: "guest_session_id");

            migrationBuilder.CreateIndex(
                name: "IX_analysis_feedback_history_id",
                table: "analysis_feedback",
                column: "history_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_analysis_feedback_user_id",
                table: "analysis_feedback",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_emotion_history_created_at",
                table: "emotion_history",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_emotion_history_guest_session_id",
                table: "emotion_history",
                column: "guest_session_id");

            migrationBuilder.CreateIndex(
                name: "IX_emotion_history_user_id",
                table: "emotion_history",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_recommendations_category",
                table: "recommendations",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_recommendations_history_id",
                table: "recommendations",
                column: "history_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_username",
                table: "users",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "analysis_feedback");

            migrationBuilder.DropTable(
                name: "recommendations");

            migrationBuilder.DropTable(
                name: "emotion_history");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
