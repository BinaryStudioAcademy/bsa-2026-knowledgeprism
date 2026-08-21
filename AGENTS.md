# KnowledgePrism — Agent Guide

KnowledgePrism is an AI-driven application that helps teams build a single,
structured project Knowledge Base out of documents (PDF, later TXT) and
manual input. The core loop: AI proposes structured knowledge from a source,
a human validates it, the system integrates it against the existing
Knowledge Base (new / update / duplicate / conflict), a human approves the
integration, and only then does it land in the Knowledge Base. AI proposes,
the user validates, the system integrates, the user approves — never skip a
step in that chain when reasoning about the domain.

This is an early-stage monorepo (starter scaffolding only — most business
logic below is still to be built). Treat the architecture in this file as
the target design, not a guarantee that every piece already exists; check
the actual code before assuming a module is implemented.

## Agent Operating Rule: Research, Don't Write Code

AI agents working in this repository must **not** write, edit, or commit
production code (this excludes throwaway commands you run yourself to
inspect state, e.g. `grep`/`find`/`cat` while researching). This applies
regardless of how the request is phrased — "implement", "fix", "add",
"refactor", "just do it", etc. all fall under this rule. Instead, for any
request that would normally result in a code change, respond with:

1. **Research** — what you found in the codebase relevant to the request:
   files, modules, existing patterns, and any constraints from this
   AGENTS.md or the linked spec that bear on the approach.
2. **References** — links to the relevant files/lines in this repo
   (`path:line`), and to any external docs (library APIs, RFCs) that
   justify the approach.
3. **Code snippets** — illustrative, non-applied snippets showing the
   suggested change (diff-style or fenced code blocks are fine). Do not
   write these into the working tree — present them in your response only,
   for a human to review and apply.

If asked to run tests, lint, or other read-only/verification commands,
that's fine — the restriction is on producing or persisting code changes,
not on investigation. If a task is ambiguous about whether it wants an
implementation or a recommendation, default to treating it as a request
for research and a proposal, and say so explicitly rather than guessing.

## Repository Structure

npm workspaces monorepo, TypeScript everywhere.

```
apps/
  web/      — React frontend (Vite)
  api/      — Fastify backend (REST API, auth, business logic)
  worker/   — background jobs: document parsing, AI extraction, embeddings, and integration
packages/
  types/      — shared TypeScript types and DTOs
  schemas/    — shared validation schemas
  config/     — shared config contracts, exceptions, helpers
  constants/  — shared enums and constants
```

Apps/packages that have feature modules group them under `modules/<name>`
(e.g. `modules/auth`, `modules/users`). Backend and worker modules follow a
routes/controllers → services → repositories → schemas/types layering.

## Tech Stack

- **Frontend**: React 19, TypeScript, React Router, Redux Toolkit + React
  Redux, React Hook Form, Vite. (Target design also calls for TanStack
  Query, Zod, and BlockNote for the block-based Knowledge Base editor —
  not all present yet.)
- **Backend**: Node.js, TypeScript, Fastify, Knex + Objection (Postgres),
  Argon2 for password hashing, Pino for logging, Swagger for API docs.
- **Worker**: Node.js/TypeScript. Target design: pdfjs-dist for PDF parsing,
  a self-hosted Qwen LLM + BGE-M3 embedding model served via vLLM (with AWS
  Bedrock — Claude + Cohere Multilingual — as a cheaper serverless MVP
  alternative), pgvector for embedding storage/search.
- **Infra (target)**: PostgreSQL (18.4) + pgvector, S3 (file storage),
  SQS (async job queue), ECS Fargate, CloudFront, all behind AWS.

## Domain Model (target design — see `apps/api/src/infrastructure/database/migrations` for what's actually migrated)

Tenancy & access: `organisations`, `users`, `projects`, `project_members`
(roles: ADMIN / EDITOR / VIEWER).

Document pipeline: `documents`, `document_blocks`, `extraction_runs`,
`extraction_items`. Documents move through a state machine:
`UPLOADED → PROCESSING → PARSED → EXTRACTING → EXTRACTED →
WAITING_FOR_VALIDATION → VALIDATED → INTEGRATING → WAITING_FOR_APPROVAL →
APPROVED → COMPLETED`, with `FAILED` reachable (and retryable via SQS) from
any state.

Validation & integration: `validation_runs`, `validation_items`,
`integration_runs`, `integration_changes`. Integration proposals are one of
`NEW` / `UPDATE` / `DUPLICATE` / `CONFLICT`.

Knowledge: `knowledge_nodes`, `knowledge_node_versions`,
`knowledge_sources`, `knowledge_relationships` (`PART_OF` / `RELATED_TO` /
`DEPENDS_ON` / `CONTRADICTS` / `SUPERSEDES`), `knowledge_embeddings`.

