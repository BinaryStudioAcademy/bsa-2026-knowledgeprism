# Deployment

Pushing to `development` triggers two independent GitHub Actions workflows,
each scoped to its own part of the app via `paths:` filters. Both can also be
run manually (`workflow_dispatch`) from the Actions tab, regardless of what
changed.

```
GitHub Push (development)
       │
       ├──► apps/web/** changed ──► Deploy Frontend  → Build React → S3 Bucket ◄── CloudFront CDN ◄── Users
       │
       └──► apps/api/** changed ──► Deploy Backend   → Build Fastify Docker → ECR → ECS Fargate ◄── ALB ◄── Users
```

- **`.github/workflows/deploy-frontend.yml`** — triggers on push to
  `development` when `apps/web/**` or `packages/**` change. Builds
  `apps/web` with Vite, syncs `apps/web/build` to S3, then invalidates the
  CloudFront distribution in front of it.
- **`.github/workflows/deploy-backend.yml`** — triggers on push to
  `development` when `apps/api/**` or `packages/**` change. Builds
  `apps/api/Dockerfile` (context: repo root), pushes the image to ECR as
  both `:latest` and `:<commit-sha>`, then forces a new ECS Fargate
  deployment via `aws ecs update-service --force-new-deployment`.

Both jobs authenticate to AWS using static IAM user credentials
(`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets), not GitHub OIDC.

> **Path filters and manual runs:** because both workflows use `paths:`,
> a push to `development` that only touches `.github/workflows/**` or docs
> will **not** trigger them. Use "Run workflow" (`workflow_dispatch`) in the
> Actions tab to run either pipeline on demand, e.g. to test after changing
> workflow files themselves or if you need to force a redeploy without
> touching app code.

> **The backend deploy assumes the ECS task definition's container image is
> pinned to `:latest`.** `update-service --force-new-deployment` restarts
> the service using whatever image tag the current task definition already
> references — it does not register a new task definition revision. If the
> task definition is pinned to a specific tag/digest instead of `:latest`,
> this workflow will silently redeploy the _old_ image. Confirm the task
> definition's container image is `<ecr-repo>:latest` before relying on this.

## AWS resources you need to provision first

These workflows do not create infrastructure — they deploy into
infrastructure that already exists. You need:

1. **S3 bucket** for the built SPA (private bucket + CloudFront Origin
   Access Control is preferred over public static website hosting).
2. **CloudFront distribution**
   - Origin 1: the S3 bucket above (default behavior, serves the SPA).
   - Origin 2: the ALB in front of ECS, with a behavior/path pattern for
     `/api/*` forwarded to it. This is required because the web app calls
     the API with a relative path (`VITE_APP_API_ORIGIN_URL=/api/v1`, see
     `apps/web/.env.example`) — the SPA expects the API to be reachable on
     the same origin it's served from.
   - A custom error response mapping 403/404 → `/index.html` with HTTP 200
     so client-side routing (`react-router-dom`) works on refresh/deep links.
3. **ECR repository** for the API image.
4. **ECS cluster + Fargate service + task definition** for `apps/api`.
   - Task definition's container image should be `<ecr-repo>:latest` (see
     warning above).
   - Container port should be `3001` (the API's default `PORT`, see
     `apps/api/.env.example`), and must match the ALB target group port.
   - Task execution role needs `ecr:GetDownloadUrlForLayer`,
     `ecr:BatchGetImage`, `ecr:GetAuthorizationToken`, and CloudWatch Logs
     permissions.
   - The API reads its configuration entirely from environment variables
     (see `apps/api/src/infrastructure/config/base-config.module.ts`) —
     inject `NODE_ENV`, `HOST=0.0.0.0`, `PORT=3001`, `DB_CONNECTION_STRING`,
     `DB_DIALECT`, `DB_POOL_MIN`, `DB_POOL_MAX`, `AWS_REGION` via the task
     definition (plain env vars, or `secrets` sourced from Secrets
     Manager/SSM for anything sensitive, e.g. `DB_CONNECTION_STRING`).
5. **Application Load Balancer** with a target group of type `ip` (Fargate),
   health check path `/health`, matching the health check baked into
   `apps/api/Dockerfile`.
6. **IAM user** with an access key pair, scoped to a policy granting: S3
   read/write on the web bucket, `cloudfront:CreateInvalidation` on the
   distribution, ECR push permissions, and
   `ecs:UpdateService`/`ecs:DescribeServices` on the cluster/service.
   Static access keys do not expire on their own and should be rotated
   periodically; GitHub OIDC role assumption is a more secure alternative
   if this pipeline is revisited later.

## Required GitHub configuration

Set these under the repository's **Settings → Secrets and variables →
Actions**.

### Secrets

| Name                    | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | IAM user access key ID used by both workflows.     |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret access key used by both workflows. |

### Variables

Currently configured (see repository Settings → Variables):

| Name                         | Example value                         | Used by                                                 |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------- |
| `AWS_REGION`                 | `eu-west-3`                           | both                                                    |
| `AWS_ACCOUNT_ID`             | `632291707800`                        | (available; not directly referenced in either workflow) |
| `ECR_REPOSITORY`             | `knowledgeprism-backend`              | backend                                                 |
| `ECS_CLUSTER`                | `knowledgeprism-cluster`              | backend                                                 |
| `ECS_SERVICE`                | `knowledgeprism-api-service-9rkq453k` | backend                                                 |
| `S3_BUCKET`                  | `knowledgeprism-frontend`             | frontend                                                |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E2WX77HO0FCTMV`                      | frontend                                                |

`ECR_REPOSITORY` and `ECS_CLUSTER` currently share the same value
(`knowledgeprism-backend`). An ECR repository and an ECS cluster are
different resource types — double check in the AWS console that this isn't
a copy-paste mistake, since a wrong cluster name would make
`aws ecs update-service` fail with a "cluster not found" error rather than
silently doing the wrong thing.

## Notes on the API Docker image

`apps/api/Dockerfile` must be built with the **monorepo root** as build
context (`docker build -f apps/api/Dockerfile .`), since it needs the npm
workspace root manifest and the shared `@knowledgeprism/*` packages. The
GitHub Actions job already does this.

The image runs the API with `tsx` (same as `npm run start:dev` locally)
rather than the compiled `build` output. This is because the workspace
packages (`packages/config`, `packages/constants`, `packages/schemas`,
`packages/types`) declare `main` as their TypeScript source rather than
compiled JS, so plain `node` cannot resolve them at runtime — only a
TS-aware loader can. If this is undesirable for production, the fix is to
point each package's `main`/add `exports` at its own `build/` output; that
is a repo-wide change outside the scope of this pipeline and was not made
here.
