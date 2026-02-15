using System.Net;
using System.Text.RegularExpressions;

namespace Allet.Web.Services.Pages;

/// <summary>
/// Page object for an opera.hu production detail page.
/// URL pattern: /en/programme/SEASON/SLUG/
///
/// Sections (tab panels):
///   #in-brief  — page-description-wrap + tag-list
///   #synopsis  — rich-text with h3 act headings
///   #guide     — details--framed blocks
///   #media     — es-gallery images
///   Header     — h1 page-title, p page-subtitle, og:image
/// </summary>
public class ProductionDetailPage
{
    private static readonly Regex TitleRegex = new(
        @"<h1[^>]*>(.*?)</h1>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex SubtitleRegex = new(
        @"<p[^>]*class=""page-subtitle""[^>]*>(.*?)</p>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex OgImageRegex = new(
        @"og:image""\s+content=""([^""]+)""",
        RegexOptions.Compiled);

    // In-brief section: page-description inside page-description-wrap
    private static readonly Regex DescriptionRegex = new(
        @"<section[^>]*id=""in-brief""[^>]*>(.*?)</section>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex DescriptionTextRegex = new(
        @"<(?:p|div)[^>]*class=""page-description""[^>]*>(.*?)</(?:p|div)>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    // Synopsis section with rich-text content
    private static readonly Regex SynopsisSectionRegex = new(
        @"<section[^>]*id=""synopsis""[^>]*>(.*?)</section>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex RichTextRegex = new(
        @"<div[^>]*class=""rich-text""[^>]*>(.*?)</div>\s*</section>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    // Guide section with details blocks
    private static readonly Regex GuideSectionRegex = new(
        @"<section[^>]*id=""guide""[^>]*>(.*?)</section>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex DetailsContentRegex = new(
        @"<div[^>]*class=""details-content[^""]*""[^>]*>(.*?)</div>\s*</details>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    // Gallery images
    private static readonly Regex GalleryImageRegex = new(
        @"<a[^>]*data-es-gallery-image[^>]*href=""([^""]+)""",
        RegexOptions.Compiled);

    // Tags
    private static readonly Regex TagRegex = new(
        @"<span[^>]*class=""tag[^""]*""[^>]*>(.*?)</span>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex HtmlTagRegex = new(
        @"<[^>]+>", RegexOptions.Compiled);

    private readonly string _html;

    public ProductionDetailPage(string html)
    {
        _html = html;
    }

    public string? Title
    {
        get
        {
            var match = TitleRegex.Match(_html);
            return match.Success ? CleanText(match.Groups[1].Value) : null;
        }
    }

    public string? Subtitle
    {
        get
        {
            var match = SubtitleRegex.Match(_html);
            return match.Success ? CleanText(match.Groups[1].Value) : null;
        }
    }

    public string? ImageUrl
    {
        get
        {
            var match = OgImageRegex.Match(_html);
            return match.Success ? match.Groups[1].Value.Trim() : null;
        }
    }

    /// <summary>
    /// "In Brief" description from the in-brief tab panel.
    /// </summary>
    public string? Description
    {
        get
        {
            var sectionMatch = DescriptionRegex.Match(_html);
            if (!sectionMatch.Success) return null;

            var textMatch = DescriptionTextRegex.Match(sectionMatch.Groups[1].Value);
            if (!textMatch.Success) return null;

            var text = CleanText(textMatch.Groups[1].Value);
            return string.IsNullOrWhiteSpace(text) ? null : Truncate(text, 2000);
        }
    }

    /// <summary>
    /// Full synopsis with act structure, preserving h3 headings as markdown-style headers.
    /// </summary>
    public string? Synopsis
    {
        get
        {
            var sectionMatch = SynopsisSectionRegex.Match(_html);
            if (!sectionMatch.Success) return null;

            var richMatch = RichTextRegex.Match(sectionMatch.Groups[1].Value);
            var content = richMatch.Success ? richMatch.Groups[1].Value : sectionMatch.Groups[1].Value;

            // Convert h3 act headings to markdown-style before stripping HTML
            var text = Regex.Replace(content, @"<h3[^>]*>(.*?)</h3>", m => $"\n### {CleanText(m.Groups[1].Value)}\n",
                RegexOptions.Singleline);
            text = CleanText(text);
            return string.IsNullOrWhiteSpace(text) ? null : Truncate(text, 5000);
        }
    }

    /// <summary>
    /// Opera guide / programme notes from the guide tab panel.
    /// </summary>
    public string? Guide
    {
        get
        {
            var sectionMatch = GuideSectionRegex.Match(_html);
            if (!sectionMatch.Success) return null;

            var parts = new List<string>();
            foreach (Match m in DetailsContentRegex.Matches(sectionMatch.Groups[1].Value))
            {
                var text = CleanText(m.Groups[1].Value);
                if (!string.IsNullOrWhiteSpace(text))
                    parts.Add(text);
            }

            var combined = string.Join("\n\n", parts);
            return string.IsNullOrWhiteSpace(combined) ? null : Truncate(combined, 10000);
        }
    }

    /// <summary>
    /// Gallery image URLs from the media tab panel.
    /// </summary>
    public List<string> GalleryUrls
    {
        get
        {
            var urls = new List<string>();
            foreach (Match match in GalleryImageRegex.Matches(_html))
            {
                var url = match.Groups[1].Value.Trim();
                if (!string.IsNullOrWhiteSpace(url))
                    urls.Add(url);
            }
            return urls;
        }
    }

    /// <summary>
    /// Tags from &lt;span class="tag ..."&gt; elements.
    /// </summary>
    public List<string> Tags
    {
        get
        {
            var tags = new List<string>();
            foreach (Match match in TagRegex.Matches(_html))
            {
                var text = CleanText(match.Groups[1].Value);
                if (!string.IsNullOrWhiteSpace(text))
                    tags.Add(text);
            }
            return tags;
        }
    }

    private static string CleanText(string html)
    {
        var stripped = HtmlTagRegex.Replace(html, " ").Trim();
        stripped = Regex.Replace(stripped, @"\s+", " ");
        return WebUtility.HtmlDecode(stripped);
    }

    private static string Truncate(string text, int maxLength) =>
        text.Length > maxLength ? text[..maxLength] + "..." : text;
}
