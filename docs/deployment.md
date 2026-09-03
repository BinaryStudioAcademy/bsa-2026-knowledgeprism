# Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs two
independent jobs:

```
GitHub Push (main)
       │
       ├──► Build React → S3 Bucket ◄── CloudFront CDN ◄── Users
       │
       └──► Build Fastify Docker → ECR → ECS Fargate ◄── ALB ◄── Users
```

- **deploy-web** builds `apps/web` with Vite and syncs the output to an S3
  bucket, then invalidates the CloudFront distribution in front of it.
- **deploy-api** builds `apps/api/Dockerfile` (context: repo root), pushes
  the image to ECR, and rolls out a new ECS Fargate task revision behind an
  Application Load Balancer.

Both jobs authenticate to AWS via GitHub OIDC (no long-lived access keys are
stored in the repository).

## AWS resources you need to provision first

This workflow does not create infrastructure — it deploys into infrastructure
that already exists. You need:

1. **S3 bucket** for the built SPA (static website hosting or, preferably,
   private bucket + CloudFront Origin Access Control).
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
   - Container name in the task definition must match `ECS_CONTAINER_NAME`.
   - Container port should be `3001` (the API's default `PORT`, see
     `apps/api/.env.example`), and must match the ALB target group port.
   - Task execution role needs `ecr:GetDownloadUrlForLayer`,
     `ecr:BatchGetImage`, `ecr:GetAuthorizationToken`, and CloudWatch Logs
     permissions.
   - The API reads its configuration entirely from environment variables
     (see `apps/api/src/infrastructure/config/base-config.module.ts`) —
     inject `NODE_ENV`, `HOST=0.0.0.0`, `PORT=3001`, `DB_CONNECTION_STRING`,
     `DB_DIALECT`, `DB_POOL_MIN`, `DB_POOL_MAX`, `AWS_REGION` via the task
     definition (plain env vars or `secrets` sourced from Secrets
     Manager/SSM for anything sensitive, e.g. `DB_CONNECTION_STRING`).
5. **Application Load Balancer** with a target group of type `ip` (Fargate),
   health check path `/health`, matching the health check baked into
   `apps/api/Dockerfile`.
6. **IAM role for GitHub OIDC** trusted by
   `token.actions.githubusercontent.com`, scoped to this repository, with
   permissions for: S3 (read/write the web bucket), CloudFront
   (`CreateInvalidation`), ECR (push), and ECS
   (`DescribeTaskDefinition`, `RegisterTaskDefinition`, `UpdateService`,
   `DescribeServices`, plus `iam:PassRole` for the task/execution roles).

## Required GitHub configuration

Set these under the repository's **Settings → Secrets and variables →
Actions**.

### Secrets

| Name                         | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN`        | IAM role the workflow assumes via OIDC.                                 |
| `WEB_S3_BUCKET_NAME`         | S3 bucket the built web app is synced to.                               |
| `CLOUDFRONT_DISTRIBUTION_ID` | Distribution to invalidate after each web deploy.                       |
| `ECR_REPOSITORY_NAME`        | ECR repository name for the API image.                                  |
| `ECS_CLUSTER_NAME`           | ECS cluster running the API service.                                    |
| `ECS_SERVICE_NAME`           | ECS service to update.                                                  |
| `ECS_TASK_DEFINITION_FAMILY` | Task definition family to read/render (e.g. `knowledgeprism-api`).      |
| `ECS_CONTAINER_NAME`         | Container name inside the task definition to update with the new image. |

### Variables

| Name                      | Description                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `AWS_REGION`              | Region for all AWS CLI/actions calls (e.g. `eu-north-1`).                                                                              |
| `VITE_APP_API_ORIGIN_URL` | Baked into the web build. Use `/api/v1` if CloudFront routes `/api/*` to the ALB (see above); otherwise the ALB/API's absolute origin. |

None of these are set yet — the workflow will fail on first run until they
are configured.

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
