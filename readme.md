# Knowled# bsa-2026-knowledgeprism

An AI-driven application that helps teams organize their knowledge base.

## 1. Introduction

### 1.1 Useful Links

- Pay attention, that we have certain [quality criteria](https://github.com/BinaryStudioAcademy/quality-criteria/blob/production/src/javascript.md), which we should follow during application development.

TODO: Add development deployment link

## 2. Domain

Knowledgeprism is an AI-driven application that helps teams with organizing their knowledge base.

## 3. Requirements

- [NodeJS](https://nodejs.org/en) (24.x.x);
- [npm](https://www.npmjs.com/) (11.x.x);
- [PostgreSQL](https://www.postgresql.org/) (18.4)

## 4. Database Schema

TODO: add database schema

## 5. Architecture

TODO: add application schema

### 5.1 Global

#### 5.1.1 Technologies

1. [Typescript](https://www.typescriptlang.org/)
2. [npm workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)

#### 5.1.2 Apps & Packages

- `apps/web` — the frontend application
- `apps/api` — the backend application
- `apps/worker` — background jobs, parsing, and AI processing
- `packages/types` — shared TypeScript types and DTOs
- `packages/schemas` — shared validation schemas
- `packages/config` — shared config contracts, exceptions and helpers
- `packages/constants` — shared enums and constants

Each app and package that has feature modules groups them under `modules/<name>`
(e.g. `modules/users`, `modules/auth`). Every app and every module has an
`AGENTS.md` describing conventions specific to it.

### 5.2 Web App (`apps/web`)

#### 5.2.1 Technologies

1. [React](https://react.dev/) — a frontend library
2. [Redux](https://redux.js.org/) + [Redux Toolkit](https://redux-toolkit.js.org/) — a state manager

#### 5.2.2 Folder Structure

1. `app` - app entrypoint, root component and router
2. `modules` - separate app features or functionalities, each split into

   2.1 `components` - feature-specific react components

   2.2 `hooks` - feature-specific hooks

   2.3 `models` - feature-specific types

   2.4 `api` - feature-specific HTTP requests

   2.5 `state` - feature-specific store slices

   2.6 `utils` - feature-specific helpers

3. `components` - global, truly shared react components (buttons, inputs, etc.)
4. `api` - shared HTTP infrastructure
5. `hooks` - global hooks
6. `lib` - shared libraries and utilities (config, http, storage, store, enums, types)
7. `styles` - global styles
8. `assets` - static assets (images)

### 5.3 API (`apps/api`)

#### 5.3.1 Technologies

1. [Fastify](https://fastify.dev/) — a backend framework
2. [Knex](https://knexjs.org/) — a query builder
3. [Objection](https://vincit.github.io/objection.js/) — an ORM

#### 5.3.2 Folder Structure

1. `app` - app entrypoint
2. `modules` - separate app features or functionalities, each split into

   2.1 `controllers`

   2.2 `services`

   2.3 `repositories`

   2.4 `models`

   2.5 `schemas`

   2.6 `mappers`

3. `infrastructure` - shared infrastructure (config, controller, database, http, logger, server-application), including `infrastructure/database/migrations`
4. `shared` - cross-cutting enums, exceptions and types

### 5.4 Worker (`apps/worker`)

Handles background jobs: source parsing, chunking, embeddings and AI processing.
Currently a scaffold with no implemented functionality.

#### 5.4.1 Folder Structure

1. `modules` - separate app features or functionalities (`documents`, `sources`, `knowledge`, `search`)
2. `jobs` - background job definitions
3. `parsers` - source/document parsers
4. `embeddings` - embedding generation
5. `ai` - AI/LLM integrations for processing
6. `integrations` - third-party integrations

### 5.5 Shared Packages

#### 5.5.1 Reason

As we are already using js on both frontend and backend it would be useful to share some contracts and code between them.

#### 5.5.2 Technologies

1. [Zod](https://github.com/colinhacks/zod) — a schema validator

## 6. How to Run

### 6.1 Manually

1. Create and fill all .env files. These files are:

- apps/web/.env
- apps/api/.env

You should use .env.example files as a reference.

1. Install dependencies: `npm install`.

2. Install pre-commit hooks: `npx simple-git-hooks`. This hook is used to verify code style on commit.

3. Run database. You can run it by installing postgres on your computer.

4. Apply migrations: `npm run migrate:dev -w apps/api`

5. Run api: `npm run start:dev -w apps/api`

6. Run web: `npm run start:dev -w apps/web`

7. Run worker (optional, scaffold only): `npm run start:dev -w apps/worker`

## 7. Development Flow

### 7.1 Pull Request Flow

```
<type>: <ticket-title> <project-prefix>-<issue-number>
```

For the full list of types check [Conventional Commits](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional)

Examples:

- `feat: add dashboard screen kp-123`

### 7.2 Branch Flow

```
<issue-number>-<type>-<short-desc>
```

Examples:

- `123-feat-add-dashboard`
- `12-feat-add-user-flow`
- `34-fix-user-flow`

### 7.3 Commit Flow

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0) to handle commit messages

```
<type>: <description> <project-prefix>-<issue-number>
```

Examples:

- `feat: add dashboard component kp-45`
- `fix: update dashboard card size kp-212`

## 8. Deployment

CI/CD implemented using [GitHub Actions](https://docs.github.com/en/actions)
