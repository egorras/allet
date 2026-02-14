# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Allet is an opera, ballet, and show tracker. Users browse upcoming performances, create price/seat availability watches (subscriptions), and receive Telegram notifications. Built with .NET 10.0, Blazor Server, and PostgreSQL.

## Build & Run Commands

```bash
# Run with Docker Compose (includes PostgreSQL)
docker-compose up

# Run locally (requires local PostgreSQL)
dotnet run --project src/Allet.Web

# Build
dotnet build

# EF Core migrations
dotnet ef migrations add <Name> --project src/Allet.Web
dotnet ef database update --project src/Allet.Web
```

The app auto-runs EF migrations on startup (`Program.cs` calls `db.Database.Migrate()`).

## Architecture

- **Solution**: `Allet.slnx` with single project `src/Allet.Web/`
- **UI**: Blazor Server with Interactive Server render mode, Bootstrap CSS
- **ORM**: Entity Framework Core with Npgsql (PostgreSQL), snake_case naming convention
- **Config**: Connection string via `ConnectionStrings__DefaultConnection` env var; dev defaults in `appsettings.Development.json` (localhost:5432, db: allet)

### Key Directories

- `Components/Pages/` — Blazor page components (Home, Shows, Subscriptions, Settings)
- `Components/Layout/` — MainLayout, NavMenu
- `Data/AlletDbContext.cs` — EF Core DbContext with relationship config
- `Models/` — Show, Venue, Subscription, SubscriptionType enum
- `Services/` — Service interfaces (IScraperService, ITelegramService) — implementations pending

### Data Model

- **Venue** → has many **Shows** → each has many **Subscriptions** (Price or Seat watch)
- Cascade delete: removing a Show deletes its Subscriptions

### Docker

- Multi-stage Dockerfile targeting .NET 10.0
- Compose runs `allet-web` (port 8082→8080) and `allet-db` (PostgreSQL 16 Alpine)
- DB health check ensures PostgreSQL is ready before app starts
