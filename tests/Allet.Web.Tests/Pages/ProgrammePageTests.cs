using Allet.Web.Services.Pages;

namespace Allet.Web.Tests.Pages;

public class ProgrammePageTests
{
    [Fact]
    public void GetEvents_ParsesSingleDayWithSingleEvent()
    {
        var html = WrapInPage("""
            <li id="nap_20260207" class="day">
                <div class="day-header" title="February 7., Saturday"></div>
                <div class="day-list">
                    <wt-event class="block-list-post" data-project-id="40286">
                        <template>
                            <article class="post">
                                <div class="post-time">10:00</div>
                                <h2 class="post-title">
                                    <a href="/en/programme/2025-2026/magyar-nemzeti-balettintezet-nyilt-nap-az-eiffel-muhelyhazban/eiffel-art-studios-hevesi-sandor-stage-2026-02-07-1000/"
                                       class="post-title-link">
                                        Open day at the Hungarian National Balett Institute
                                    </a>
                                </h2>
                                <span class="post-location-name">Eiffel Art Studios &#8212; Hevesi S&#225;ndor Stage</span>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
        """);

        var page = new ProgrammePage(html);
        var events = page.GetEvents();

        var e = Assert.Single(events);
        Assert.Equal("2025-2026", e.Season);
        Assert.Equal("magyar-nemzeti-balettintezet-nyilt-nap-az-eiffel-muhelyhazban", e.Slug);
        Assert.Equal("Open day at the Hungarian National Balett Institute", e.Title);
        Assert.Equal("Eiffel Art Studios — Hevesi Sándor Stage", e.VenueName);
        Assert.Equal(new DateTime(2026, 2, 7, 10, 0, 0, DateTimeKind.Utc), e.Date);
    }

    [Fact]
    public void GetEvents_ParsesMultipleEventsInOneDay()
    {
        var html = WrapInPage("""
            <li id="nap_20260201" class="day">
                <div class="day-header" title="February 1., Sunday"></div>
                <div class="day-list">
                    <wt-event class="block-list-post">
                        <template>
                            <article class="post">
                                <div class="post-time">10:30</div>
                                <h2 class="post-title">
                                    <a href="/en/programme/2025-2026/morning-jam/eiffel-art-studios-2026-02-01-1030/"
                                       class="post-title-link">Morning Jam</a>
                                </h2>
                                <span class="post-location-name">Eiffel Art Studios</span>
                            </article>
                        </template>
                    </wt-event>
                    <wt-event class="block-list-post">
                        <template>
                            <article class="post">
                                <div class="post-time">11:00</div>
                                <h2 class="post-title">
                                    <a href="/en/programme/2025-2026/aida/hungarian-state-opera-2026-02-01-1100/"
                                       class="post-title-link">Aida</a>
                                </h2>
                                <span class="post-location-name">Hungarian State Opera</span>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
        """);

        var page = new ProgrammePage(html);
        var events = page.GetEvents();

        Assert.Equal(2, events.Count);
        Assert.Equal("Morning Jam", events[0].Title);
        Assert.Equal(new DateTime(2026, 2, 1, 10, 30, 0, DateTimeKind.Utc), events[0].Date);
        Assert.Equal("Aida", events[1].Title);
        Assert.Equal(new DateTime(2026, 2, 1, 11, 0, 0, DateTimeKind.Utc), events[1].Date);
    }

    [Fact]
    public void GetEvents_ParsesMultipleDays()
    {
        var html = WrapInPage("""
            <li id="nap_20260301" class="day">
                <div class="day-header" title="March 1., Sunday"></div>
                <div class="day-list">
                    <wt-event>
                        <template>
                            <article>
                                <div class="post-time">19:00</div>
                                <h2 class="post-title">
                                    <a href="/en/programme/2025-2026/onegin/hungarian-state-opera-2026-03-01-1900/"
                                       class="post-title-link">Onegin</a>
                                </h2>
                                <span class="post-location-name">Hungarian State Opera</span>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
            <li id="nap_20260303" class="day">
                <div class="day-header" title="March 3., Tuesday"></div>
                <div class="day-list">
                    <wt-event>
                        <template>
                            <article>
                                <div class="post-time">18:00</div>
                                <h2 class="post-title">
                                    <a href="/en/programme/2025-2026/la-traviata/hungarian-state-opera-2026-03-03-1800/"
                                       class="post-title-link">La traviata</a>
                                </h2>
                                <span class="post-location-name">Hungarian State Opera</span>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
        """);

        var page = new ProgrammePage(html);
        var events = page.GetEvents();

        Assert.Equal(2, events.Count);
        Assert.Equal("Onegin", events[0].Title);
        Assert.Equal(new DateTime(2026, 3, 1, 19, 0, 0, DateTimeKind.Utc), events[0].Date);
        Assert.Equal("La traviata", events[1].Title);
        Assert.Equal(new DateTime(2026, 3, 3, 18, 0, 0, DateTimeKind.Utc), events[1].Date);
    }

