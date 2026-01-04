ClassPoint AI Build Guidelines (Secure-by-Default)

1. AWS access model (non-negotiable)

Goal: the AI can build and deploy, but can’t accidentally destroy, leak data, or open the internet to your database.

1.1 Separate AWS accounts

Use AWS Organizations with 3 accounts minimum: dev, staging, prod.

AI gets access to dev + staging. Prod access is read-only except for explicitly allowed deploy roles (see below).

1.2 Roles only, no long-lived keys

AI must assume IAM roles (STS) with short-lived credentials.

No IAM user access keys. Ever.

Enforce Permission Boundaries on all roles the AI uses.

1.3 “Deployment roles” with guardrails

Create 2 roles:

AI-BuildRole (dev/stage): broad enough to build, but still bounded.

AI-DeployRole (prod): only allowed to deploy from CI/CD (no ad-hoc console changes).

Add these guardrails:

Explicit deny for destructive actions in prod (e.g., Delete*, Terminate*, Remove*, Detach*, PutBucketPolicy except approved buckets, etc.)

Deny setting Security Group inbound 0.0.0.0/0 except ports 80/443 on ALB/CloudFront/WAF paths.

Deny making S3 buckets public.

Deny disabling CloudTrail/Config/GuardDuty.

1.4 Logging & monitoring must be ON before anything else

Before building:

Enable CloudTrail (all regions), AWS Config, GuardDuty, Security Hub.

Enable Access Analyzer for IAM.

Turn on centralized logging (CloudWatch logs + alarms).

2. What the AI is allowed to do in AWS
   Allowed (with discipline)

Create/modify resources via Infrastructure as Code only (CDK/Terraform/CloudFormation).

Deploy through CI/CD pipelines (preferred) or controlled scripts.

Create least-privilege IAM roles/policies only for the app.

Forbidden by default

Manual console edits in prod.

Deleting prod resources.

Creating public databases, open security groups, public S3 buckets.

Storing secrets in code, environment files, logs, or client apps.

Copying prod customer data into dev/staging.

3. Change workflow the AI must follow (every time)

For every change, the AI must do this sequence:

Plan

Describe intended change, impacted services, rollback approach.

Estimate blast radius (single tenant vs all tenants).

Implement

Change IaC + app code in small commits.

Keep changes idempotent.

Verify

Run: lint + typecheck + unit tests + integration tests.

Deploy to dev → run smoke tests.

Promote to staging → run regression tests.

Release

Only then deploy to prod using approved pipeline role.

Post-deploy checks: health endpoints, logs, alarms, synthetic tests.

Rollback

Must have a rollback path (previous artifact, feature flag off, DB migration reversal strategy).

4. Code correctness rules (no “works on my machine”)
   4.1 Definition of Done for any feature

A feature is not “done” until:

Compiles without warnings (TypeScript strict / backend strict mode).

Lint passes (ESLint) + formatting passes (Prettier).

Unit tests added for core logic.

Integration tests cover API + auth + tenant isolation.

Error handling added (no silent failures).

Logs are structured and include requestId + schoolId (where applicable).

No secrets in logs.

4.2 Required automated checks in CI/CD

Typechecking (TS strict)

Unit tests

Integration tests

Dependency vulnerability scan (e.g., Snyk/OWASP)

IaC scan (e.g., Checkov/cfn-nag)

Secret scan (detect leaked keys)

4.3 Error handling standard

Every API call must return:

consistent error shape: { code, message, requestId }

user-safe messages (no stack traces)

Retries only for retryable errors with backoff.

Validate all inputs server-side (zod/joi).

5. Security rules for ClassPoint specifically (multi-tenant SaaS)
   5.1 Tenant isolation is sacred

Every record includes schoolId.

Every query must be scoped by schoolId in the resolver/service layer, not only in the UI.

Auth token must include custom:schoolId (or equivalent) and the backend must enforce:

request.schoolId === token.schoolId

Add automated tests:

“School A cannot read School B invoices even by ID guess”

“Parent cannot access another parent’s child”

5.2 Role-based access control (RBAC)

Enforce permissions server-side (not just hiding buttons).

Default deny: if no permission, access is blocked.

Sensitive operations require elevated roles:

fee adjustments, refunds, result publishing, role changes

5.3 Secrets management

Use AWS Secrets Manager for secrets.

Use SSM Parameter Store for non-secret config.

Never embed secrets in frontend builds.

5.4 Data protection

Encrypt data at rest (KMS) and in transit (TLS everywhere).

PII minimization: store only what you need.

NDPR: provide export + deletion workflow (admin-controlled).

6. AWS architecture guardrails
   6.1 Networking

Put compute + DB in private subnets.

Only ALB/API Gateway/CloudFront are public.

Use VPC endpoints where sensible.

6.2 Storage (S3)

Bucket policies must block public access.

Use least privilege bucket access (prefix-scoped if possible).

Enable versioning for critical buckets.

6.3 Databases

Never expose DB publicly.

Backups enabled + tested restore procedure.

Migrations must be forward-compatible and reversible where possible.

6.4 Edge protection

Use AWS WAF for public endpoints.

Rate limit login + payment initiation endpoints.

7. Operational excellence (keep it stable in Lagos reality)
   Observability

Metrics + alarms: latency, error rate, auth failures, payment webhooks failures.

Structured logs with correlation IDs.

Dashboards per environment.

Feature flags

Any risky feature must ship behind a feature flag.

Flags are per-tenant where needed (add-ons).

Cost guardrails

Tag everything: app=classpoint, env, owner, tenant.

Budgets + alerts per account.

No unbounded autoscaling without caps.

8. “AI safe execution” rules (when running commands)

The AI must:

Prefer read-only actions when investigating (describe, list, get).

Never run destructive commands without a rollback plan.

For any command that modifies infrastructure:

run a “plan/diff” first (terraform plan / cdk diff)

apply only in dev/stage unless explicitly approved by your policy

9. Deliverables the AI must maintain as it builds

/docs/architecture.md (diagram + services)

/docs/security.md (threat model + controls)

/docs/runbook.md (deploy, rollback, incident steps)

/docs/data-model.md (entities + relationships)

/docs/api-contracts.md (GraphQL ops + expected errors)

10. Minimal IAM policy philosophy for the AI

Allow only required services: e.g., AppSync, Cognito, DynamoDB/RDS, S3, CloudFront, WAF, Lambda, IAM (limited), CloudWatch, KMS (limited), SSM/Secrets.

Explicitly deny:

Organizations admin actions

IAM privilege escalation patterns (PassRole unrestricted, CreatePolicyVersion on critical policies, etc.)

Public network exposure misconfigs
