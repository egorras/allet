using System.Text.Json;

namespace Allet.Web.Services;

public class ZazTourScraper(HttpClient httpClient, ILogger<ZazTourScraper> logger)
    : ScraperBase(httpClient, logger)
{
    private const string TourUrl = "https://zaztour.com/en";
    private const string ArtistName = "Zaz";
    private const string ArtistSlug = "zaz";

    public override string SourceName => "zaztour.com";

    public override async Task<ScrapeResult> ScrapeAsync(CancellationToken cancellationToken = default)
    {
        var result = new ScrapeResult();

        try
        {
            var html = await FetchPageAsync(TourUrl, cancellationToken);
            if (string.IsNullOrWhiteSpace(html))
            {
                result.Errors.Add("Failed to fetch Zaz tour page");
                return result;
            }

            var production = new ScrapedProduction
            {
                Title = "Zaz - Tour",
                Slug = $"{ArtistSlug}-tour",
                SourceUrl = TourUrl,
                Description = "Zaz World Tour",
                ArtistName = ArtistName,
                ArtistSlug = ArtistSlug
            };

            var events = ExtractJsonLdEvents(html);

            foreach (var ev in events)
            {
                try
                {
                    var name = ev.GetProperty("name").GetString() ?? "Zaz";
                    var startDate = ev.GetProperty("startDate").GetString();

                    if (string.IsNullOrEmpty(startDate))
                        continue;

                    if (!DateTime.TryParse(startDate, out var date))
                        continue;

                    string? venueName = null;
                    string? city = null;
                    string? country = null;

                    if (ev.TryGetProperty("location", out var location))
                    {
                        if (location.TryGetProperty("name", out var locName))
                            venueName = GetStringValue(locName);

                        if (location.TryGetProperty("address", out var address))
                        {
                            if (address.TryGetProperty("addressLocality", out var locality))
                                city = GetStringValue(locality);
                            if (address.TryGetProperty("addressCountry", out var countryEl))
                                country = GetStringValue(countryEl);
                        }
                    }

                    var venueDisplay = string.Join(", ",
                        new[] { venueName, city, country }.Where(s => !string.IsNullOrWhiteSpace(s)));

                    string? ticketUrl = null;
                    if (ev.TryGetProperty("offers", out var offers))
                    {
                        if (offers.ValueKind == JsonValueKind.Array && offers.GetArrayLength() > 0)
                        {
                            var firstOffer = offers[0];
                            if (firstOffer.TryGetProperty("url", out var offerUrl))
                                ticketUrl = offerUrl.GetString();
                        }
                        else if (offers.ValueKind == JsonValueKind.Object)
                        {
                            if (offers.TryGetProperty("url", out var offerUrl))
                                ticketUrl = offerUrl.GetString();
                        }
                    }

                    production.Shows.Add(new ScrapedShow
                    {
                        Title = name,
                        Date = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                        VenueName = string.IsNullOrWhiteSpace(venueDisplay) ? "Unknown" : venueDisplay,
                        Url = ticketUrl,
                        IsRehearsal = false
                    });
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to parse a Zaz MusicEvent entry");
                }
            }

            if (production.Shows.Count > 0)
            {
                result.Productions.Add(production);
            }

            logger.LogInformation("Zaz scraper found {Count} shows", production.Shows.Count);
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Scraper failed: {ex.Message}");
            logger.LogError(ex, "Zaz scraper failed");
        }

        return result;
    }

    private static List<JsonElement> ExtractJsonLdEvents(string html)
    {
        var events = new List<JsonElement>();
        const string scriptOpen = "<script type=\"application/ld+json\">";
        const string scriptClose = "</script>";

        var searchFrom = 0;
        while (true)
        {
            var start = html.IndexOf(scriptOpen, searchFrom, StringComparison.OrdinalIgnoreCase);
            if (start < 0) break;

            start += scriptOpen.Length;
            var end = html.IndexOf(scriptClose, start, StringComparison.OrdinalIgnoreCase);
            if (end < 0) break;

            var json = html[start..end].Trim();
            searchFrom = end + scriptClose.Length;

            try
            {
                using var doc = JsonDocument.Parse(json);
                CollectMusicEvents(doc.RootElement, events);
            }
            catch
            {
                // Not valid JSON, skip
            }
        }

        return events;
    }

    private static string? GetStringValue(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String)
            return element.GetString();

        if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty("name", out var name))
            return name.GetString();

        return element.ToString();
    }

    private static void CollectMusicEvents(JsonElement element, List<JsonElement> events)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                CollectMusicEvents(item, events);
            }
        }
        else if (element.ValueKind == JsonValueKind.Object)
        {
            if (element.TryGetProperty("@type", out var typeEl))
            {
                var type = typeEl.GetString();
                if (string.Equals(type, "MusicEvent", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(type, "Event", StringComparison.OrdinalIgnoreCase))
                {
                    events.Add(element.Clone());
                    return;
                }
            }

            // Check @graph
            if (element.TryGetProperty("@graph", out var graph))
            {
                CollectMusicEvents(graph, events);
            }
        }
    }
}
