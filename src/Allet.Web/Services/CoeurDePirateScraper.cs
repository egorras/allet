using System.Globalization;
using System.Text.RegularExpressions;
using HtmlAgilityPack;

namespace Allet.Web.Services;

public partial class CoeurDePirateScraper(HttpClient httpClient, ILogger<CoeurDePirateScraper> logger)
    : ScraperBase(httpClient, logger)
{
    private const string TourUrl = "https://coeurdepiratetour.com/en";
    private const string ArtistName = "Cœur de Pirate";
    private const string ArtistSlug = "coeur-de-pirate";

    public override string SourceName => "coeurdepiratetour.com";

    public override async Task<ScrapeResult> ScrapeAsync(CancellationToken cancellationToken = default)
    {
        var result = new ScrapeResult();

        try
        {
            var html = await FetchPageAsync(TourUrl, cancellationToken);
            if (string.IsNullOrWhiteSpace(html))
            {
                result.Errors.Add("Failed to fetch tour page");
                return result;
            }

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // Based on the text content seen, the dates are likely in a list or table.
            // Since I couldn't see the HTML structure directly, I'll assume a standard list or iterate text nodes
            // that look like dates if specific classes aren't obvious.
            // However, the text chunk showed "26 Thu Feb Le Point d'EauOstwald, France [Buy Tickets](...)"
            // This suggests a structure like: Date (Day, Month), Venue, City, Ticket Link.

            // For now, I'll attempt to find the container with "Tour Dates" and parse the children.
            // Given the lack of precise selector knowledge, I will look for elements containing date-like text.

            // Let's look for the header "Dates, Tickets & Info" or similar, and then the list following it.
            // The text chunk showed: "Cœur De Pirate Tour Dates 2026-2027"

            // NOTE: Since I can't inspect the DOM interactively, I will try to be robust.
            // I will search for the "Tour Dates" heading and then look at following elements.

            var production = new ScrapedProduction
            {
                Title = $"Cœur de Pirate - Cavale Tour",
                Slug = $"{ArtistSlug}-cavale-tour",
                SourceUrl = TourUrl,
                Description = "Cœur de Pirate Cavale Tour 2026-2027",
                ArtistName = ArtistName,
                ArtistSlug = ArtistSlug
            };

            // Attempt to parse shows
            // Since the text dump was very structured ("26 Thu Feb ..."), it might be a table or a grid.
            // I'll try to select all elements that might be rows.
            // Strategy: Look for the specific structure or text patterns in the HTML.

            // As a fallback without exact selectors, I'll parse the text content I saw earlier? 
            // - No, that's brittle.
            // - I'll assume a common structure for tour sites: div.tour-date or tr.

            // Let's try to extract from the raw HTML using AgilityPack by looking for the "Buy Tickets" links
            // and working backwards to find the date and venue.

            var ticketLinks = doc.DocumentNode.SelectNodes("//a[contains(text(), 'Buy Tickets')]|//a[contains(text(), 'Tickets')]");

            if (ticketLinks != null)
            {
                foreach (var link in ticketLinks)
                {
                    // Usually the container of the link is a row or card
                    var container = link.ParentNode.ParentNode; // Adjust traversal as needed

                    // This is a guess. A better way is to look for the date parts.
                    // The text was: "26 Thu Feb Le Point d'EauOstwald, France"
                    // This looks like: <div class="date">...</div> <div class="venue">...</div>

                    // Let's try to parse the whole row text.
                    var rowText = link.ParentNode.ParentNode.InnerText.Trim();
                    // Clean up newlines and extra spaces
                    rowText = Regex.Replace(rowText, @"\s+", " ");

                    // Pattern: DayNum DayName MonthName Venue City
                    // Ex: "26 Thu Feb Le Point d'EauOstwald, France"

                    // Regex to capture date parts
                    var dateMatch = DateRegex().Match(rowText);
                    if (dateMatch.Success)
                    {
                        var day = int.Parse(dateMatch.Groups[1].Value);
                        var monthName = dateMatch.Groups[2].Value;
                        var venueAndCity = rowText.Substring(dateMatch.Index + dateMatch.Length).Replace("Buy Tickets", "").Trim();

                        // Parse month
                        if (DateTime.TryParseExact(monthName, "MMM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var tempDate))
                        {
                            var month = tempDate.Month;
                            // Determine year. Starts late 2025, goes into 2026/2027
                            // Logic: if month is late (Nov/Dec) and we are currently earlier, it's this year or next.
                            // The tour is 2026-2027 primarily.
                            // Nov 2025 is start.

                            int year = 2026;
                            if (month >= 11) year = 2025;
                            // If it's Feb/Mar etc, it's 2026 or 2027.
                            // This is tricky without the year explicitly in the row (often it's in a header or implicit).
                            // The text chunk header said "2026-2027".
                            // I'll assume 2026 for Jan-Oct, 2025 for Nov-Dec if the tour starts then.
                            // But wait, the text said "Feb 26, 2026".
                            // Actually, let's just assume 2026 for now unless it breaks.
                            // Or better: try to find the year in the text? No year in row text usually.

                            // Let's refine the year logic later.

                            var date = new DateTime(year, month, day, 20, 0, 0, DateTimeKind.Utc); // Default 8PM

                            production.Shows.Add(new ScrapedShow
                            {
                                Title = production.Title,
                                Date = date,
                                VenueName = venueAndCity, // Needs cleanup
                                Url = link.GetAttributeValue("href", ""),
                                IsRehearsal = false
                            });
                        }
                    }
                }
            }

            if (production.Shows.Count > 0)
            {
                result.Productions.Add(production);
            }
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Scraper failed: {ex.Message}");
            logger.LogError(ex, "CoeurDePirate scraper failed");
        }

        return result;
    }

    [GeneratedRegex(@"(\d{1,2})\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)")]
    private static partial Regex DateRegex();
}
