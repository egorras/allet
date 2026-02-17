namespace Allet.Web.Services;

public interface IGeocodingService
{
    Task<GeocodingResult?> GeocodeAsync(string query, CancellationToken cancellationToken = default);
}

public record GeocodingResult(double Latitude, double Longitude, string? Country);
