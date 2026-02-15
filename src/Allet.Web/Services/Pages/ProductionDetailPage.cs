using System.Net;
using System.Text.RegularExpressions;

namespace Allet.Web.Services.Pages;

/// <summary>
/// Page object for an opera.hu production detail page.
/// URL pattern: /en/programme/SEASON/SLUG/
///
/// Structure:
///   <h1 class="project-cover-title">Title</h1>
///   <meta property="og:image" content="https://...image.jpg">
///   <h2>Synopsis</h2><div class="rich-text">...description...</div>
/// </summary>
public class ProductionDetailPage
{
    private static readonly Regex TitleRegex = new(
        @"<h1[^>]*class=""project-cover-title""[^>]*>(.*?)</h1>",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex OgImageRegex = new(
        @"og:image""\s+content=""([^""]+)""",
        RegexOptions.Compiled);

    private static readonly Regex SynopsisRegex = new(
        @"<h2[^>]*>Synopsis</h2>\s*<div[^>]*class=""rich-text""[^>]*>(.*?)</div>",
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

    public string? ImageUrl
    {
        get
        {
            var match = OgImageRegex.Match(_html);
            return match.Success ? match.Groups[1].Value.Trim() : null;
        }
    }

    public string? Synopsis
    {
        get
        {
            var match = SynopsisRegex.Match(_html);
            if (!match.Success)
                return null;

            var text = CleanText(match.Groups[1].Value);
            return text.Length > 2000 ? text[..2000] + "..." : text;
        }
    }

    private static string CleanText(string html)
    {
        var stripped = HtmlTagRegex.Replace(html, " ").Trim();
        return WebUtility.HtmlDecode(stripped);
    }
}
