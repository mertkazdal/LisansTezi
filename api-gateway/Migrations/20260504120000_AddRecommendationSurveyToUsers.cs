using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MoodLens.ApiGateway.Data;

#nullable disable

namespace MoodLens.ApiGateway.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260504120000_AddRecommendationSurveyToUsers")]
    public partial class AddRecommendationSurveyToUsers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "energy_preference",
                table: "users",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "favorite_book_genres",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "favorite_movie_genres",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "favorite_music_genres",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "recommendation_goal",
                table: "users",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "energy_preference",
                table: "users");

            migrationBuilder.DropColumn(
                name: "favorite_book_genres",
                table: "users");

            migrationBuilder.DropColumn(
                name: "favorite_movie_genres",
                table: "users");

            migrationBuilder.DropColumn(
                name: "favorite_music_genres",
                table: "users");

            migrationBuilder.DropColumn(
                name: "recommendation_goal",
                table: "users");
        }
    }
}
