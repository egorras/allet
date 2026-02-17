namespace Allet.Web.Services;

public class ToastMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Message { get; set; } = string.Empty;
    public ToastType Type { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ToastType
{
    Success,
    Info,
    Warning,
    Error
}

public class ToastService
{
    public event Action<ToastMessage>? OnShow;
    public event Action<string>? OnHide;

    public void ShowSuccess(string message)
    {
        Show(message, ToastType.Success);
    }

    public void ShowInfo(string message)
    {
        Show(message, ToastType.Info);
    }

    public void ShowWarning(string message)
    {
        Show(message, ToastType.Warning);
    }

    public void ShowError(string message)
    {
        Show(message, ToastType.Error);
    }

    private void Show(string message, ToastType type)
    {
        var toast = new ToastMessage
        {
            Message = message,
            Type = type
        };
        OnShow?.Invoke(toast);
    }

    public void Hide(string id)
    {
        OnHide?.Invoke(id);
    }
}
