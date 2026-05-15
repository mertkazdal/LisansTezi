using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    /// <inheritdoc />
    public partial class AddSavedRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "saved_recommendations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    analysis_record_id = table.Column<Guid>(type: "uuid", nullable: true),
                    item_type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    item_id = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    item_title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    item_data = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    saved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saved_recommendations", x => x.id);
                    table.CheckConstraint("CK_saved_recommendations_item_type", "\"item_type\" IN ('music', 'film', 'book')");
                    table.ForeignKey(
                        name: "FK_saved_recommendations_analysis_records_analysis_record_id",
                        column: x => x.analysis_record_id,
                        principalTable: "analysis_records",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_saved_recommendations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_saved_recommendations_analysis_record_id",
                table: "saved_recommendations",
                column: "analysis_record_id");

            migrationBuilder.CreateIndex(
                name: "IX_saved_recommendations_user_id_item_type",
                table: "saved_recommendations",
                columns: new[] { "user_id", "item_type" });

            migrationBuilder.CreateIndex(
                name: "IX_saved_recommendations_user_id_item_type_item_id",
                table: "saved_recommendations",
                columns: new[] { "user_id", "item_type", "item_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "saved_recommendations");
        }
    }
}
