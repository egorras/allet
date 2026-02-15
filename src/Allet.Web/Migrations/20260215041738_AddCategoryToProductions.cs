using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Allet.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryToProductions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "category",
                table: "productions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tags",
                table: "productions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "tags",
                table: "productions");

            migrationBuilder.DropColumn(
                name: "category",
                table: "productions");
        }
    }
}
