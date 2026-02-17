using Allet.Web.Data;
using Microsoft.EntityFrameworkCore;

namespace Allet.Web.Api;

public static class ProductionEndpoints
{
    public static RouteGroupBuilder MapProductionEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/productions", async (
            AlletDbContext db,
            string? search,
            string? season,
            string? category,
            string? sort) =>
        {
            var query = db.Productions.AsNoTracking().Include(p => p.Shows).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p => p.Title.ToLower().Contains(search.ToLower()));
            if (!string.IsNullOrEmpty(season))
                query = query.Where(p => p.Season == season);
            if (!string.IsNullOrEmpty(category))
                query = query.Where(p => p.Category == category);

            query = sort switch
            {
                "title-desc" => query.OrderByDescending(p => p.Title),
                "newest" => query.OrderByDescending(p => p.CreatedAt),
                "season" => query.OrderByDescending(p => p.Season).ThenBy(p => p.Title),
                _ => query.OrderBy(p => p.Title),
            };

            var results = await query.Select(p => new ProductionListItemDto(
                p.Id,
                p.Title,
                p.Subtitle,
                p.ImageUrl,
                p.Season,
                p.Category,
                p.Tags != null
                    ? p.Tags.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                    : Array.Empty<string>(),
                p.Shows.Count,
                p.RunningTimeMinutes
            )).ToListAsync();

            return Results.Ok(results);
        });

        group.MapGet("/productions/filters", async (AlletDbContext db) =>
        {
            var seasons = await db.Productions
                .Select(p => p.Season)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();

            var categories = await db.Productions
                .Where(p => p.Category != null)
                .Select(p => p.Category!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Results.Ok(new FiltersDto(seasons.ToArray(), categories.ToArray()));
        });

        group.MapGet("/productions/{id:int}", async (int id, AlletDbContext db) =>
        {
            var p = await db.Productions
                .AsNoTracking()
                .Include(p => p.Shows)
                    .ThenInclude(s => s.Venue)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (p is null)
                return Results.NotFound();

            var galleryUrls = !string.IsNullOrEmpty(p.GalleryUrls)
                ? p.GalleryUrls.Split('|', StringSplitOptions.RemoveEmptyEntries)
                : Array.Empty<string>();

            var tags = !string.IsNullOrEmpty(p.Tags)
                ? p.Tags.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                : Array.Empty<string>();

            var shows = p.Shows
                .OrderBy(s => s.Date)
                .Select(s => new ShowDto(
                    s.Id, s.Title, s.Date, s.Venue?.Name, s.Url,
                    s.IsRehearsal, s.ProductionId, p.Title
                )).ToArray();

            return Results.Ok(new ProductionDetailDto(
                p.Id, p.Title, p.Subtitle, p.Description, p.Synopsis, p.Guide,
                p.ImageUrl, galleryUrls, p.SourceUrl, p.Season, p.Category,
                tags, p.RunningTimeMinutes, p.Source, p.CreatedAt, shows
            ));
        });

        return group;
    }
}
