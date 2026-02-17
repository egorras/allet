using Allet.Web.Services;

namespace Allet.Web.Jobs;

public class ZazScraperJob(
    IEnumerable<IScraperService> scrapers,
    ScraperOrchestrator orchestrator)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var scraper = scrapers.First(s => s is ZazTourScraper);
        await orchestrator.RunScraperAsync(scraper, cancellationToken);
    }
}
