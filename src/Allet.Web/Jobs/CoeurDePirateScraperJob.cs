using Allet.Web.Services;

namespace Allet.Web.Jobs;

public class CoeurDePirateScraperJob(
    IEnumerable<IScraperService> scrapers,
    ScraperOrchestrator orchestrator)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var scraper = scrapers.First(s => s is CoeurDePirateScraper);
        await orchestrator.RunScraperAsync(scraper, cancellationToken);
    }
}
