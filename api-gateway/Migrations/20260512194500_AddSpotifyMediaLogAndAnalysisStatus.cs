using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MoodLens.ApiGateway.Data;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260512194500_AddSpotifyMediaLogAndAnalysisStatus")]
    public partial class AddSpotifyMediaLogAndAnalysisStatus : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "spotify_access_token",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "spotify_refresh_token",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "spotify_token_expiry",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "analysis_records",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "complete");

            migrationBuilder.AddCheckConstraint(
                name: "CK_analysis_records_status",
                table: "analysis_records",
                sql: "\"status\" IN ('complete', 'partial', 'failed')");

            migrationBuilder.CreateTable(
                name: "user_media_log",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    logged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_media_log", x => x.id);
                    table.CheckConstraint("CK_user_media_log_type", "\"type\" IN ('film', 'book')");
                    table.ForeignKey(
                        name: "FK_user_media_log_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_media_log_logged_at",
                table: "user_media_log",
                column: "logged_at");

            migrationBuilder.CreateIndex(
                name: "IX_user_media_log_user_id",
                table: "user_media_log",
                column: "user_id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "user_media_log");

            migrationBuilder.DropCheckConstraint(
                name: "CK_analysis_records_status",
                table: "analysis_records");

            migrationBuilder.DropColumn(
                name: "status",
                table: "analysis_records");

            migrationBuilder.DropColumn(
                name: "spotify_access_token",
                table: "users");

            migrationBuilder.DropColumn(
                name: "spotify_refresh_token",
                table: "users");

            migrationBuilder.DropColumn(
                name: "spotify_token_expiry",
                table: "users");
        }
    }
}
