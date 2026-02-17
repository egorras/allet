namespace Allet.Web.Models;

public enum ArchiveReason
{
    NotInterested = 0,
    Other = 1,
}

public class ArchivedProduction
{
    public int Id { get; set; }
    public int ProductionId { get; set; }
    public string UserId { get; set; } = "default";
    public ArchiveReason Reason { get; set; }
    public string? Note { get; set; }
    public DateTime ArchivedAt { get; set; } = DateTime.UtcNow;

    public Production Production { get; set; } = null!;
}
