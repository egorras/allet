using Allet.Web.Services.Pages;

namespace Allet.Web.Tests.Pages;

public class ProductionDetailPageTests
{
    [Fact]
    public void Title_ExtractsFromH1()
    {
        var html = """<h1 class="project-cover-title">Aida</h1>""";
        var page = new ProductionDetailPage(html);
        Assert.Equal("Aida", page.Title);
    }

    [Fact]
    public void Title_DecodesHtmlEntities()
    {
        var html = """<h1 class="project-cover-title">L&#x27;italiana in Algeri</h1>""";
        var page = new ProductionDetailPage(html);
        Assert.Equal("L'italiana in Algeri", page.Title);
    }

    [Fact]
    public void Title_StripsInnerHtmlTags()
    {
        var html = """<h1 class="project-cover-title">Don <em>Giovanni</em></h1>""";
        var page = new ProductionDetailPage(html);
        Assert.Equal("Don  Giovanni", page.Title);
    }

    [Fact]
    public void Title_ReturnsNullWhenMissing()
    {
        var page = new ProductionDetailPage("<html><body>No title here</body></html>");
        Assert.Null(page.Title);
    }

    [Fact]
    public void ImageUrl_ExtractsFromOgMeta()
    {
        var html = """
            <meta property="og:image" content="https://www.opera.hu/media/images/aida.jpg">
        """;
        var page = new ProductionDetailPage(html);
        Assert.Equal("https://www.opera.hu/media/images/aida.jpg", page.ImageUrl);
    }

    [Fact]
    public void ImageUrl_ReturnsNullWhenMissing()
    {
        var page = new ProductionDetailPage("<html></html>");
        Assert.Null(page.ImageUrl);
    }

    [Fact]
    public void Synopsis_ExtractsAndStripsHtml()
    {
        var html = """
            <h2 class="project-subtitle">Synopsis</h2>
            <div class="rich-text"><p><strong>Act I</strong></p><p>The story begins.</p></div>
        """;
        var page = new ProductionDetailPage(html);
        Assert.NotNull(page.Synopsis);
        Assert.Contains("Act I", page.Synopsis);
        Assert.Contains("The story begins.", page.Synopsis);
        Assert.DoesNotContain("<p>", page.Synopsis);
        Assert.DoesNotContain("<strong>", page.Synopsis);
    }

    [Fact]
    public void Synopsis_ReturnsNullWhenMissing()
    {
        var html = """<h1 class="project-cover-title">Aida</h1>""";
        var page = new ProductionDetailPage(html);
        Assert.Null(page.Synopsis);
    }

    [Fact]
    public void Synopsis_TruncatesLongText()
    {
        var longText = new string('x', 3000);
        var html = $"""
            <h2 class="project-subtitle">Synopsis</h2>
            <div class="rich-text">{longText}</div>
        """;
        var page = new ProductionDetailPage(html);
        Assert.NotNull(page.Synopsis);
        Assert.True(page.Synopsis.Length <= 2003); // 2000 + "..."
        Assert.EndsWith("...", page.Synopsis);
    }

    [Fact]
    public void AllProperties_ParseRealPageStructure()
    {
        var html = """
            <html>
            <head>
                <meta property="og:image" content="https://www.opera.hu/media/images/onegin.jpg">
            </head>
            <body>
                <h1 class="project-cover-title">Onegin</h1>
                <h2 class="project-subtitle">Synopsis</h2>
                <div class="rich-text"><p>Onegin rejects Tatyana&#x27;s love.</p></div>
            </body>
            </html>
        """;

        var page = new ProductionDetailPage(html);

        Assert.Equal("Onegin", page.Title);
        Assert.Equal("https://www.opera.hu/media/images/onegin.jpg", page.ImageUrl);
        Assert.Equal("Onegin rejects Tatyana's love.", page.Synopsis);
    }
}
