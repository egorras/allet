using System.Text.Json;
using Allet.Web.Services.Pages;
using Microsoft.Extensions.Options;

namespace Allet.Web.Services;

public class OperaHuScraperOptions
{
    public int DelayMs { get; set; } = 500;
    public List<string> SeedUrls { get; set; } = [];
}

public class OperaHuScraper(
    HttpClient httpClient,
    IOptions<OperaHuScraperOptions> options,
    ILogger<OperaHuScraper> logger) : ScraperBase(httpClient, logger)
{
    private const string BaseUrl = "https://www.opera.hu";
    private const string AllDatesUrl = $"{BaseUrl}/en/ajax/event/alldates/";
    private readonly OperaHuScraperOptions _options = options.Value;

    public override string SourceName => "opera.hu";

    public override async Task<ScrapeResult> ScrapeAsync(CancellationToken cancellationToken = default)
    {
        var result = new ScrapeResult();

        try
        {
            var events = await ScrapeAllMonthsAsync(cancellationToken);
            logger.LogInformation("Discovered {Count} events across all months", events.Count);

            var grouped = events
                .GroupBy(e => e.Slug)
                .ToDictionary(g => g.Key, g => g.ToList());

            logger.LogInformation("Found {Count} unique productions", grouped.Count);

            foreach (var (slug, showEvents) in grouped)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    var production = await BuildProductionAsync(slug, showEvents, cancellationToken);
                    result.Productions.Add(production);
                }
                catch (Exception ex)
                {
                    result.Errors.Add($"Failed to process {slug}: {ex.Message}");
                    logger.LogWarning(ex, "Failed to process production {Slug}", slug);
                }
            }
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Scraper failed: {ex.Message}");
            logger.LogError(ex, "OperaHu scraper failed");
        }

        logger.LogInformation(
            "Scrape completed: {Productions} productions, {Shows} total shows, {Errors} errors",
            result.Productions.Count,
            result.Productions.Sum(p => p.Shows.Count),
            result.Errors.Count);

        return result;
    }

    private async Task<List<ProgrammeEvent>> ScrapeAllMonthsAsync(CancellationToken cancellationToken)
    {
        var months = await GetActiveMonthsAsync(cancellationToken);
        logger.LogInformation("AllDates API returned {Count} active months", months.Count);

        var allEvents = new List<ProgrammeEvent>();

        foreach (var (year, month) in months)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var url = $"{BaseUrl}/en/programme/?y={year}&m={month}&datum=&helyszin=&mufaj=";
            var html = await FetchPageAsync(url, cancellationToken);
            if (html is null)
                continue;

            var page = new ProgrammePage(html);
            var events = page.GetEvents();
            allEvents.AddRange(events);
            logger.LogInformation("Month {Year}-{Month:D2}: found {Count} events", year, month, events.Count);

            await Task.Delay(_options.DelayMs, cancellationToken);
        }

        // Deduplicate by URL (same event could appear on overlapping month boundaries)
        return allEvents
            .GroupBy(e => e.RelativeUrl)
            .Select(g => g.First())
            .ToList();
    }

    private async Task<IReadOnlyList<(int Year, int Month)>> GetActiveMonthsAsync(CancellationToken cancellationToken)
    {
        var json = await FetchPageAsync(AllDatesUrl, cancellationToken);
        if (json is null)
            return [];

        var response = JsonSerializer.Deserialize<AllDatesResponse>(json);
        if (response is null || response.Status != "OK")
            return [];

        return response.GetDistinctMonths();
    }

    private async Task<ScrapedProduction> BuildProductionAsync(
        string slug, List<ProgrammeEvent> events, CancellationToken cancellationToken)
    {
        var first = events[0];
        // Production URL usually contains season, but the slug is the unique identifier we want to group by.
        // We'll construct the URL from the first event's data.
        var productionUrl = $"{BaseUrl}/en/programme/{first.Season}/{slug}/"; // Keep using season from event for URL construction if needed

        var production = new ScrapedProduction
        {
            Title = first.Title,
            Slug = slug,
            SourceUrl = productionUrl
        };

        // Fetch detail page for description and image
        var html = await FetchPageAsync(productionUrl, cancellationToken);
        if (html is not null)
        {
            var detailPage = new ProductionDetailPage(html);
            production.Title = detailPage.Title ?? production.Title;
            production.Subtitle = detailPage.Subtitle;
            production.ImageUrl = detailPage.ImageUrl;
            production.Description = detailPage.Description;
            production.Synopsis = detailPage.Synopsis;
            production.Guide = detailPage.Guide;
            production.GalleryUrls = detailPage.GalleryUrls;
            production.RunningTimeMinutes = detailPage.RunningTimeMinutes;
            var tags = detailPage.Tags;
            if (tags.Count > 0)
                production.Tags = string.Join(", ", tags);
        }

        await Task.Delay(_options.DelayMs, cancellationToken);

        foreach (var evt in events)
        {
            production.Shows.Add(new ScrapedShow
            {
                Title = production.Title,
                Date = evt.Date,
                VenueName = evt.VenueName,
                Url = $"{BaseUrl}{evt.RelativeUrl}",
                IsRehearsal = evt.IsRehearsal
            });
        }

        return production;
    }
}
