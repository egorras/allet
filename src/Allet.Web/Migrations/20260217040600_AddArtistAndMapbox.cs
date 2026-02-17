using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Allet.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddArtistAndMapbox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_productions_source_slug_season",
                table: "productions");

            migrationBuilder.DropColumn(
                name: "season",
                table: "productions");

            migrationBuilder.AddColumn<int>(
                name: "artist_id",
                table: "productions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "artists",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    bio = table.Column<string>(type: "text", nullable: true),
                    website_url = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_artists", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_productions_artist_id",
                table: "productions",
                column: "artist_id");

            // Deduplicate productions: after dropping season, (source, slug) may have duplicates.
            // Reassign shows and user_activities to the kept production (min id per source, slug), then delete duplicates.
            migrationBuilder.Sql(@"
                UPDATE shows s
                SET production_id = k.kept_id
                FROM productions p
                JOIN (SELECT source, slug, MIN(id) AS kept_id FROM productions GROUP BY source, slug) k
                  ON p.source = k.source AND p.slug = k.slug AND p.id != k.kept_id
                WHERE s.production_id = p.id;
            ");
            migrationBuilder.Sql(@"
                UPDATE user_activities u
                SET production_id = k.kept_id
                FROM productions p
                JOIN (SELECT source, slug, MIN(id) AS kept_id FROM productions GROUP BY source, slug) k
                  ON p.source = k.source AND p.slug = k.slug AND p.id != k.kept_id
                WHERE u.production_id = p.id;
            ");
            migrationBuilder.Sql(@"
                DELETE FROM productions
                WHERE id IN (
                    SELECT p.id FROM productions p
                    JOIN (SELECT source, slug, MIN(id) AS kept_id FROM productions GROUP BY source, slug) k
                      ON p.source = k.source AND p.slug = k.slug
                    WHERE p.id != k.kept_id
                );
            ");

            migrationBuilder.CreateIndex(
                name: "ix_productions_source_slug",
                table: "productions",
                columns: new[] { "source", "slug" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_productions_artists_artist_id",
                table: "productions",
                column: "artist_id",
                principalTable: "artists",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_productions_artists_artist_id",
                table: "productions");

            migrationBuilder.DropTable(
                name: "artists");

            migrationBuilder.DropIndex(
                name: "ix_productions_artist_id",
                table: "productions");

            migrationBuilder.DropIndex(
                name: "ix_productions_source_slug",
                table: "productions");

            migrationBuilder.DropColumn(
                name: "artist_id",
                table: "productions");

            migrationBuilder.AddColumn<string>(
                name: "season",
                table: "productions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "ix_productions_source_slug_season",
                table: "productions",
                columns: new[] { "source", "slug", "season" },
                unique: true);
        }
    }
}
