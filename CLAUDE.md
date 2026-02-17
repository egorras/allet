# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Allet is an opera, ballet, and show tracker. Users browse upcoming performances, create price/seat availability watches (subscriptions), and receive Telegram notifications. Built with .NET 10.0, Blazor Server (Interactive Server render mode), and PostgreSQL. UI has been modernized with a dark slate sidebar, softer indigo color palette, and card hover effects.

## Build & Run Commands

```bash
# Local dev with Aspire (includes PostgreSQL orchestration)
dotnet run --project src/Allet.AppHost

# Build
dotnet build

# Docker
docker build -f src/Allet.Web/Dockerfile .

# EF Core migrations
dotnet ef migrations add <Name> --project src/Allet.Web
dotnet ef database update --project src/Allet.Web
```

The app auto-runs EF migrations on startup (`Program.cs` calls `db.Database.Migrate()`).

## Architecture

- **Solution**: `Allet.slnx` with projects `src/Allet.Web/`, `src/Allet.AppHost/`, `src/Allet.ServiceDefaults/`
- **UI**: Blazor Server with Interactive Server render mode, Bootstrap CSS
- **ORM**: Entity Framework Core with Npgsql (PostgreSQL), snake_case naming convention
- **Config**: Connection string via `ConnectionStrings__DefaultConnection` env var; dev defaults in `appsettings.Development.json`

### Key Directories

- `Components/Pages/` — Blazor page components (Home, Productions, ProductionDetail, Shows, Subscriptions, Settings)
- `Components/Layout/` — MainLayout, NavMenu, ReconnectModal
- `Data/AlletDbContext.cs` — EF Core DbContext with relationship config
- `Models/` — Production, Show, Venue, Subscription, SubscriptionType enum
- `Services/` — Scraper services (IScraperService, OperaHuScraper, ScraperOrchestrator), ITelegramService

### Data Model

- **Production** → has many **Shows** → each has many **Subscriptions** (Price or Seat watch)
- **Venue** → has many **Shows**
- Cascade delete: removing a Show deletes its Subscriptions

### Docker

- Multi-stage Dockerfile targeting .NET 10.0
- Single container serves Blazor Server app on port 8080
