# Allet

Family app for interests, opportunities and plans. [ALLET_PLAN.md](./ALLET_PLAN.md) is the product
plan. This repository implements **v0 — the interface skeleton** (plan §8) and the first slice of
**v0.1**: a local catalogue server and a worker that keeps the Budapest programme up to date.

## Requirements

- Node **22.20.0** — see `.nvmrc`
- pnpm **11.24.0** — `corepack enable` picks up the version pinned in `package.json`

## Commands

| Command                        | What it does                                          |
| ------------------------------ | ----------------------------------------------------- |
| `pnpm install`                 | Install workspace dependencies                        |
| `pnpm dev`                     | Web app, API and worker together                      |
| `pnpm build`                   | Production build of the web app                       |
| `pnpm preview`                 | Serve the production build at http://localhost:4173   |
| `pnpm lint`                    | ESLint over the workspace                             |
| `pnpm typecheck`               | TypeScript, strict                                    |
| `pnpm format`                  | Prettier write — `pnpm format:check` only verifies    |
| `pnpm test:unit`               | Vitest unit tests, web and server                     |
| `pnpm test:e2e`                | Playwright browser tests against the production build |
| `pnpm db:migrate`              | Create or migrate the local database                  |
| `pnpm import:budapest 2026-10` | Fetch and import one month of the Budapest programme  |
| `pnpm dev:worker`              | Just the worker, if the rest is already running       |

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
- Imports one month of the Hungarian State Opera programme, either from `pnpm import:budapest` or
  from the worker. A repeat import updates the records it already has; it never deletes what a page
  stopped listing, and it reports honestly how many records were new, changed and unchanged.
- Keeps a performance's identity across a reschedule when the source keeps the ticket identity,
  so a moved date updates the existing record instead of creating a second one.
- Leaves the catalogue untouched when a page fails to parse, and records why the run failed.
- Spends requests from a persistent budget: one at a time, 10 s apart, at most 6 an hour and 24 a
  day, with a stored pause that honours `Retry-After` and backs off after failures. The budget
  survives restarts because it lives in the database, not in memory.
- Serves JSON on loopback only. The browser reaches it same-origin through the dev and preview
  proxy. The API never contacts a source: it reads the catalogue, and it changes the schedule and
  the queue. Only the worker spends requests.

## What the worker does

Run it with `pnpm dev` (or `pnpm dev:worker` on its own). It is the only process that reaches
outside, and it starts with its schedule switched off.

- Keeps a rolling window of months fresh — by default the next three, each refreshed at most once a
  day — and does one month per check, so a backlog drains steadily instead of arriving at once.
- Holds no schedule in memory. Every tick asks the database what is due, so a restart resumes where
  it stopped, and an idle day produces **one** import for a month rather than one per interval that
  passed. Due times are always measured from the moment a run finished.
- Months are spread deterministically within their interval, so months discovered together stop
  falling due in the same tick and a displayed due time does not flicker.
- Asks the request budget before it starts, so a month the budget will not pay for is postponed
  rather than recorded as a failed import.
- Backs a failing month off, doubling up to a week, without holding up the other months.
- Never runs while a manual import is in flight, and does not count that as the month's failure.

Settings → Modules shows the schedule, the queued months with their due times, and the history of
every run down to what each one wrote. From there you can change the schedule, queue a month
outside the window, move one to the front, or drop it. Queueing a month does not import it: the
worker picks it up on its next tick, if the budget allows.

## What v0 does not do

No accounts or invitations, no scheduled collection, no Telegram, no AI, no ticket availability or
seat monitoring, no map service, no saved collections, and no plans beyond the placeholder page.
There is no demo data in the app: test fixtures live in tests only. The browser still sends no
request to any origin other than its own — the app's only network call is same-origin `/api/` —
and a browser test fails the build if that ever changes.

Because there is no sign-in yet, the API accepts a change only from a request carrying a header
that a page on another origin cannot set without a preflight the server never answers. That is a
stopgap for a loopback server on one machine, and it is replaced by household accounts rather than
extended.

## Deployment

`allet2.egorras.net` runs on the VPS under Dokploy, the same way quake-stats does, and is reachable
**over the tailnet only** — its DNS record points at the host's Tailscale address, not its public
one. There is no sign-in yet, so the tailnet is the access control; do not give this hostname a
public address until household accounts exist.

`docker-compose.yml` is both the Dokploy deploy target and the way to run the whole thing locally:

```sh
docker compose up --build     # web on container port 3001, worker beside it
```

- One image, two commands. `web` runs the API and serves the built web app, so the browser still
  talks to a single origin and the no-external-requests rule holds without a proxy in front.
- Both services share `allet-data`, a named volume holding the SQLite file. It is named on purpose:
  a redeploy replaces the containers and keeps the catalogue, the run history and the request
  budget's pause state. Losing it would also lose the record of what has already been asked of
  opera.hu.
- **The schedule ships off.** A fresh deployment contacts nothing until it is enabled in
  Settings → Modules. Queueing a month while it is off is safe: the month waits.

In Dokploy, point the Domain at the `web` service, container port 3001. Nothing needs an
environment variable to start; `ALLET_PORT` only changes which loopback port the host publishes,
for when 3001 is already taken.

### Reaching it over the tailnet

Tailscale issues a certificate for a `ts.net` name, which avoids pointing a public DNS record at a
CGNAT address that Let's Encrypt cannot reach. With the stack up:

```sh
tailscale serve --bg --https=8443 http://127.0.0.1:3001   # https://<host>.<tailnet>.ts.net:8443
tailscale serve --https=8443 off                          # and to stop
```

A port other than 443 is only needed when `/` on that host is already served by something else.

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
  importer.ts   one month in, records out, with run history and a run log
  scheduler.ts  what is due, when it is next due, and what to do when it fails
  worker.ts     the ticking process, and the only one that reaches a source
  app.ts        JSON API: reads the catalogue, edits the schedule and the queue
packages/contracts/ Zod schemas the server answers with and the web app validates against
```

`packages/` holds code a second consumer actually needs — `contracts` earns its place because both
the server and the web app depend on it. See
[CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md).
