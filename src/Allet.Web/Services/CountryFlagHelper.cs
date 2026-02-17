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
        return CountryToCode.TryGetValue(country.Trim(), out var code) ? code : null;
    }

    /// <summary>
    /// Converts a country name to a flag emoji (e.g. "France" → "🇫🇷").
    /// Returns null if the country is not recognized.
    /// </summary>
    public static string? ToFlagEmoji(string? country)
    {
        if (string.IsNullOrWhiteSpace(country)) return null;

        // If it's already a 2-letter code, use it directly
        var code = country.Trim();
        if (code.Length != 2 && !CountryToCode.TryGetValue(code, out code))
            return null;

        if (code is not { Length: 2 }) return null;
        code = code.ToUpperInvariant();

        // Convert each letter to regional indicator symbol (🇦 = U+1F1E6, A = U+0041)
        return string.Concat(
            char.ConvertFromUtf32(0x1F1E6 + (code[0] - 'A')),
            char.ConvertFromUtf32(0x1F1E6 + (code[1] - 'A'))
        );
    }
}
