using Allet.Web.Components.Pages;
using Allet.Web.Data;
using Allet.Web.Models;
using Bunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace Allet.Web.Tests;

public class HomeTests : BunitContext
{
    [Fact]
    public void Home_Page_Creates_New_Scope_For_Operations()
    {
        // Arrange
        // Setup In-Memory Database andContext
        var options = new DbContextOptionsBuilder<AlletDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var dbContext = new AlletDbContext(options);

        // Seed data
        dbContext.Venues.Add(new Venue { Id = 1, Name = "Main Stage" });
        dbContext.Productions.Add(new Production
        {
            Id = 1,
            Title = "Test Production",
            Slug = "test-prod", // Required by EF config likely
            Source = "Test",
            Season = "2024/2025",
            Shows = new List<Show>
            {
                new Show { Id = 1, Date = DateTime.UtcNow.AddDays(1), VenueId = 1, Title = "Test Show" }
            }
        });
        dbContext.SaveChanges();

        // Mock IServiceScopeFactory
        var mockScopeFactory = new Mock<IServiceScopeFactory>();
        var mockScope = new Mock<IServiceScope>();
        var mockServiceProvider = new Mock<IServiceProvider>();

        // Setup Mock Behavior
        mockScopeFactory.Setup(x => x.CreateScope()).Returns(mockScope.Object);
        mockScope.Setup(x => x.ServiceProvider).Returns(mockServiceProvider.Object);
        mockScope.Setup(x => x.Dispose()); // allow dispose

        // When asking for DbContext, return our seeded context
        mockServiceProvider.Setup(x => x.GetService(typeof(AlletDbContext))).Returns(dbContext);

        // Register the mock factory in bUnit's services
        Services.AddSingleton(mockScopeFactory.Object);

        // Act
        var cut = Render<Home>();

        // Assert
        // Verify that CreateScope was called. 
        // 1. In OnInitializedAsync (for Venues)
        // 2. In LoadAsync (called by OnInitializedAsync)
        // We expect at least 2 calls.
        mockScopeFactory.Verify(x => x.CreateScope(), Times.AtLeast(2));

        // Verify content rendered to ensure logic actually ran
        Assert.Contains("Test Production", cut.Markup);
        Assert.Contains("Main Stage", cut.Markup);
    }
}
