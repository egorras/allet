using Allet.Web.Data;
using Allet.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Allet.Web.Services;

public class ActivityHistoryService
{
    private readonly AlletDbContext _db;

    public ActivityHistoryService(AlletDbContext db)
    {
        _db = db;
    }

    public async Task RecordChange(
        string userId,
        int productionId,
        ProductionUserStatus previousStatus,
        ProductionUserStatus newStatus,
        string? note = null,
        DateOnly? watchedDate = null,
        int? showId = null)
    {
        var history = new ActivityHistory
        {
            UserId = userId,
            ProductionId = productionId,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Note = note,
            WatchedDate = watchedDate,
            ShowId = showId,
            ChangedAt = DateTime.UtcNow
        };

        _db.ActivityHistories.Add(history);
        await _db.SaveChangesAsync();
    }

    public async Task<List<ActivityHistory>> GetHistory(
        string userId,
        int? productionId = null,
        ProductionUserStatus? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        var query = _db.ActivityHistories
            .Include(h => h.Production)
            .Include(h => h.Show)
                .ThenInclude(s => s!.Venue)
            .Where(h => h.UserId == userId);

        if (productionId.HasValue)
            query = query.Where(h => h.ProductionId == productionId.Value);

        if (status.HasValue)
            query = query.Where(h => h.NewStatus == status.Value || h.PreviousStatus == status.Value);

        if (fromDate.HasValue)
            query = query.Where(h => h.ChangedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(h => h.ChangedAt <= toDate.Value);

        return await query
            .OrderByDescending(h => h.ChangedAt)
            .ToListAsync();
    }

    public async Task<bool> RevertToHistory(int historyId, string userId)
    {
        var history = await _db.ActivityHistories
            .FirstOrDefaultAsync(h => h.Id == historyId && h.UserId == userId);

        if (history == null)
            return false;

        // Get current activity
        var currentActivity = await _db.UserActivities
            .FirstOrDefaultAsync(a => a.ProductionId == history.ProductionId && a.UserId == userId);

        var currentStatus = currentActivity?.Status ?? ProductionUserStatus.None;

        // Record the revert action in history
        await RecordChange(
            userId,
            history.ProductionId,
            currentStatus,
            history.PreviousStatus,
            $"Reverted from {currentStatus} to {history.PreviousStatus}",
            history.PreviousStatus == ProductionUserStatus.Watched ? history.WatchedDate : null,
            history.ShowId
        );

        // Update or create the activity with the previous status
        if (history.PreviousStatus == ProductionUserStatus.None)
        {
            // Remove the activity
            if (currentActivity != null)
            {
                _db.UserActivities.Remove(currentActivity);
            }
        }
        else
        {
            if (currentActivity == null)
            {
                currentActivity = new UserProductionActivity
                {
                    UserId = userId,
                    ProductionId = history.ProductionId
                };
                _db.UserActivities.Add(currentActivity);
            }

            currentActivity.Status = history.PreviousStatus;
            currentActivity.Note = history.Note;
            currentActivity.WatchedDate = history.WatchedDate;
            currentActivity.ShowId = history.ShowId;
            currentActivity.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return true;
    }
}
