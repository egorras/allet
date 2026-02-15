namespace Allet.Web.Services;

public abstract class ScraperBase(HttpClient httpClient, ILogger logger) : IScraperService
{
    public abstract string SourceName { get; }

    public abstract Task<ScrapeResult> ScrapeAsync(CancellationToken cancellationToken = default);

    protected async Task<string?> FetchPageAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Fetching {Url}", url);
            var response = await httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to fetch {Url}", url);
            return null;
        }
    }
}
