using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Allet.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddUserActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_activities",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    production_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_activities", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_activities_productions_production_id",
                        column: x => x.production_id,
                        principalTable: "productions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_user_activities_production_id",
                table: "user_activities",
                column: "production_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_activities_user_id_production_id",
                table: "user_activities",
                columns: new[] { "user_id", "production_id" },
                unique: true);

            // Transfer existing data: ArchivedProductions -> UserActivities (Status=1)
            migrationBuilder.Sql("INSERT INTO user_activities (production_id, user_id, status, note, updated_at) SELECT production_id, user_id, 1, note, archived_at FROM archived_productions");

            migrationBuilder.DropTable(
                name: "archived_productions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_activities");

            migrationBuilder.CreateTable(
                name: "archived_productions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    production_id = table.Column<int>(type: "integer", nullable: false),
                    archived_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true),
                    reason = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_archived_productions", x => x.id);
                    table.ForeignKey(
                        name: "fk_archived_productions_productions_production_id",
                        column: x => x.production_id,
                        principalTable: "productions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_archived_productions_production_id",
                table: "archived_productions",
                column: "production_id");

            migrationBuilder.CreateIndex(
                name: "ix_archived_productions_user_id_production_id",
                table: "archived_productions",
                columns: new[] { "user_id", "production_id" },
                unique: true);
        }
    }
}
