using Allet.Web.Models;

namespace Allet.Web.Services;

public interface IScraperService
{
    Task<IReadOnlyList<Show>> ScrapeShowsAsync(CancellationToken cancellationToken = default);
}
