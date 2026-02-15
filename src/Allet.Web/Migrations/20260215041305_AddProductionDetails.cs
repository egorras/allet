using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Allet.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "gallery_urls",
                table: "productions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guide",
                table: "productions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subtitle",
                table: "productions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "synopsis",
                table: "productions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "gallery_urls",
                table: "productions");

            migrationBuilder.DropColumn(
                name: "guide",
                table: "productions");

            migrationBuilder.DropColumn(
                name: "subtitle",
                table: "productions");

            migrationBuilder.DropColumn(
                name: "synopsis",
                table: "productions");
        }
    }
}
