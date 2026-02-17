# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Allet is an opera, ballet, and show tracker. Users browse upcoming performances, create price/seat availability watches (subscriptions), and receive notifications. Built with a Vue 3 SPA frontend and .NET 10.0 Minimal API backend, backed by PostgreSQL.

## Build & Run Commands

```bash
# Local dev — Terminal 1: .NET API + PostgreSQL via Aspire
dotnet run --project src/Allet.AppHost

# Local dev — Terminal 2: Vue dev server (HMR, proxies /api to .NET)
cd src/Allet.Vue && npm run dev

# Build .NET
dotnet build

# Build Vue
cd src/Allet.Vue && npm run build

# Docker (builds both Vue and .NET, single container)
docker build -f src/Allet.Web/Dockerfile .

# EF Core migrations
dotnet ef migrations add <Name> --project src/Allet.Web
dotnet ef database update --project src/Allet.Web
```

The app auto-runs EF migrations on startup (`Program.cs` calls `db.Database.Migrate()`).

## Architecture

- **Solution**: `Allet.slnx` with projects `src/Allet.Web/`, `src/Allet.Vue/`, `src/Allet.AppHost/`, `src/Allet.ServiceDefaults/`
- **Frontend**: Vue 3 + TypeScript + Vite SPA (`src/Allet.Vue/`), Bootstrap 5
- **Backend**: .NET 10.0 Minimal API (`src/Allet.Web/`), serves Vue static files in production
- **ORM**: Entity Framework Core with Npgsql (PostgreSQL), snake_case naming convention
- **Config**: Connection string via `ConnectionStrings__DefaultConnection` env var; dev defaults in `appsettings.Development.json`

### Key Directories

- `src/Allet.Vue/src/views/` — Vue page components (Home, Productions, Shows, Subscriptions, Settings)
- `src/Allet.Vue/src/components/` — Shared Vue components (ProductionCard, CalendarGrid, TagBadge)
- `src/Allet.Vue/src/api/` — API client functions
- `src/Allet.Vue/src/types/` — TypeScript interfaces
- `src/Allet.Web/Api/` — Minimal API endpoints (ProductionEndpoints, ShowEndpoints, Dtos)
- `src/Allet.Web/Data/AlletDbContext.cs` — EF Core DbContext with relationship config
- `src/Allet.Web/Models/` — Production, Show, Venue, Subscription, SubscriptionType enum
- `src/Allet.Web/Services/` — Scraper services (IScraperService, OperaHuScraper, ScraperOrchestrator)

### API Endpoints

- `GET /api/productions` — list/filter productions (search, season, category, sort params)
- `GET /api/productions/filters` — distinct seasons and categories for dropdowns
- `GET /api/productions/{id}` — single production with shows
- `GET /api/shows` — shows for calendar month (year, month, productionId, tags params)
- `GET /api/shows/tags` — distinct tags for filter buttons

### Data Model

- **Production** → has many **Shows** → each has many **Subscriptions** (Price or Seat watch)
- **Venue** → has many **Shows**
- Cascade delete: removing a Show deletes its Subscriptions

### Docker

- 3-stage Dockerfile: Vue build (node:22-alpine), .NET build (sdk:10.0), runtime (aspnet:10.0-alpine)
- Single container serves both API and Vue static files on port 8080
- SPA fallback: non-API routes serve index.html for Vue Router
