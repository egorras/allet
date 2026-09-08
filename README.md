# Allet

Family app for interests, opportunities and plans. [ALLET_PLAN.md](./ALLET_PLAN.md) is the product
plan; this repository currently implements **v0 — the interface skeleton** (plan §8).

## Requirements

- Node **22.20.0** — see `.nvmrc`
- pnpm **11.24.0** — `corepack enable` picks up the version pinned in `package.json`

## Commands

| Command          | What it does                                          |
| ---------------- | ----------------------------------------------------- |
| `pnpm install`   | Install workspace dependencies                        |
| `pnpm dev`       | Run the web app at http://localhost:5173              |
| `pnpm build`     | Production build of the web app                       |
| `pnpm preview`   | Serve the production build at http://localhost:4173   |
| `pnpm lint`      | ESLint over the workspace                             |
| `pnpm typecheck` | TypeScript, strict                                    |
| `pnpm format`    | Prettier write — `pnpm format:check` only verifies    |
| `pnpm test:unit` | Vitest unit tests                                     |
| `pnpm test:e2e`  | Playwright browser tests against the production build |

The first `pnpm test:e2e` needs the browser once: `pnpm --filter @allet/web exec playwright install chromium`.

## What v0 does

- Every page of the navigation in [plan §3](./ALLET_PLAN.md), reachable by link and by direct URL,
  plus a not-found page.
- One shell for both widths: compact sidebar on desktop, bottom tabs and a "More" sheet on phones.
- English, Russian and German, switchable at any time; the choice is remembered per device.
- List filters and the calendar month live in the address, so a view can be reloaded and shared.
- Ctrl/Cmd+K search over the app's own pages — and it says that this is all it searches.
- Empty states everywhere. Actions that need a server are visibly disabled and say why.

## What v0 does not do

No API, no database, no accounts or invitations, no collectors, no Telegram, no AI, no ticket
import, no map service, no saved collections. There is no demo data in the app: test fixtures live
in tests only. The app sends no request to any origin other than its own, and a browser test fails
the build if that ever changes.

## Layout

```text
apps/web/src/
  app/          shell, router, styles
  routes/       file-based routes -> routeTree.gen.ts (generated, committed)
  modules/      stage, travel, and the static registry that wires them into navigation
  shared/       ui primitives, filters, calendar, page search, per-device preferences
  i18n/         i18next setup and the EN/RU/DE namespaces
apps/web/tests/ unit tests (Vitest) and browser tests (Playwright)
```

`packages/` is reserved for code that a second consumer actually needs — see
[CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md).
