using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarFieldsToPersonalityProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "avatar_url",
                table: "user_personality_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "avatar_generated_at",
                table: "user_personality_profiles",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "avatar_generated_at",
                table: "user_personality_profiles");

            migrationBuilder.DropColumn(
                name: "avatar_url",
                table: "user_personality_profiles");
        }
    }
}
