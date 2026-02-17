using Microsoft.AspNetCore.Components;

namespace Allet.Web.Services;

public static class CountryFlagHelper
{
    private static readonly Dictionary<string, string> CountryToCode = new(StringComparer.OrdinalIgnoreCase)
    {
        ["France"] = "FR",
        ["Canada"] = "CA",
        ["Belgium"] = "BE",
        ["United States"] = "US",
        ["United Kingdom"] = "GB",
        ["Germany"] = "DE",
        ["Austria"] = "AT",
        ["Switzerland"] = "CH",
        ["Netherlands"] = "NL",
        ["Spain"] = "ES",
        ["Italy"] = "IT",
        ["Hungary"] = "HU",
        ["Czech Republic"] = "CZ",
        ["Czechia"] = "CZ",
        ["Poland"] = "PL",
        ["Portugal"] = "PT",
        ["Sweden"] = "SE",
        ["Norway"] = "NO",
        ["Denmark"] = "DK",
        ["Finland"] = "FI",
        ["Ireland"] = "IE",
        ["Romania"] = "RO",
        ["Bulgaria"] = "BG",
        ["Croatia"] = "HR",
        ["Greece"] = "GR",
        ["Turkey"] = "TR",
        ["Japan"] = "JP",
        ["Australia"] = "AU",
        ["Brazil"] = "BR",
        ["Mexico"] = "MX",
        ["Argentina"] = "AR",
        ["Luxembourg"] = "LU",
        ["Monaco"] = "MC",
        ["Serbia"] = "RS",
        ["Slovakia"] = "SK",
        ["Slovenia"] = "SI",
        ["Lithuania"] = "LT",
        ["Latvia"] = "LV",
        ["Estonia"] = "EE",
    };

    /// <summary>
    /// Returns the ISO 3166-1 alpha-2 code for a country name, or null if not recognized.
    /// </summary>
    public static string? ToIsoCode(string? country)
    {
        if (string.IsNullOrWhiteSpace(country)) return null;
        var trimmed = country.Trim();
        // Already a 2-letter code?
        if (trimmed.Length == 2) return trimmed.ToUpperInvariant();
        return CountryToCode.TryGetValue(trimmed, out var code) ? code : null;
    }

    /// <summary>
    /// Returns the CSS class for a flag-icons flag (e.g. "France" → "fi fi-fr"),
    /// or null if the country is not recognized.
    /// </summary>
    public static string? ToFlagCss(string? country)
    {
        var code = ToIsoCode(country);
        return code is not null ? $"fi fi-{code.ToLowerInvariant()}" : null;
    }

    /// <summary>
    /// Returns a MarkupString rendering a flag icon, or empty if country is not recognized.
    /// </summary>
    public static MarkupString FlagIcon(string? country)
    {
        var css = ToFlagCss(country);
        if (css is null) return new MarkupString("");
        return new MarkupString($"<span class=\"{css}\" title=\"{country}\"></span>");
    }

    /// <summary>
    /// Strips trailing country name or code from a venue display name
    /// when the venue has been geolocated.
    /// </summary>
    public static string CleanVenueName(string name, string? country)
    {
        if (string.IsNullOrWhiteSpace(country)) return name;

        var code = ToIsoCode(country);
        // Try full country name and ISO code
        string[] suffixes = code is not null ? [country, code] : [country];

        foreach (var suffix in suffixes)
        {
            if (name.EndsWith(", " + suffix, StringComparison.OrdinalIgnoreCase))
            {
                return name[..^(", ".Length + suffix.Length)].TrimEnd();
            }
        }

        return name;
    }
}
