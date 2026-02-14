using Allet.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Allet.Web.Data;

public class AlletDbContext(DbContextOptions<AlletDbContext> options) : DbContext(options)
{
    public DbSet<Show> Shows => Set<Show>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Show>(entity =>
        {
            entity.HasOne(s => s.Venue)
                .WithMany(v => v.Shows)
                .HasForeignKey(s => s.VenueId);
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasOne(sub => sub.Show)
                .WithMany(s => s.Subscriptions)
                .HasForeignKey(sub => sub.ShowId);
        });
    }
}
