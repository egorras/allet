# Working in this repository

Read [ALLET_PLAN.md](./ALLET_PLAN.md) first: it defines what Allet is, what v0 includes, and what is
deliberately left out. This file is the short operating guide; [CONTRIBUTING.md](./CONTRIBUTING.md)
has the commands and conventions.

## Current state

v0 — the interface skeleton. There is no server, no database, no authentication, no collector and no
external integration. `apps/web` is the only package.

## Commands

```sh
pnpm install
pnpm dev
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test:e2e
```

## Boundaries to respect

1. **Nothing leaves the app.** No request to a ticket site, Telegram, an AI provider, a map provider
   or a font CDN. Lint blocks `fetch`/`XMLHttpRequest`/`WebSocket` in `apps/web/src`, and
   `tests/e2e/no-external-requests.spec.ts` fails if any request leaves the origin. Do not weaken
   either check to make a feature work; propose the server step instead.
2. **No fabricated data or fabricated success.** Empty states say what is missing. A button that
   needs a server is disabled and states the reason. Sample data belongs in tests.
3. **A module wires itself in one place.** `src/modules/registry.ts` feeds navigation, page search
   and the visibility preference. Adding a page means adding a route file and a registry entry.
4. **State that belongs in the address stays there.** Filters and the calendar month are search
   parameters validated by a Zod schema per route; unvalidated parameters are dropped by the router.
5. **Localisation is complete or it is not done.** Every user-visible string exists in EN, RU and DE,
   including accessible names and empty states. A unit test compares the key sets.
6. **Accessibility is part of the change**, not a follow-up: keyboard path, visible focus, correct
   roles and names. axe scans catch mechanical problems only.
7. **Dates.** Day-level dates are not turned into UTC midnights; times of day are 24-hour.

## When something does not fit

Say so in the pull request instead of stretching the skeleton: the next versions (plan §10) add the
server, real users, one complete ticket scenario and so on, in that order.
