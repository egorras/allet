namespace Allet.Web.Models;

public class Production
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? SourceUrl { get; set; }
    public required string Slug { get; set; }
    public required string Season { get; set; }
    public required string Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Show> Shows { get; set; } = [];
}
