namespace Allet.Web.Services;

public interface IScraperService
{
    string SourceName { get; }
    Task<ScrapeResult> ScrapeAsync(CancellationToken cancellationToken = default);
}

public class ScrapeResult
{
    public List<ScrapedProduction> Productions { get; set; } = [];
    public int NewCount { get; set; }
    public int UpdatedCount { get; set; }
    public List<string> Errors { get; set; } = [];
}

public class ScrapedProduction
{
    public required string Title { get; set; }
    public required string Slug { get; set; }
    public required string Season { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? SourceUrl { get; set; }
    public List<ScrapedShow> Shows { get; set; } = [];
}

public class ScrapedShow
{
    public required string Title { get; set; }
    public DateTime Date { get; set; }
    public string? VenueName { get; set; }
    public string? Url { get; set; }
}
