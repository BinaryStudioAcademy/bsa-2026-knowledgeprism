# syntax=docker/dockerfile:1

# This Dockerfile must be built with the monorepo root as the build context, e.g.:
#   docker build -f apps/api/Dockerfile -t knowledgeprism-api .
#
# It installs npm workspace dependencies (so the @knowledgeprism/* packages
# resolve correctly) and runs the API with `tsx`, matching how the API is
# already run in development (see apps/api/package.json "start:dev"). This
# sidesteps the fact that the workspace packages currently publish their
# `main` entry point as TypeScript source rather than compiled JS, which
# plain `node` cannot resolve at runtime — `tsx` resolves it the same way
# it does locally.

FROM node:24-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
# Root manifest and TS project files (packages/*/tsconfig.build.json extend
# these, so they must be present for each package's "postinstall" build).
COPY package.json package-lock.json .npmrc .nvmrc tsconfig.json packages.d.ts ./
# Full workspace package sources are required because each @knowledgeprism/*
# package has a "postinstall" script that compiles it with tsc.
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --include-workspace-root -w apps/api

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/packages ./packages
COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "src/app/index.ts"]
