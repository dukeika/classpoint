# Current State (Dev)

Last updated: 2026-01-04

## Environment
- Active env: `dev` (AWS account via profile `Future-Logix-CP`)
- Region: `us-east-1`
- Domain: `classpoint.ng` (Route 53 hosted zone attached)
- Auth: Cognito Hosted UI on `https://auth.classpoint.ng`

## Routing and Tenancy
- HQ host: `app.classpoint.ng` (HQ-only)
- Tenant hosts: `{slug}.classpoint.ng` (tenant-only)
- Redirect rules (middleware + CloudFront forwarded host):
  - Root domain redirects to HQ host.
  - HQ host blocks tenant-only paths and redirects to `/platform`.
  - Tenant hosts block HQ-only paths and redirect to `/`.
- Auth callbacks:
  - Callback: `https://{slug}.classpoint.ng/auth/callback`
  - Logout: `https://{slug}.classpoint.ng/`

## Hosting
- Frontend: Next.js SSR/Edge via OpenNext on CloudFront.
- Static assets served from S3 (`/_assets`), SSR via Lambda.
- WAF + rate limits attached to CloudFront (baseline + tenant-specific rules).
- CloudFront invalidations created on deploy for `_next/*` and `/BUILD_ID`.

## Known Issues
- `https://app.classpoint.ng/platform` returns 404 after deploy (routing works, route exists in repo, but deployed bundle does not serve it). Needs redeploy investigation.
- Windows OpenNext build fails on `esbuild` spawn; use WSL for `npm run build:ssr`.

## Auth / Tenants
- Cognito Hosted UI configured for HQ + tenant callbacks.
- Example tenants in dev: `demo`, `ph-school` (credentials not stored in repo).
- Tenant isolation smoke tests: `scripts/tenant-isolation-smoke.js` (uses `JWT_ADMIN_A`/`JWT_LIMITED_A` env vars).

## Build + Deploy (Web)
- Build in WSL: `apps/web` -> `npm run build:ssr` (produces `.open-next`).
- Deploy from Windows: `npx cdk deploy ClasspointWebStack-dev --profile Future-Logix-CP`.
- Do not commit build artifacts: `.open-next`, `.next`, `cdk.out*` are gitignored.

## Repo
- GitHub: `https://github.com/dukeika/classpoint`
- Local secrets: `apps/web/.env.local` only; stored outside Git.
