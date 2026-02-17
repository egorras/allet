namespace Allet.Web.Models;

public class ActivityHistory
{
    public int Id { get; set; }
    public int ProductionId { get; set; }
    public string UserId { get; set; } = "default";
    public ProductionUserStatus PreviousStatus { get; set; }
    public ProductionUserStatus NewStatus { get; set; }
    public string? Note { get; set; }
    public DateOnly? WatchedDate { get; set; }
    public int? ShowId { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public Production Production { get; set; } = null!;
    public Show? Show { get; set; }
}
