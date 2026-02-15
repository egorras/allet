using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Allet.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddRunningTimeAndRehearsal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_rehearsal",
                table: "shows",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "running_time_minutes",
                table: "productions",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_rehearsal",
                table: "shows");

            migrationBuilder.DropColumn(
                name: "running_time_minutes",
                table: "productions");
        }
    }
}
