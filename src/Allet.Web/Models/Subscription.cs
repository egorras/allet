namespace Allet.Web.Models;

public class Subscription
{
    public int Id { get; set; }
    public int ShowId { get; set; }
    public Show? Show { get; set; }
    public SubscriptionType Type { get; set; }
    public string? TargetValue { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