    [Fact]
    public void GetEvents_DefaultsVenueWhenMissing()
    {
        var html = WrapInPage("""
            <li id="nap_20260301" class="day">
                <div class="day-list">
                    <wt-event>
                        <template>
                            <article>
                                <div class="post-time">19:00</div>
                                <h2 class="post-title">
                                    <a href="/en/programme/2025-2026/onegin/venue-2026-03-01-1900/"
                                       class="post-title-link">Onegin</a>
                                </h2>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
        """);

        var page = new ProgrammePage(html);
        var events = page.GetEvents();

        Assert.Equal("Hungarian State Opera", Assert.Single(events).VenueName);
    }

    [Fact]
    public void GetEvents_FallsBackToSlugForTitle()
    {
        var html = WrapInPage("""
            <li id="nap_20260301" class="day">
                <div class="day-list">
                    <wt-event>
                        <template>
                            <article>
                                <div class="post-time">19:00</div>
                                <h2 class="post-title">
                                    <a href="/en/programme/2025-2026/don-giovanni/venue-2026-03-01-1900/"
                                       class="post-title-link">   </a>
                                </h2>
                                <span class="post-location-name">Opera</span>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
        """);

        var page = new ProgrammePage(html);
        var events = page.GetEvents();

        Assert.Equal("Don Giovanni", Assert.Single(events).Title);
    }

    [Fact]
    public void GetEvents_SkipsEventWithoutTitleLink()
    {
        var html = WrapInPage("""
            <li id="nap_20260301" class="day">
                <div class="day-list">
                    <wt-event>
                        <template>
                            <article>
                                <div class="post-time">19:00</div>
                                <h2 class="post-title">No link here</h2>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
        """);

        var page = new ProgrammePage(html);
        var events = page.GetEvents();

        Assert.Empty(events);
    }

    [Fact]
    public void GetEvents_HandlesAlternateAttributeOrder()
    {
        // class before href
        var html = WrapInPage("""
            <li id="nap_20260315" class="day">
                <div class="day-list">
                    <wt-event>
                        <template>
                            <article>
                                <div class="post-time">20:00</div>
                                <h2 class="post-title">
                                    <a class="post-title-link"
                                       href="/en/programme/2025-2026/fidelio/hungarian-state-opera-2026-03-15-2000/">
                                        Fidelio
                                    </a>
                                </h2>
                                <span class="post-location-name">Hungarian State Opera</span>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
        """);

        var page = new ProgrammePage(html);
        var events = page.GetEvents();

        var e = Assert.Single(events);
        Assert.Equal("Fidelio", e.Title);
        Assert.Equal("fidelio", e.Slug);
        Assert.Equal(new DateTime(2026, 3, 15, 20, 0, 0, DateTimeKind.Utc), e.Date);
    }

    [Fact]
    public void GetEvents_ReturnsEmptyForEmptyHtml()
    {
        var page = new ProgrammePage("");
        Assert.Empty(page.GetEvents());
    }

    [Fact]
    public void GetEvents_DecodesHtmlEntitiesInTitle()
    {
        var html = WrapInPage("""
            <li id="nap_20260301" class="day">
                <div class="day-list">
                    <wt-event>
                        <template>
                            <article>
                                <div class="post-time">19:00</div>
                                <h2 class="post-title">
                                    <a href="/en/programme/2025-2026/die-entfuhrung/opera-2026-03-01-1900/"
                                       class="post-title-link">
                                        Die Entf&#252;hrung aus dem Serail
                                    </a>
                                </h2>
                                <span class="post-location-name">Opera</span>
                            </article>
                        </template>
                    </wt-event>
                </div>
            </li>
        """);

        var page = new ProgrammePage(html);
        var events = page.GetEvents();

        Assert.Equal("Die Entführung aus dem Serail", Assert.Single(events).Title);
    }

    private static string WrapInPage(string dayBlocks)
    {
        return $"<html><body><ul>{dayBlocks}</ul></body></html>";
    }
}
