# syntax=docker/dockerfile:1

# This Dockerfile must be built with the monorepo root as the build context, e.g.:
#   docker build -f apps/api/Dockerfile -t knowledgeprism-api .
#
# The @knowledgeprism/* workspace packages publish their `main`/`types`
# entry point as TypeScript source (e.g. "main": "src/constants.ts"), which
# plain `node` cannot resolve at runtime. Rather than changing that in the
# repo (which would make `tsx`/`vite` dev servers pick up stale compiled
# output instead of live-editing package source), this build:
#   1. Compiles each package to its own build/ directory (via "postinstall").
#   2. Compiles apps/api to build/ with `npm run build`.
#   3. Rewrites each package's `main` to point at its compiled build/*.js
#      — only inside this image, via `npm pkg set`, never committed to the
#      repo — so the compiled apps/api/build output can be run with plain
#      `node` in the final, dependency-light runner stage.

FROM node:24-slim AS base
WORKDIR /app

FROM base AS deps
# Root manifest and TS project files (packages/*/tsconfig.build.json extend
# these, so they must be present for each package's "postinstall" build).
COPY package.json package-lock.json .npmrc .nvmrc tsconfig.json packages.d.ts ./
# Full workspace package sources are required because each @knowledgeprism/*
# package has a "postinstall" script that compiles it with tsc.
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci

FROM deps AS builder
COPY apps/api ./apps/api
RUN npm run build -w apps/api
# Point each package's runtime entry at its compiled output so plain `node`
# can resolve `@knowledgeprism/*` imports from the compiled apps/api/build.
# This only mutates package.json inside this build stage/image.
RUN for pkg in constants types schemas config; do \
		npm pkg set main="build/${pkg}.js" -w "packages/${pkg}"; \
	done

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/build ./apps/api/build
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx knex migrate:latest --knexfile ./build/knexfile.js && exec node build/src/app/index.js"]
