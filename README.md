# Allet

Family app for interests, opportunities and plans. See [ALLET_PLAN.md](./ALLET_PLAN.md) for the
product plan; this repository currently implements **v0 — the UI skeleton** (plan §8).

## Requirements

- Node **22.20.0** (`.nvmrc`)
- pnpm **11.24.0** (enable with `corepack enable`; the version is pinned in `package.json`)

## Commands

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `pnpm install`   | Install workspace dependencies            |
| `pnpm dev`       | Run the web app at http://localhost:5173  |
| `pnpm build`     | Production build of the web app           |
| `pnpm preview`   | Serve the production build at :4173       |
| `pnpm lint`      | ESLint over the workspace                 |
| `pnpm typecheck` | TypeScript, strict                        |
| `pnpm format`    | Prettier write (`format:check` to verify) |
| `pnpm test:unit` | Vitest unit tests                         |
| `pnpm test:e2e`  | Playwright browser tests                  |

## Scope of v0

Included: the full navigation structure with working routes, EN/RU/DE, filters kept in the URL,
a keyboard-driven search over the app's own pages, a calendar frame, and honest empty states.

Not included: API, database, real users and invitations, real offers, collectors, Telegram, AI,
ticket import, map services. Nothing in the app sends a network request to an external service,
and the app ships no demo data — empty states say what is missing instead of faking it.
