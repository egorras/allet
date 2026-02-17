using Allet.Web.Services;

namespace Allet.Web.Jobs;

public class WienerStaatsoperScraperJob(
    IEnumerable<IScraperService> scrapers,
    ScraperOrchestrator orchestrator)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var scraper = scrapers.First(s => s is WienerStaatsoperScraper);
        await orchestrator.RunScraperAsync(scraper, cancellationToken);
    }
}
