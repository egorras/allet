namespace Allet.Web.Models;

public class Venue
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Website { get; set; }

    public List<Show> Shows { get; set; } = [];
}
