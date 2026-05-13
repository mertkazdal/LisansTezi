using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    /// <inheritdoc />
    public partial class AddPreferredColorThemeToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "preferred_color_theme",
                table: "users",
                type: "character varying(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "kirmizi");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "preferred_color_theme",
                table: "users");
        }
    }
}
