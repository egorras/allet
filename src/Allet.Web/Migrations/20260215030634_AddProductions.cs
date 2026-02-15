using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Allet.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddProductions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "production_id",
                table: "shows",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "productions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    source_url = table.Column<string>(type: "text", nullable: true),
                    slug = table.Column<string>(type: "text", nullable: false),
                    season = table.Column<string>(type: "text", nullable: false),
                    source = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_productions", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_shows_production_id_venue_id_date",
                table: "shows",
                columns: new[] { "production_id", "venue_id", "date" },
                unique: true,
                filter: "production_id IS NOT NULL AND venue_id IS NOT NULL AND date IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_productions_source_slug_season",
                table: "productions",
                columns: new[] { "source", "slug", "season" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_shows_productions_production_id",
                table: "shows",
                column: "production_id",
                principalTable: "productions",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_shows_productions_production_id",
                table: "shows");

            migrationBuilder.DropTable(
                name: "productions");

            migrationBuilder.DropIndex(
                name: "ix_shows_production_id_venue_id_date",
                table: "shows");

            migrationBuilder.DropColumn(
                name: "production_id",
                table: "shows");
        }
    }
}
