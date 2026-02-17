using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Allet.Web.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceUserActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "show_id",
                table: "user_activities",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "watched_date",
                table: "user_activities",
                type: "date",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_activities_show_id",
                table: "user_activities",
                column: "show_id");

            migrationBuilder.AddForeignKey(
                name: "fk_user_activities_shows_show_id",
                table: "user_activities",
                column: "show_id",
                principalTable: "shows",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_user_activities_shows_show_id",
                table: "user_activities");

            migrationBuilder.DropIndex(
                name: "ix_user_activities_show_id",
                table: "user_activities");

            migrationBuilder.DropColumn(
                name: "show_id",
                table: "user_activities");

            migrationBuilder.DropColumn(
                name: "watched_date",
                table: "user_activities");
        }
    }
}
