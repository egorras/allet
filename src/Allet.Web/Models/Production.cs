namespace Allet.Web.Models;

public class Production
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Description { get; set; }
    public string? Synopsis { get; set; }
    public string? Guide { get; set; }
    public string? ImageUrl { get; set; }
    public string? GalleryUrls { get; set; }
    public string? SourceUrl { get; set; }
    public required string Slug { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public int? RunningTimeMinutes { get; set; }
    public required string Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Show> Shows { get; set; } = [];
    public List<UserProductionActivity> UserActivities { get; set; } = [];
}
