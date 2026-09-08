# One image, two commands: the API (which also serves the built web app) and
# the worker. They share a database file on a volume, so they must be the same
# build — a schema the worker writes and the API cannot read is not a state
# worth being able to reach.
FROM node:22.20.0-slim AS build
WORKDIR /app
ENV CI=true
RUN corepack enable
# Manifests first, so a source-only change reuses the installed layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @allet/web build

FROM node:22.20.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# The server runs its TypeScript through tsx, which is a runtime dependency,
# so the install is kept whole rather than pruned to a build output.
COPY --from=build /app /app
# Written to by both services; declared so a stray container cannot start with
# the database on the image's own writable layer, where a redeploy loses it.
VOLUME /data
RUN mkdir -p /data && chown node:node /data
ENV ALLET_DB=/data/allet.db \
    ALLET_STATIC=./apps/web/dist \
    ALLET_HOST=0.0.0.0 \
    PORT=3001
USER node
EXPOSE 3001
# tsx is invoked through node directly: pnpm is not installed in this stage,
# and corepack would want the network to fetch it.
CMD ["node", "apps/server/node_modules/tsx/dist/cli.mjs", "apps/server/src/index.ts"]
