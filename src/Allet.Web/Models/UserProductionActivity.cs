using Allet.Web.Models;

namespace Allet.Web.Models;

public enum ProductionUserStatus
{
    None = 0,
    Archived = 1,
    Watched = 2,
    Planned = 3
}

public class UserProductionActivity
{
    public int Id { get; set; }
    public int ProductionId { get; set; }
    public string UserId { get; set; } = "default";
    public ProductionUserStatus Status { get; set; }
    public string? Note { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateOnly? WatchedDate { get; set; }
    public int? ShowId { get; set; }

    public Production Production { get; set; } = null!;
    public Show? Show { get; set; }
}
