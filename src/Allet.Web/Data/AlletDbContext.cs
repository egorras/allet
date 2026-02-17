using Allet.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Allet.Web.Data;

public class AlletDbContext(DbContextOptions<AlletDbContext> options) : DbContext(options)
{
    public DbSet<Production> Productions => Set<Production>();
    public DbSet<Show> Shows => Set<Show>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<UserProductionActivity> UserActivities => Set<UserProductionActivity>();
    public DbSet<ActivityHistory> ActivityHistories => Set<ActivityHistory>();
    public DbSet<Artist> Artists => Set<Artist>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Production>(entity =>
        {
            entity.HasMany(p => p.Shows)
                .WithOne(s => s.Production)
                .HasForeignKey(s => s.ProductionId);

            entity.HasOne(p => p.Artist)
                .WithMany(a => a.Productions)
                .HasForeignKey(p => p.ArtistId);

            entity.HasIndex(p => new { p.Source, p.Slug })
                .IsUnique();
        });

        modelBuilder.Entity<Show>(entity =>
        {
            entity.HasOne(s => s.Venue)
                .WithMany(v => v.Shows)
                .HasForeignKey(s => s.VenueId);

            entity.HasIndex(s => new { s.ProductionId, s.VenueId, s.Date })
                .IsUnique()
                .HasFilter("production_id IS NOT NULL AND venue_id IS NOT NULL AND date IS NOT NULL");
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasOne(sub => sub.Show)
                .WithMany(s => s.Subscriptions)
                .HasForeignKey(sub => sub.ShowId);
        });

        modelBuilder.Entity<UserProductionActivity>(entity =>
        {
            entity.HasOne(a => a.Production)
                .WithMany(p => p.UserActivities)
                .HasForeignKey(a => a.ProductionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(a => new { a.UserId, a.ProductionId })
                .IsUnique();

            entity.HasOne(a => a.Show)
                .WithMany()
                .HasForeignKey(a => a.ShowId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ActivityHistory>(entity =>
        {
            entity.HasOne(h => h.Production)
                .WithMany()
                .HasForeignKey(h => h.ProductionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(h => h.Show)
                .WithMany()
                .HasForeignKey(h => h.ShowId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(h => new { h.UserId, h.ProductionId, h.ChangedAt });
            entity.HasIndex(h => h.ChangedAt);
        });
    }
}
