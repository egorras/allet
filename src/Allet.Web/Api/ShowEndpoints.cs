using Allet.Web.Data;
using Microsoft.EntityFrameworkCore;

namespace Allet.Web.Api;

public static class ShowEndpoints
{
    public static RouteGroupBuilder MapShowEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/shows", async (
            AlletDbContext db,
            int? year,
            int? month,
            int? productionId,
            string? tags) =>
        {
            var now = DateTime.UtcNow;
            var y = year ?? now.Year;
            var m = month ?? now.Month;

            var startOfMonth = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1);

            // Extend to cover the full calendar grid (Mon-Sun weeks)
            var gridStart = startOfMonth.AddDays(-(((int)startOfMonth.DayOfWeek + 6) % 7));
            var gridEnd = endOfMonth.AddDays((7 - ((int)endOfMonth.DayOfWeek + 6) % 7) % 7);

            var query = db.Shows
                .AsNoTracking()
                .Include(s => s.Venue)
                .Include(s => s.Production)
                .Where(s => s.Date >= gridStart && s.Date < gridEnd);

            if (productionId.HasValue)
                query = query.Where(s => s.ProductionId == productionId.Value);

            if (!string.IsNullOrEmpty(tags))
            {
                var tagList = tags.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
                query = query.Where(s => s.Production != null && s.Production.Tags != null &&
                    tagList.Any(t => s.Production.Tags.Contains(t)));
            }

            var shows = await query
                .OrderBy(s => s.Date)
                .Select(s => new ShowDto(
                    s.Id,
                    s.Title,
                    s.Date,
                    s.Venue != null ? s.Venue.Name : null,
                    s.Url,
                    s.IsRehearsal,
                    s.ProductionId,
                    s.Production != null ? s.Production.Title : null
                ))
                .ToListAsync();

            return Results.Ok(shows);
        });

        group.MapGet("/shows/tags", async (AlletDbContext db) =>
        {
            var rawTags = await db.Productions
                .Where(p => p.Tags != null && p.Tags != "")
                .Select(p => p.Tags!)
                .ToListAsync();

            var tags = rawTags
                .SelectMany(t => t.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
                .Distinct()
                .OrderBy(t => t)
                .ToArray();

            return Results.Ok(tags);
        });

        return group;
    }
}
