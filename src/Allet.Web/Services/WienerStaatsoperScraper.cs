using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;

namespace Allet.Web.Services;

public class WienerStaatsoperScraperOptions
{
    public int DelayMs { get; set; } = 500;
}

public class WienerStaatsoperScraper(
    HttpClient httpClient,
    IOptions<WienerStaatsoperScraperOptions> options,
    ILogger<WienerStaatsoperScraper> logger) : ScraperBase(httpClient, logger)
{
    private const string BaseUrl = "https://www.wiener-staatsoper.at";
    private readonly WienerStaatsoperScraperOptions _options = options.Value;

    public override string SourceName => "wiener-staatsoper";

    public override async Task<ScrapeResult> ScrapeAsync(CancellationToken cancellationToken = default)
    {
        var result = new ScrapeResult();
        var allEventUrls = new HashSet<string>();

        try
        {
            // Scrape next 12 months
            var currentMonth = DateTime.UtcNow;
            for (var i = 0; i < 12; i++)
            {
                var monthDate = currentMonth.AddMonths(i);
                var monthUrl = $"{BaseUrl}/en/calendar/{monthDate.Year}/{monthDate.ToString("MMMM", CultureInfo.InvariantCulture).ToLower()}/";

                logger.LogInformation("Scraping calendar: {Url}", monthUrl);
                var html = await FetchPageAsync(monthUrl, cancellationToken);
                if (html != null)
                {
                    var urls = ExtractEventUrls(html);
                    foreach (var url in urls)
                    {
                        allEventUrls.Add(url);
                    }
                    logger.LogInformation("Found {Count} events in {Month}", urls.Count, monthDate.ToString("MMMM yyyy"));
                }

                await Task.Delay(_options.DelayMs, cancellationToken);
            }

            // Group by slug
            // URL format: /en/calendar/detail/{slug}/{date}/
            var grouped = allEventUrls
                .Select(u => new { Url = u, Slug = ExtractSlug(u) })
                .Where(x => !string.IsNullOrEmpty(x.Slug))
                .GroupBy(x => x.Slug)
                .ToDictionary(g => g.Key, g => g.Select(x => x.Url).ToList());

            logger.LogInformation("Found {Count} unique productions", grouped.Count);

            foreach (var (slug, urls) in grouped)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    var production = await BuildProductionAsync(slug, urls, cancellationToken);
                    if (production != null)
                    {
                        result.Productions.Add(production);
                    }
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
            logger.LogError(ex, "WienerStaatsoper scraper failed");
        }

        return result;
    }

    private List<string> ExtractEventUrls(string html)
    {
        var list = new List<string>();
        // Look for links to matches like /en/calendar/detail/slug/date/
        var regex = new Regex(@"href=""(/en/calendar/detail/[^""]+)""", RegexOptions.IgnoreCase);
        foreach (Match match in regex.Matches(html))
        {
            var url = match.Groups[1].Value;
            if (!url.StartsWith("http"))
            {
                url = BaseUrl + url;
            }
            list.Add(url);
        }
        return list.Distinct().ToList();
    }

    private string? ExtractSlug(string url)
    {
        // .../detail/slug/date/
        var match = Regex.Match(url, @"/detail/([^/]+)/");
        return match.Success ? match.Groups[1].Value : null;
    }

    private async Task<ScrapedProduction?> BuildProductionAsync(string slug, List<string> eventUrls, CancellationToken cancellationToken)
    {
        if (eventUrls.Count == 0) return null;

        // Fetch the first event to get production details
        // We might need to fetch others if we want exact times for all, 
        // but let's assume valid metadata is on the first one.
        // Actually, we need to fetch ALL to get the times for each show.

        ScrapedProduction? production = null;

        foreach (var url in eventUrls)
        {
            var html = await FetchPageAsync(url, cancellationToken);
            if (html == null) continue;

            if (production == null)
            {
                production = ParseProductionDetails(html, slug, url);
            }

            var show = ParseShow(html, url, production?.Title ?? slug);
            if (show != null && production != null)
            {
                production.Shows.Add(show);
            }

            await Task.Delay(_options.DelayMs, cancellationToken);
        }

        return production;
    }

    private ScrapedProduction ParseProductionDetails(string html, string slug, string sourceUrl)
    {
        // Extract Title
        var titleMatch = Regex.Match(html, @"<h1[^>]*>(.*?)</h1>", RegexOptions.Singleline);
        var title = titleMatch.Success ? WebUtility.HtmlDecode(titleMatch.Groups[1].Value).Trim() : slug;

        // Remove tags from title if any
        title = Regex.Replace(title, @"<[^>]+>", "").Trim();

        // Extract Description/Synopsis
        // This is harder with Regex on full page, but let's try to find a block.
        // Based on chunks, there is "Short Summary".
        // Let's look for meta description or og:description for a simple description.
        var descMatch = Regex.Match(html, @"<meta\s+property=""og:description""\s+content=""([^""]*)""", RegexOptions.IgnoreCase);
        var description = descMatch.Success ? WebUtility.HtmlDecode(descMatch.Groups[1].Value) : null;

        // Extract Image
        var imgMatch = Regex.Match(html, @"<meta\s+property=""og:image""\s+content=""([^""]*)""", RegexOptions.IgnoreCase);
        var imageUrl = imgMatch.Success ? imgMatch.Groups[1].Value : null;

        return new ScrapedProduction
        {
            Title = title,
            Slug = slug,
            SourceUrl = sourceUrl,
            Description = description,
            ImageUrl = imageUrl,
            Shows = []
        };
    }

    private ScrapedShow? ParseShow(string html, string url, string title)
    {
        // Need to extract Date and Time.
        // URL has date: .../2026-02-01/
        var dateMatch = Regex.Match(url, @"/(\d{4}-\d{2}-\d{2})/?$");
        if (!dateMatch.Success) return null;

        if (!DateTime.TryParse(dateMatch.Groups[1].Value, out var date))
            return null;

        // Extract Time from HTML
        // Often in a structure like <span class="time">19:00</span> or similar.
        // I'll guess a regex for now, maybe refined later.
        // Looking for HH:MM pattern near "Beginn" or just standalone time.
        // Let's look for the first HH:MM that is not duration.
        var timeMatch = Regex.Match(html, @"(\d{1,2}:\d{2})\s*(?:Uhr|h|–)");
        // This is risky.

        // Alternative: Look for specific structured data or meta tags?
        // ld+json often has it.
        var jsonLdMatch = Regex.Match(html, @"<script type=""application/ld\+json"">([\s\S]*?)</script>");
        if (jsonLdMatch.Success)
        {
            var json = jsonLdMatch.Groups[1].Value;
            // distinct startDate
            var startDateMatch = Regex.Match(json, @"""startDate""\s*:\s*""([^""]+)""");
            if (startDateMatch.Success && DateTime.TryParse(startDateMatch.Groups[1].Value, out var jsonDate))
            {
                return new ScrapedShow
                {
                    Title = title,
                    Date = jsonDate.ToUniversalTime(),
                    Url = url,
                    VenueName = "Wiener Staatsoper"
                };
            }
        }

        // Fallback: Default to noon if time not found, or try to parse text?
        // Let's loop 19:00 as default for evening opera if unsure? No, better to be safe.
        // I'll leave time as 00:00 if not found, preserving the date.

        return new ScrapedShow
        {
            Title = title,
            Date = DateTime.SpecifyKind(date, DateTimeKind.Utc), // Should ideally be combined with time
            Url = url,
            VenueName = "Wiener Staatsoper"
        };
    }
}
