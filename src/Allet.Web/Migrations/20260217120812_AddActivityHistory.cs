using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Allet.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "activity_histories",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    production_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<string>(type: "text", nullable: false),
                    previous_status = table.Column<int>(type: "integer", nullable: false),
                    new_status = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true),
                    watched_date = table.Column<DateOnly>(type: "date", nullable: true),
                    show_id = table.Column<int>(type: "integer", nullable: true),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_activity_histories", x => x.id);
                    table.ForeignKey(
                        name: "fk_activity_histories_productions_production_id",
                        column: x => x.production_id,
                        principalTable: "productions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_activity_histories_shows_show_id",
                        column: x => x.show_id,
                        principalTable: "shows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_activity_histories_changed_at",
                table: "activity_histories",
                column: "changed_at");

            migrationBuilder.CreateIndex(
                name: "ix_activity_histories_production_id",
                table: "activity_histories",
                column: "production_id");

            migrationBuilder.CreateIndex(
                name: "ix_activity_histories_show_id",
                table: "activity_histories",
                column: "show_id");

            migrationBuilder.CreateIndex(
                name: "ix_activity_histories_user_id_production_id_changed_at",
                table: "activity_histories",
                columns: new[] { "user_id", "production_id", "changed_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "activity_histories");
        }
    }
}
