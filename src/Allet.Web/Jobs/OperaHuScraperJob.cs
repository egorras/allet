using Allet.Web.Services;

namespace Allet.Web.Jobs;

public class OperaHuScraperJob(
    IEnumerable<IScraperService> scrapers,
    ScraperOrchestrator orchestrator)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var scraper = scrapers.First(s => s is OperaHuScraper);
        await orchestrator.RunScraperAsync(scraper, cancellationToken);
    }
}
