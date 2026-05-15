using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    /// <inheritdoc />
    public partial class AddShareTokenExpiry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "share_token_expires_at",
                table: "analysis_records",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_analysis_records_share_token_expires_at",
                table: "analysis_records",
                column: "share_token_expires_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_analysis_records_share_token_expires_at",
                table: "analysis_records");

            migrationBuilder.DropColumn(
                name: "share_token_expires_at",
                table: "analysis_records");
        }
    }
}