Ask Prism (RAG Q&A): `conversations`, `conversation_messages` — assistant
messages store `retrieved_knowledge_ids` for traceability. If BGE-M3/the
retriever finds nothing sufficiently relevant, the backend must not let the
LLM improvise — it should return "Not found in the knowledge base" instead
of hallucinating.

Governance: `audit_logs`.

**Four data states are never mixed**: (1) raw source, (2) AI proposal /
extraction items, (3) validated knowledge (user accepted/edited),
(4) approved knowledge in the official Knowledge Base. Keep this separation
intact in any code that touches the pipeline.

## Roles & Permissions

| Capability                      | Admin | Editor | Viewer |
| ------------------------------- | ----- | ------ | ------ |
| Manage organisation & users     | ✓     | –      | –      |
| Create / delete projects        | ✓     | –      | –      |
| View knowledge                  | ✓     | ✓      | ✓      |
| Edit knowledge                  | ✓     | ✓      | –      |
| Add knowledge (upload / manual) | ✓     | ✓      | –      |
| Validate extraction             | ✓     | ✓      | –      |
| Approve integration             | ✓     | ✓      | –      |
| Ask Prism                       | ✓     | ✓      | ✓      |

Authorization must always be checked along the full chain: User →
Organisation → Project → Membership → Role → Permission. Never trust a
`projectId` supplied by the client without verifying membership server-side.

## Conventions

- File/directory names: kebab-case / lowercase (`.ls-lint.yml` enforces
  `([.a-z0-9]*)([-.][a-z0-9]+)*`), except DB migrations under
  `apps/api/src/infrastructure/database/migrations`, which are snake_case.
- Commit messages: Conventional Commits, format
  `type: description kp-<issue-number>` where `type` is one of build,
  chore, ci, docs, feat, fix, perf, refactor, revert, style, test (see
  `project.config.ts`, `commitlint.config.ts`, `dangerfile.ts`). PR scope
  must be one of the workspace names (`web`, `api`, `worker`, `types`,
  `schemas`, `config`, `constants`).
- Branch naming: `<issue-number>-<type>-<description>` or the `main`
  environment branch (see `dangerfile.ts`).
- PRs require an assignee, a label, and a milestone (Danger enforces this).

## Code Quality Rules

Distilled from the BSA JS/TS style guide — the ten with the most
practical effect on this codebase:

- **No `any`.** Prefer `unknown` with narrowing; `any` defeats the type
  system this repo otherwise relies on.
- **No dead code.** Remove unused files, modules, and commented-out code
  rather than leaving them in the tree.
- **No unused dependencies.** Keep `package.json` dependency lists trimmed
  to what's actually imported (`knip.config.ts` enforces this at the repo
  level; see per-workspace `ignoreDependencies` for known exceptions like
  `pg`).
- **No `index` files except as an app/package entry point.** Re-export
  barrels obscure where things actually live; import from the concrete
  module path.
- **DRY.** If the same logic is repeated across modules, extract it into a
  shared module (e.g. `packages/*` for cross-app reuse, a local helper for
  in-app reuse) instead of copy-pasting.
- **Split long functions/methods into smaller ones.** A function or method
  that's grown to handle multiple concerns should be broken up by concern.
- **No magic values.** Replace inline literals with a named constant that
  explains what the value means.
- **Group related constants into enums/const objects** instead of scattering
  standalone constants of the same kind (e.g. status strings, action types).
- **Modules don't export mutable variables.** Export values that are
  computed once, not `let` bindings that change after export.
- **Code matches the linter, and lint rules are never disabled inline.**
  `npm run lint` (ESLint/Stylelint/Prettier) must pass clean with no
  `eslint-disable` escape hatches added to work around it.

## Common Commands (run from repo root unless noted)

```bash
npm run build            # build packages, then api, worker, web in order
npm run lint              # editor/fs/type/js/format/trash checks, plus each workspace's own lint
npm run format            # prettier --write

npm run start:dev -w apps/api     # Fastify dev server (tsx watch)
npm run start:dev -w apps/web     # Vite dev server
npm run start:dev -w apps/worker  # worker dev process

npm run migrate:dev -w apps/api        # run latest Knex migrations
npm run migrate:dev:make -w apps/api   # create a new migration
```

Shared packages (`packages/*`) must be built (`npm run build:packages`)
before `apps/api`/`apps/worker`/`apps/web` will resolve `@knowledgeprism/*`
imports to fresh output — they are consumed from each package's `build/`
directory, not built on the fly by the consuming app.

## Where to Look Next

- [readme.md](readme.md) — setup requirements and links.
