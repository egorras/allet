# Working in this repository

Read [ALLET_PLAN.md](./ALLET_PLAN.md) first: it defines what Allet is, what v0 includes, and what is
deliberately left out. This file is the short operating guide; [CONTRIBUTING.md](./CONTRIBUTING.md)
has the commands and conventions.

## Current state

v0 — the interface skeleton — plus the first slice of v0.1: `apps/server`, a loopback-only Hono API
over a local SQLite database, a Budapest programme import, and a worker that keeps a rolling window
of months fresh on a schedule. There is still no authentication, no notification and no
ticket-availability tracking. The packages are `apps/web`, `apps/server` and `packages/contracts`
(the Zod schemas both sides share).

## Commands

```sh
pnpm install
pnpm dev
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test:e2e
```

## Boundaries to respect

1. **The browser talks only to its own origin.** No request from `apps/web` to a ticket site,
   Telegram, an AI provider, a map provider or a font CDN. Lint blocks
   `fetch`/`XMLHttpRequest`/`WebSocket` everywhere in `apps/web/src` except
   `shared/api/client.ts`, the single same-origin `/api/` boundary, and
   `tests/e2e/no-external-requests.spec.ts` fails if any request leaves the origin. Do not weaken
   either check: an external source belongs on the server.
2. **Only the worker reaches a source.** `apps/server/src/worker.ts` is the one process that
   makes outbound requests, and every one goes through `requests.ts`, which reserves its slot in
   the database before the call, counts failed attempts too, and stays paused across restarts. The
   API queues work; it never fetches. Never call a source directly, and never add a retry loop
   around a refusal.
3. **The schedule is data, not a timer.** Due times, pauses and failure counts live in the
   database; the ticker only wakes up and asks what is due. A gap must coalesce into one run, so
   the next due time is measured from when a run finished, never from when it was due. Nothing
   about the schedule may depend on the process having been alive.
4. **No fabricated data or fabricated success.** Empty states say what is missing. A button that
   needs an account is disabled and states the reason. Sample data belongs in tests: a fixture is
   never seeded into the real database.
5. **An import never destroys what it cannot see.** A parse failure leaves the catalogue as it was
   and records the reason; a record missing from a page is not treated as cancelled.
6. **A module wires itself in one place.** `src/modules/registry.ts` feeds navigation, page search
   and the visibility preference. Adding a page means adding a route file and a registry entry.
7. **State that belongs in the address stays there.** Filters and the calendar month are search
   parameters validated by a Zod schema per route; unvalidated parameters are dropped by the router.
8. **Localisation is complete or it is not done.** Every user-visible string exists in EN, RU and DE,
   including accessible names and empty states. A unit test compares the key sets.
9. **Accessibility is part of the change**, not a follow-up: keyboard path, visible focus, correct
   roles and names. axe scans catch mechanical problems only.
10. **Dates.** Day-level dates are not turned into UTC midnights; times of day are 24-hour.

## When something does not fit

Say so in the pull request instead of stretching what is there: the next steps (plan §10) are
household accounts, then one complete ticket-monitoring scenario, in that order.
