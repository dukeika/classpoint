# ClassPoint Production Readiness Checklist (Tracked)

Status labels:
- [not-started]
- [in-progress]
- [blocked]
- [done]

## 1) Platform, Auth, and Tenancy
- [done] Replace demo token flow with production auth (Hosted UI/OIDC, secure cookies, refresh flow); remove localStorage tokens.
- [done] Implement subdomain routing for `{slug}.classpoint.ng` with canonical redirects.
- [done] Wire SSR hosting with OpenNext + CloudFront and set runtime envs for Cognito + root domain.
- [done] Finalize DNS + certs (Route 53 wildcard, ACM certs, CloudFront bindings).
- [done] Configure Cognito Hosted UI domain + app client callbacks/logouts for HQ + tenants.
- [done] Add CSP allowances for Cognito Hosted UI domain.
- [done] Route `_next/*` assets via S3 origin path `/_assets` for OpenNext static bundles.
- [done] Align CloudFront cache + origin request policies to preserve tenant routing via `x-forwarded-host`.
- [in-progress] Enforce server-side RBAC checks for sensitive mutations/queries.
- [in-progress] Add tenant isolation automated tests (positive + negative cases).
- [done] Define CloudFront invalidation + cache versioning strategy for releases.
- [done] Add WAF + rate limiting rules on the edge (baseline + tenant-specific).

## 2) Platform Admin Console
- [not-started] Decide on HQ console location (`apps/admin` vs `/platform` in `apps/web`).
- [not-started] Implement core HQ flows: schools, plans/add-ons, providers, support, audit.
- [not-started] Implement tenant provisioning workflow with retry safety.

## 3) Payments, Invoices, Receipts
- [not-started] Harden payment webhooks: signature + provider verification + replay protection + idempotency.
- [not-started] Implement refund/chargeback handling and audit trail.
- [not-started] Implement invoice/receipt PDF generation + storage + download permissions.
- [not-started] Ensure atomic invoice totals updates and receipt sequencing audit.
- [not-started] Collections reporting: term/class/fee item summaries, aging, exports.
- [not-started] Installment overdue detection and policy controls.

## 4) Messaging and Communications
- [not-started] Provider failover, rate limits, opt-out compliance, callback retries.
- [not-started] Template variable validation and send audit log.
- [not-started] Announcements + calendar publish flow with targeting and delivery reporting.

## 5) Imports and Data Quality
- [not-started] Import pipeline UX: mapping UI, validation, streaming for large files.
- [not-started] Optional virus scanning for uploads.
- [not-started] Dedupe + correction workflows (admission/phone/email conflicts).
- [not-started] Data hygiene: backfill missing `classGroupId` in invoices, cleanup incomplete records.

## 6) Academics Completion
- [not-started] Grade computation with grading scale enforcement.
- [not-started] Moderation/locking windows + unlock requests + audit events.
- [not-started] Report card generation + PDF export.
- [not-started] Result release scheduling + parent gating UX.

## 7) UI/UX Productization
- [not-started] Replace placeholder pages with data-driven screens.
- [not-started] Implement School Admin dashboard redesign (KPI, work queue, actions).
- [not-started] Implement setup wizard stepper + autosave + readiness review.
- [not-started] Public school home page + branding editor.
- [not-started] Teacher workflows: attendance bulk UI, score entry grid, roster permissions.
- [not-started] Parent portal completion: payment initiation, receipts, results gating, support tickets.

## 8) Security, Compliance, and Ops
- [not-started] Threat model + abuse cases.
- [in-progress] IAM least-privilege review and documented policy boundaries.
- [not-started] NDPR export/delete workflows + retention policies.
- [not-started] Structured logs with `requestId` + `schoolId` across services.
- [not-started] Runbook completion: incident response, rollback, data restore drills, provider outage playbooks.
- [not-started] Feature flags for risky launches and add-ons (per-tenant).

## 9) Testing and Quality Gates
- [not-started] Unit/integration tests for resolvers (tenant isolation + RBAC).
- [not-started] Contract tests for payment webhooks (happy/idempotent/replay/bad signature).
- [not-started] End-to-end tests: onboarding, invoicing, payment, messaging, results gating, import.
- [not-started] Load tests: imports (5k students), invoice generation bursts, messaging campaigns.

## 10) Release and Environment Readiness
- [not-started] CI/CD hardening: lint/typecheck/tests, schema validation, IaC/secret scans.
- [not-started] Staging regression + synthetic journeys before prod.
- [not-started] Production readiness review: security sign-off, ops sign-off, perf targets met.
- [not-started] Post-deploy checks: health endpoints, logs, alarms, synthetics.
- [not-started] Rollback plan validated (artifact rollback + feature flags + migration reversal).
