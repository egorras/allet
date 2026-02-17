namespace Allet.Web.Api;

public record ProductionListItemDto(
    int Id,
    string Title,
    string? Subtitle,
    string? ImageUrl,
    string Season,
    string? Category,
    string[] Tags,
    int ShowCount,
    int? RunningTimeMinutes
);

public record ProductionDetailDto(
    int Id,
    string Title,
    string? Subtitle,
    string? Description,
    string? Synopsis,
    string? Guide,
    string? ImageUrl,
    string[] GalleryUrls,
    string? SourceUrl,
    string Season,
    string? Category,
    string[] Tags,
    int? RunningTimeMinutes,
    string Source,
    DateTime CreatedAt,
    ShowDto[] Shows
);

public record ShowDto(
    int Id,
    string Title,
    DateTime? Date,
    string? VenueName,
    string? Url,
    bool IsRehearsal,
    int? ProductionId,
    string? ProductionTitle
);

public record FiltersDto(
    string[] Seasons,
    string[] Categories
);
