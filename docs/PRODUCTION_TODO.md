# Production Readiness TODO

This is the working checklist for getting ClassPoint to full production readiness.

## Code verification gaps (from repo scan)
- [x] Remove all token/debug UI surfaces still rendering `token-box` inputs in admin/portal/profile/setup pages.
- [x] Replace `/s/[slug]` public pages with subdomain routing; remove `/s` links from the UI.
- [x] Add ACM cert + Route 53 wiring in CDK for wildcard domains.
- [x] Add server-side RBAC checks beyond tenant guard in resolvers/Lambdas (currently tenant-only).
- [x] Add provider config + plan/add-on admin tooling (schema has types but no GraphQL mutations/UI).
- [x] Upgrade import CSV parsing to handle quoted commas/escapes.
- [ ] Add payment provider API verification/replay/refund handling (webhook validates signature only).
- [ ] Implement invoice/receipt PDF generation (only presigned upload/download helpers exist).
- [ ] Platform admin console app is missing (docs mention `apps/admin` + `/platform/*` routes; only `apps/web` exists).
- [x] Setup wizard fees line persistence bug: fee schedule lines show success but do not persist across refresh.

## Platform, auth, and tenancy
- [ ] Lock prod-grade auth: Cognito Hosted UI/OIDC, secure cookies, refresh flow; remove demo token tooling and all token/debug UI.
- [ ] Implement subdomain routing: `{slug}.classpoint.ng` host routing (edge or middleware) and canonical redirects; remove `/s/[slug]` dependency.
- [ ] Finalize DNS + certs: Route 53 wildcard record, ACM certs, CloudFront/ALB bindings, custom domain strategy.
- [ ] Harden tenant isolation: enforce `schoolId` in every resolver/service; add automated tenant-isolation tests and negative cases.
- [ ] Implement RBAC server-side: enforce permission codes on sensitive mutations/queries (fees, refunds, roles, results, imports).

## Money flows (fees, payments, receipts)
- [ ] Payment gateway hardening: full signature verification, provider API verification, event type validation, strict idempotency, replay protection, refund/chargeback handling.
- [ ] Invoice + receipt integrity: atomic invoice totals update, receipt sequence audit, PDF generation + storage + download permissions.
- [ ] Collections reporting: term/class/fee item summaries, aging, exports, and audit trail coverage.
- [ ] Installments: overdue detection, status updates, policy controls, and parent-facing schedules.

## Messaging and communications
- [ ] Messaging reliability: provider failover, rate limits, opt-out compliance, campaign throttling, delivery callbacks and retries tuned.
- [ ] Template governance: template variables validation, content safeguards, and audit log of sends.
- [ ] Announcements + calendar: publish flow, targeting, and delivery reporting (per audience).

## Imports and data quality
- [ ] Import pipeline upgrades: validation + mapping UI, optional virus scanning, streaming for large files.
- [ ] Dedupe + corrections: duplicate resolution workflows and UI fixes for admission/phone/email conflicts.
- [ ] Data hygiene: backfill missing `classGroupId` in invoices, cleanup incomplete records.

## Academics completion
- [ ] Grade computation: assessment totals and grading scale enforcement.
- [ ] Moderation/locking: lock windows, unlock requests, and audit events.
- [ ] Report cards: generation, PDF export, publish scheduling.
- [ ] Result release: gated messaging and clear parent UX when blocked.

## UI/UX and product polish
- [ ] Admin UI modernization: remove ID-entry forms; build real selectors, dashboards, and tables per UI spec.
- [ ] Setup wizard completion: autosave + step completion tracking, progress hub, readiness review and go-live flow.
- [ ] Teacher workflows: attendance bulk UI, score entry grid, class roster access controls, offline-friendly caching.
- [ ] Parent portal completeness: breakdown UX, payment initiation, receipts, results gating messaging, support tickets.

## Security, compliance, and ops
- [ ] Observability: structured logs with `requestId` + `schoolId`, tracing, dashboards per env, tuned alarms.
- [ ] Security docs: threat model, abuse cases, IAM least-privilege review, NDPR export/delete workflows, retention policies.
- [ ] CI/CD hardening: lint/typecheck/tests, schema validation, security/IaC/secret scans, staging gate, rollback strategy.
- [ ] Runbook completion: incident response, rollback steps, data restore drills, provider outage playbooks.
- [ ] Feature flags: per-tenant gating for add-ons and safe-launch toggles for risky features.

## Testing and release readiness
- [ ] End-to-end tests: onboarding, invoicing, payment, messaging, results gating, import, tenant isolation.
- [ ] Load tests: import 5k+ students, invoice generation bursts, messaging campaign scale.
- [ ] Production readiness review: security sign-off, ops sign-off, performance targets met, go-live checklist complete.
