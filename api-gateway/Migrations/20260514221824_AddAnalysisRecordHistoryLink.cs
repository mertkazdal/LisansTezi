using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalysisRecordHistoryLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "emotion_history_id",
                table: "analysis_records",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_analysis_records_emotion_history_id",
                table: "analysis_records",
                column: "emotion_history_id",
                unique: true,
                filter: "\"emotion_history_id\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_analysis_records_emotion_history_emotion_history_id",
                table: "analysis_records",
                column: "emotion_history_id",
                principalTable: "emotion_history",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_analysis_records_emotion_history_emotion_history_id",
                table: "analysis_records");

            migrationBuilder.DropIndex(
                name: "IX_analysis_records_emotion_history_id",
                table: "analysis_records");

            migrationBuilder.DropColumn(
                name: "emotion_history_id",
                table: "analysis_records");
        }
    }
}
