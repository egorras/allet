# Allet

Family app for interests, opportunities and plans. [ALLET_PLAN.md](./ALLET_PLAN.md) is the product
plan. This repository implements **v0 — the interface skeleton** (plan §8) and the first slice of
**v0.1**: a local catalogue server that imports the Budapest programme on demand.

## Requirements

- Node **22.20.0** — see `.nvmrc`
- pnpm **11.24.0** — `corepack enable` picks up the version pinned in `package.json`

## Commands

| Command                        | What it does                                            |
| ------------------------------ | ------------------------------------------------------- |
| `pnpm install`                 | Install workspace dependencies                          |
| `pnpm dev`                     | Web app at http://localhost:5173, API on loopback :3001 |
| `pnpm build`                   | Production build of the web app                         |
| `pnpm preview`                 | Serve the production build at http://localhost:4173     |
| `pnpm lint`                    | ESLint over the workspace                               |
| `pnpm typecheck`               | TypeScript, strict                                      |
| `pnpm format`                  | Prettier write — `pnpm format:check` only verifies      |
| `pnpm test:unit`               | Vitest unit tests, web and server                       |
| `pnpm test:e2e`                | Playwright browser tests against the production build   |
| `pnpm db:migrate`              | Create or migrate the local database                    |
| `pnpm import:budapest 2026-10` | Fetch and import one month of the Budapest programme    |

The first `pnpm test:e2e` needs the browser once: `pnpm --filter @allet/web exec playwright install chromium`.

## What v0 does

- Every page of the navigation in [plan §3](./ALLET_PLAN.md), reachable by link and by direct URL,
  plus a not-found page.
- One shell for both widths: compact sidebar on desktop, bottom tabs and a "More" sheet on phones.
- English, Russian and German, switchable at any time; the choice is remembered per device.
- List filters and the calendar month live in the address, so a view can be reloaded and shared.
- Ctrl/Cmd+K search over the app's own pages — and it says that this is all it searches.
- Empty states everywhere. Actions that need an account are visibly disabled and say why.

## What the catalogue server does

- Stores sources, venues, productions, performances and import history in a local SQLite file
  (`apps/server/data/allet.db`, overridable with `ALLET_DB`), created by numbered SQL migrations.
- Imports one month of the Hungarian State Opera programme when you run `pnpm import:budapest`.
  A repeat import updates the records it already has; it never deletes what a page stopped listing.
- Keeps a performance's identity across a reschedule when the source keeps the ticket identity,
  so a moved date updates the existing record instead of creating a second one.
- Leaves the catalogue untouched when a page fails to parse, and records why the run failed.
- Spends requests from a persistent budget: one at a time, 10 s apart, at most 6 an hour and 24 a
  day, with a stored pause that honours `Retry-After` and backs off after failures. The budget
  survives restarts because it lives in the database, not in memory.
- Serves read-only JSON on loopback only. The browser reaches it same-origin through the dev and
  preview proxy. There is no HTTP endpoint that starts an import: that waits for household
  accounts, so an import is something the operator runs locally.

## What v0 does not do

No accounts or invitations, no scheduled collection, no Telegram, no AI, no ticket availability or
seat monitoring, no map service, no saved collections, and no plans beyond the placeholder page.
There is no demo data in the app: test fixtures live in tests only. The browser still sends no
request to any origin other than its own — the app's only network call is same-origin `/api/` —
and a browser test fails the build if that ever changes.

## Layout

```text
apps/web/src/
  app/          shell, router, styles
  routes/       file-based routes -> routeTree.gen.ts (generated, committed)
  modules/      stage, travel, and the static registry that wires them into navigation
  shared/       ui primitives, filters, calendar, page search, per-device preferences
  i18n/         i18next setup and the EN/RU/DE namespaces
apps/web/tests/ unit tests (Vitest) and browser tests (Playwright)
apps/server/src/
  db/           schema, numbered SQL migrations, connection
  budapest/     programme parser and the captured page it is tested against
  requests.ts   the persistent request budget for opera.hu
  importer.ts   one month in, records out, with run history
  app.ts        read-only JSON API
packages/contracts/ Zod schemas the server answers with and the web app validates against
```

`packages/` holds code a second consumer actually needs — `contracts` earns its place because both
the server and the web app depend on it. See
[CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md).
