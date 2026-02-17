using System.Text.Json;

namespace Allet.Web.Services;

public class MapboxGeocodingService(HttpClient httpClient, IConfiguration config, ILogger<MapboxGeocodingService> logger)
    : IGeocodingService
{
    public async Task<GeocodingResult?> GeocodeAsync(string query, CancellationToken cancellationToken = default)
    {
        var token = config["Mapbox:AccessToken"];
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(query))
            return null;

        var encoded = Uri.EscapeDataString(query.Trim());
        if (encoded.Length > 256)
            encoded = encoded[..256];

        try
        {
            var url = $"https://api.mapbox.com/geocoding/v5/mapbox.places/{encoded}.json?access_token={token}&limit=1";
            var response = await httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var features = root.GetProperty("features");
            if (features.GetArrayLength() == 0)
                return null;
            var feature = features[0];
            var coords = feature.GetProperty("geometry").GetProperty("coordinates");
            var lng = coords[0].GetDouble();
            var lat = coords[1].GetDouble();
            string? country = null;
            if (feature.TryGetProperty("context", out var context))
            {
                foreach (var c in context.EnumerateArray())
                {
                    if (c.TryGetProperty("id", out var id) && id.GetString()?.StartsWith("country.", StringComparison.Ordinal) == true)
                    {
                        if (c.TryGetProperty("text", out var text))
                            country = text.GetString();
                        break;
                    }
                }
            }
            return new GeocodingResult(lat, lng, country);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Geocoding failed for query: {Query}", query);
            return null;
        }
    }
}
