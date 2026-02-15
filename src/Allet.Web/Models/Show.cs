namespace Allet.Web.Models;

public class Show
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public int? VenueId { get; set; }
    public Venue? Venue { get; set; }
    public DateTime? Date { get; set; }
    public string? Url { get; set; }
    public int? ProductionId { get; set; }
    public Production? Production { get; set; }
    public bool IsRehearsal { get; set; }
    public string? Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Subscription> Subscriptions { get; set; } = [];
}
