using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MoodLens.ApiGateway.Data;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260512193000_AddPersonalityAndAnalysisRecords")]
    public partial class AddPersonalityAndAnalysisRecords : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "analysis_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    session_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    input_type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    emotion_result = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    emotion_confidence = table.Column<double>(type: "double precision", nullable: false),
                    image_emotion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    image_confidence = table.Column<double>(type: "double precision", nullable: true),
                    text_emotion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    text_confidence = table.Column<double>(type: "double precision", nullable: true),
                    conflict_detected = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    personality_snapshot = table.Column<string>(type: "jsonb", nullable: true),
                    recommendations_json = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    language = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "tr"),
                    share_token = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_analysis_records", x => x.id);
                    table.CheckConstraint("CK_analysis_records_emotion_result", "\"emotion_result\" IN ('happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'tired', 'stressed', 'nostalgic', 'motivated', 'hopeful', 'overwhelmed')");
                    table.CheckConstraint("CK_analysis_records_input_type", "\"input_type\" IN ('image', 'text', 'both')");
                    table.ForeignKey(
                        name: "FK_analysis_records_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "personality_update_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    trigger_source = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_personality_update_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_personality_update_logs_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_personality_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    big_five_json = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    mbti_type = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    raw_survey_answers = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    spotify_top_tracks_json = table.Column<string>(type: "jsonb", nullable: true),
                    last_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_personality_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_personality_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_analysis_records_created_at",
                table: "analysis_records",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_analysis_records_session_id",
                table: "analysis_records",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "IX_analysis_records_share_token",
                table: "analysis_records",
                column: "share_token",
                unique: true,
                filter: "\"share_token\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_analysis_records_user_id",
                table: "analysis_records",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_personality_update_logs_updated_at",
                table: "personality_update_logs",
                column: "updated_at");

            migrationBuilder.CreateIndex(
                name: "IX_personality_update_logs_user_id",
                table: "personality_update_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_personality_profiles_user_id",
                table: "user_personality_profiles",
                column: "user_id",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "analysis_records");
            migrationBuilder.DropTable(name: "personality_update_logs");
            migrationBuilder.DropTable(name: "user_personality_profiles");
        }
    }
}
