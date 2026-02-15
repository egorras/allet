using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;

namespace Allet.Web.Services.Pages;

/// <summary>
/// Page object for the opera.hu monthly programme page.
/// URL pattern: /en/programme/?y=YYYY&amp;m=M&amp;datum=&amp;helyszin=&amp;mufaj=
///
/// Structure:
///   <li id="nap_YYYYMMDD" class="day">        ← day container
///     <wt-event ...>                            ← event web component
///       <template>
///         <article>
///           <div class="post-time">11:00</div>
///           <h2 class="post-title">
///             <a href="/en/programme/SEASON/SLUG/VENUE-DATE-TIME/" class="post-title-link">Title</a>
///           </h2>
///           <span class="post-location-name">Venue Name</span>
///         </article>
///       </template>
///     </wt-event>
///   </li>
/// </summary>
public class ProgrammePage
{
    private static readonly Regex DayBlockRegex = new(
        @"<li\s+id=""nap_(\d{4})(\d{2})(\d{2})""[^>]*>(.*?)(?=<li\s+id=""nap_|</ul>)",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex EventBlockRegex = new(
        @"<wt-event[^>]*>(.*?)</wt-event>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex PostTimeRegex = new(
        @"<div[^>]*class=""post-time""[^>]*>\s*(?:<[^>]*>\s*)*(\d{1,2}:\d{2})",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex PostTitleLinkRegex = new(
        @"<a[^>]*href=""(/en/programme/([\w-]+)/([\w-]+)/[^""]*)""[^>]*class=""post-title-link""[^>]*>\s*(.*?)\s*</a>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex PostTitleLinkAltRegex = new(
        @"<a[^>]*class=""post-title-link""[^>]*href=""(/en/programme/([\w-]+)/([\w-]+)/[^""]*)""[^>]*>\s*(.*?)\s*</a>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex PostLocationRegex = new(
        @"<span[^>]*class=""post-location-name""[^>]*>(.*?)</span>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex HtmlTagRegex = new(
        @"<[^>]+>", RegexOptions.Compiled);

    private readonly string _html;

    public ProgrammePage(string html)
    {
        _html = html;
    }

    public List<ProgrammeEvent> GetEvents()
    {
        var events = new List<ProgrammeEvent>();

        foreach (Match dayMatch in DayBlockRegex.Matches(_html))
        {
            var year = int.Parse(dayMatch.Groups[1].Value);
            var month = int.Parse(dayMatch.Groups[2].Value);
            var day = int.Parse(dayMatch.Groups[3].Value);
            var dayHtml = dayMatch.Groups[4].Value;

            foreach (Match eventMatch in EventBlockRegex.Matches(dayHtml))
            {
                var parsed = ParseEvent(eventMatch.Groups[1].Value, year, month, day);
                if (parsed is not null)
                    events.Add(parsed);
            }
        }

        return events;
    }

    private static ProgrammeEvent? ParseEvent(string eventHtml, int year, int month, int day)
    {
        // Time
        var timeMatch = PostTimeRegex.Match(eventHtml);
        var hour = 0;
        var minute = 0;
        if (timeMatch.Success)
        {
            var parts = timeMatch.Groups[1].Value.Split(':');
            int.TryParse(parts[0], out hour);
            int.TryParse(parts[1], out minute);
        }

        // Title + link
        var titleMatch = PostTitleLinkRegex.Match(eventHtml);
        if (!titleMatch.Success)
            titleMatch = PostTitleLinkAltRegex.Match(eventHtml);
        if (!titleMatch.Success)
            return null;

        var relativeUrl = titleMatch.Groups[1].Value;
        var season = titleMatch.Groups[2].Value;
        var slug = titleMatch.Groups[3].Value;
        var title = CleanText(titleMatch.Groups[4].Value);

        if (string.IsNullOrWhiteSpace(title))
            title = CultureInfo.InvariantCulture.TextInfo.ToTitleCase(slug.Replace('-', ' '));

        // Venue
        var locationMatch = PostLocationRegex.Match(eventHtml);
        var venueName = locationMatch.Success
            ? WebUtility.HtmlDecode(locationMatch.Groups[1].Value.Trim())
            : "Hungarian State Opera";

        return new ProgrammeEvent
        {
            Season = season,
            Slug = slug,
            Title = title,
            VenueName = venueName,
            Date = new DateTime(year, month, day, hour, minute, 0, DateTimeKind.Utc),
            RelativeUrl = relativeUrl
        };
    }

    private static string CleanText(string html)
    {
        var stripped = HtmlTagRegex.Replace(html, " ").Trim();
        return WebUtility.HtmlDecode(stripped);
    }
}

public class ProgrammeEvent
{
    public required string Season { get; init; }
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string VenueName { get; init; }
    public DateTime Date { get; init; }
    public required string RelativeUrl { get; init; }
}
