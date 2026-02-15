using System.Text.Json;
using Allet.Web.Services.Pages;

namespace Allet.Web.Tests.Pages;

public class AllDatesResponseTests
{
    [Fact]
    public void GetDistinctMonths_ExtractsUniqueMonths()
    {
        var response = new AllDatesResponse
        {
            Status = "OK",
            Data = new AllDatesData
            {
                Eloadasok =
                [
                    "2025-09-05", "2025-09-06", "2025-09-12",
                    "2025-10-01", "2025-10-03",
                    "2026-01-15", "2026-01-20",
                    "2026-02-01"
                ]
            }
        };

        var months = response.GetDistinctMonths();

        Assert.Equal(4, months.Count);
        Assert.Equal((2025, 9), months[0]);
        Assert.Equal((2025, 10), months[1]);
        Assert.Equal((2026, 1), months[2]);
        Assert.Equal((2026, 2), months[3]);
    }

    [Fact]
    public void GetDistinctMonths_ReturnsEmptyForEmptyData()
    {
        var response = new AllDatesResponse
        {
            Status = "OK",
            Data = new AllDatesData { Eloadasok = [] }
        };

        Assert.Empty(response.GetDistinctMonths());
    }

    [Fact]
    public void GetDistinctMonths_SkipsInvalidDates()
    {
        var response = new AllDatesResponse
        {
            Status = "OK",
            Data = new AllDatesData
            {
                Eloadasok = ["not-a-date", "2026-02-15", "", "2026-03-01"]
            }
        };

        var months = response.GetDistinctMonths();

        Assert.Equal(2, months.Count);
        Assert.Equal((2026, 2), months[0]);
        Assert.Equal((2026, 3), months[1]);
    }

    [Fact]
    public void GetDistinctMonths_IsSortedChronologically()
    {
        var response = new AllDatesResponse
        {
            Status = "OK",
            Data = new AllDatesData
            {
                Eloadasok = ["2026-06-01", "2025-12-01", "2026-01-01"]
            }
        };

        var months = response.GetDistinctMonths();

        Assert.Equal((2025, 12), months[0]);
        Assert.Equal((2026, 1), months[1]);
        Assert.Equal((2026, 6), months[2]);
    }

    [Fact]
    public void Deserialize_ParsesRealApiResponse()
    {
        var json = """
            {"status": "OK", "data": {"eloadasok": ["2025-09-05", "2025-09-06", "2026-02-15", "2026-08-18"]}}
        """;

        var response = JsonSerializer.Deserialize<AllDatesResponse>(json);

        Assert.NotNull(response);
        Assert.Equal("OK", response.Status);
        Assert.Equal(4, response.Data.Eloadasok.Count);

        var months = response.GetDistinctMonths();
        Assert.Equal(3, months.Count);
        Assert.Equal((2025, 9), months[0]);
        Assert.Equal((2026, 2), months[1]);
        Assert.Equal((2026, 8), months[2]);
    }
}
