using Allet.Web.Data;
using Allet.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Allet.Web.Services;

public class ScraperOrchestrator(
    IServiceScopeFactory scopeFactory,
    IEnumerable<IScraperService> scrapers,
    ILogger<ScraperOrchestrator> logger)
{
    public async Task RunAllScrapersAsync(CancellationToken cancellationToken = default)
    {
        foreach (var scraper in scrapers)
        {
            logger.LogInformation("Running scraper: {Source}", scraper.SourceName);

            try
            {
                var result = await scraper.ScrapeAsync(cancellationToken);
                await PersistResultsAsync(scraper.SourceName, result, cancellationToken);

                logger.LogInformation(
                    "Scraper {Source} completed: {New} new, {Updated} updated, {Errors} errors",
                    scraper.SourceName, result.NewCount, result.UpdatedCount, result.Errors.Count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Scraper {Source} failed", scraper.SourceName);
            }
        }
    }

    private async Task PersistResultsAsync(string source, ScrapeResult result, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AlletDbContext>();

        foreach (var scrapedProduction in result.Productions)
        {
            try
            {
                var production = await UpsertProductionAsync(db, source, scrapedProduction, cancellationToken);

                foreach (var scrapedShow in scrapedProduction.Shows)
                {
                    await UpsertShowAsync(db, production, scrapedShow, cancellationToken);
                }

                result.UpdatedCount++;
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Failed to persist {scrapedProduction.Slug}: {ex.Message}");
                logger.LogWarning(ex, "Failed to persist production {Slug}", scrapedProduction.Slug);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task<Production> UpsertProductionAsync(
        AlletDbContext db, string source, ScrapedProduction scraped, CancellationToken cancellationToken)
    {
        var existing = await db.Productions
            .FirstOrDefaultAsync(p =>
                p.Source == source &&
                p.Slug == scraped.Slug &&
                p.Season == scraped.Season,
                cancellationToken);

        if (existing is not null)
        {
            existing.Title = scraped.Title;
            existing.Description = scraped.Description ?? existing.Description;
            existing.ImageUrl = scraped.ImageUrl ?? existing.ImageUrl;
            existing.SourceUrl = scraped.SourceUrl ?? existing.SourceUrl;
            existing.UpdatedAt = DateTime.UtcNow;
            return existing;
        }

        var production = new Production
        {
            Title = scraped.Title,
            Slug = scraped.Slug,
            Season = scraped.Season,
            Source = source,
            Description = scraped.Description,
            ImageUrl = scraped.ImageUrl,
            SourceUrl = scraped.SourceUrl
        };
        db.Productions.Add(production);
        await db.SaveChangesAsync(cancellationToken);
        return production;
    }

    private static async Task UpsertShowAsync(
        AlletDbContext db, Production production, ScrapedShow scraped, CancellationToken cancellationToken)
    {
        var venue = await GetOrCreateVenueAsync(db, scraped.VenueName, cancellationToken);

        var existing = await db.Shows
            .FirstOrDefaultAsync(s =>
                s.ProductionId == production.Id &&
                s.VenueId == venue.Id &&
                s.Date == scraped.Date,
                cancellationToken);

        if (existing is not null)
        {
            existing.Title = scraped.Title;
            existing.Url = scraped.Url;
            return;
        }

        db.Shows.Add(new Show
        {
            Title = scraped.Title,
            ProductionId = production.Id,
            VenueId = venue.Id,
            Date = scraped.Date,
            Url = scraped.Url,
            Source = production.Source
        });
    }

    private static async Task<Venue> GetOrCreateVenueAsync(
        AlletDbContext db, string? venueName, CancellationToken cancellationToken)
    {
        var name = venueName ?? "Unknown";
        var venue = await db.Venues
            .FirstOrDefaultAsync(v => v.Name == name, cancellationToken);

        if (venue is not null)
            return venue;

        venue = new Venue { Name = name };
        db.Venues.Add(venue);
        await db.SaveChangesAsync(cancellationToken);
        return venue;
    }
}
