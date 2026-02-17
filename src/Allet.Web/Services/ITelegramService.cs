namespace Allet.Web.Services;

public interface ITelegramService
{
    Task SendNotificationAsync(string chatId, string message, CancellationToken cancellationToken = default);
}
