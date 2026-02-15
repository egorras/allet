using System.Text.Json.Serialization;

namespace Allet.Web.Services.Pages;

/// <summary>
/// Response from the opera.hu /en/ajax/event/alldates/ endpoint.
/// Returns all dates that have at least one performance.
///
/// JSON: { "status": "OK", "data": { "eloadasok": ["2025-09-05", "2025-09-06", ...] } }
/// </summary>
public class AllDatesResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "";

    [JsonPropertyName("data")]
    public AllDatesData Data { get; set; } = new();

    public IReadOnlyList<(int Year, int Month)> GetDistinctMonths()
    {
        return Data.Eloadasok
            .Select(d => DateOnly.TryParse(d, out var date) ? date : (DateOnly?)null)
            .Where(d => d.HasValue)
            .Select(d => (d!.Value.Year, d.Value.Month))
            .Distinct()
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToList();
    }
}

public class AllDatesData
{
    [JsonPropertyName("eloadasok")]
    public List<string> Eloadasok { get; set; } = [];
}
