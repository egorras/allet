using Allet.Web.Components;
using Allet.Web.Data;
using Allet.Web.Jobs;
using Allet.Web.Services;
using Hangfire;
using Hangfire.Dashboard;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.AddNpgsqlDbContext<AlletDbContext>("allet-db", configureDbContextOptions: options =>
    options.UseSnakeCaseNamingConvention());

// Hangfire
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options =>
        options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("allet-db"))));
builder.Services.AddHangfireServer();

// Scraper services
builder.Services.Configure<OperaHuScraperOptions>(
    builder.Configuration.GetSection("Scraper:OperaHu"));
builder.Services.AddHttpClient<OperaHuScraper>(client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("Allet/1.0");
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddScoped<IScraperService, OperaHuScraper>();

builder.Services.Configure<WienerStaatsoperScraperOptions>(
    builder.Configuration.GetSection("Scraper:WienerStaatsoper"));
builder.Services.AddHttpClient<WienerStaatsoperScraper>(client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("Allet/1.0");
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddScoped<IScraperService, WienerStaatsoperScraper>();

builder.Services.AddScoped<ScraperOrchestrator>();
builder.Services.AddScoped<OperaHuScraperJob>();
builder.Services.AddScoped<WienerStaatsoperScraperJob>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new AllowAllDashboardAuthorizationFilter()]
});

app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();

app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.MapDefaultEndpoints();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AlletDbContext>();
    db.Database.Migrate();
}

// Register scraper jobs
RecurringJob.AddOrUpdate<OperaHuScraperJob>(
    "scrape-opera-hu",
    job => job.ExecuteAsync(CancellationToken.None),
    "0 7 * * *"); // Daily at 7 AM

RecurringJob.AddOrUpdate<WienerStaatsoperScraperJob>(
    "scrape-wiener-staatsoper",
    job => job.ExecuteAsync(CancellationToken.None),
    "0 7 * * *"); // Daily at 7 AM

app.Run();

public class AllowAllDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context) => true;
}
