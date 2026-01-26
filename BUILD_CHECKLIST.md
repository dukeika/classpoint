# ClassPoint Build Checklist

Use this checklist to drive execution. Tick items as they are completed.

## Pre-flight & Architecture
- [x] Confirm stack (Next.js + CloudFront/S3, AppSync + DynamoDB, Cognito with `custom:schoolId`, S3 assets, EventBridge/SQS/Lambda, Paystack/Flutterwave, WhatsApp API).
- [ ] Lock wildcard DNS `*.classpoint.ng` and subdomain routing strategy.
- [x] Finalize IaC tool (CDK) and repo structure (`apps/web`, `apps/admin`, `services/api`, `infra`, `docs`).
- [x] Write deploy/rollback runbook and environment guardrails (dev/stage/prod).

## IaC Baseline
- [x] CDK stacks for Cognito (pools/groups/custom claim), AppSync API + schema, DynamoDB tables/GSIs.
- [x] Buckets for logos/uploads/receipts with block-public-access + KMS; presigned upload pattern.
- [x] CloudFront + WAF + wildcard cert; Route 53 records (`*.classpoint.ng`, `app.classpoint.ng`).
- [x] EventBridge + SQS queues + Lambda for async jobs (invoicing, messaging, payments).
- [x] Secrets Manager/SSM params for providers; KMS keys; CloudWatch alarms.
- [x] CI/CD workflows: lint/typecheck/tests/IaC scan/secret scan; env promotion gates.

## Identity & Tenant Foundation (Phase 0)
- [ ] Cognito auth flow issues tokens with `custom:schoolId`; seed groups/claims.
- [x] Platform permissions catalog seeded; default roles (Admin, Bursar, Teacher, Parent).
- [ ] Platform admin create-school flow: School + Profile + default roles + homepage sections + `{slug}.classpoint.ng` domain. (School/Profile/Domain/Roles done; homepage sections pending.)
- [ ] Tenant middleware/helpers enforce `schoolId` on every resolver/service call (positive/negative tests). (AppSync tenant guard + filters added; tests pending.)
- [x] Audit log writer wired for sensitive actions. (Fee adjustments, payments, imports, manual payment review, role changes; extend to refunds/result publish.)

## Branding & Public Home (Phase 0)
- [ ] CRUD for SchoolProfile + HomePageSection.
- [ ] Public homepage per subdomain (hero/about/announcements/calendar/login/pay-fees CTA) with theme settings.
- [ ] Basic SEO meta + social preview support.

## Setup Wizard (Phase 1)
- [ ] Wizard steps: branding → academic structure → staff & roles → import (upload/map/review/results) → fees → payments → communications → review → go-live.
- [ ] Academic structure CRUD: session/term/level/classYear/classArm/classGroup (teacher assignment pending).
- [x] CSV import pipeline: S3 upload → Lambda validate → error/duplicate report; bulk create Students/Parents/Links/Enrollments.
- [x] Data quality checks (missing phone, duplicate admissionNo/email/phone).

## Fees Engine (Phase 2)
- [x] FeeItem CRUD (required/optional, category).
- [x] FeeSchedule CRUD per term/classYear (override classGroup) with FeeScheduleLines (amount/optional/due date/order).
- [x] Invoice generator (async SQS) snapshots Invoice + InvoiceLines, computes subtotals/discounts/optional selections.
- [x] Parent invoice view: required vs optional subtotals, discounts, paid, balance; optional item selection toggle. (MVP UI scaffold in apps/web.)
- [x] Defaulters query patterns (by term/classGroup, overdue days) and basic exports.
- [ ] Optional: Invoice PDF export.

## Payments & Reconciliation (Phase 3)
- [x] PaymentIntent creation + gateway handoff (Paystack/Flutterwave); store references.
- [x] Webhook handler: signature verify, idempotent, PaymentTransaction CONFIRMED, atomic Invoice update, emit `payment.confirmed`.
- [x] PaymentIntent lifecycle updates (INITIATED -> REDIRECTED -> SUCCEEDED/FAILED) + invoice status updates (ISSUED -> PARTIALLY_PAID/PAID).
- [x] Parent callback UX for payment confirmation + receipt visibility (Paystack test flow).
- [x] Receipt number sequence per school; receipt record (PDF optional).
- [x] Manual/offline payments: proof upload (presigned), review/approve/reject with audit trail.
- [x] Installment plans (optional): create plan/installments, overdue detection.
- [x] Defaulters dashboard + collections report + CSV export.

## Messaging Hub (Phase 4)
- [x] Provider integration via Secrets Manager (WhatsApp/Twilio) with health checks.
- [x] MessageTemplate CRUD with variables (`{parentName}`, `{studentName}`, `{amountDue}`, `{invoiceLink}`, `{dueDate}`).
- [x] Campaign creation/scheduling; audiences (all parents, classGroup, defaulters).
- [x] Queue-based sender + delivery status tracking (sent/delivered/failed); retries/backoff.
- [x] Schema exposes `lastError` and statusHistory error; worker env now expects `PROVIDER_SECRET_PREFIX=classpoint/providers/` (use `classpoint/providers/default` secret).
- [x] Respect parent preferred channel + opt-outs for non-essential broadcasts.
- [x] Notifications wired: invoice issued/overdue/payment received/result ready/announcement.

## Attendance & Academics (Phase 5)
- [x] Attendance queries re-enabled after stack split (`attendanceEntriesBySession`, `attendanceSessionsByClassAndDay`).
- [x] Assessment queries re-enabled after stack split (`assessmentPoliciesBySchool`, `assessmentsByClassSubjectTerm`, `scoresByAssessment`).
- [ ] AttendanceSession per class/day, bulk mark, reports per student/class; parent summary view.
- [ ] AssessmentPolicy setup (components/weights, grading scale) per level.
- [ ] Assessments per class/subject/term; score entry with totals/grades; moderation/locking after deadline.
- [ ] ReportCard generation (portal; PDF optional).
- [x] ResultReleasePolicy enforcement: block view below fee threshold, show message, audit log entry.
- [x] Result release gate verified in dev (blocked + allowed scenarios).
- [x] Result release policy CRUD (admin UI + API).
- [x] Academics mutations added (create attendance session/entry, create assessment/score entry) with admin UI controls.
- [x] Collections reminder button (per-defaulter enqueue); batch mutation pending.

## Add-ons & Tenant Billing (Phase 6)
- [ ] Plan/AddOn admin tools; enable/disable SchoolSubscriptionAddOn.
- [x] FeatureFlag query re-enabled after stack split (`featuresBySchool`).
- [ ] FeatureFlag computation + enforcement in UI/API.
- [ ] ClassPoint billing to schools: subscription invoices per term/session, grace/suspension/read-only mode.
- [ ] First add-ons (pick 1–2): Admissions portal or Transport; gate via flags and permissions.

## Security & Compliance (Ongoing)
- [ ] Enforce `schoolId` scoping on every resolver/service; add automated tenant-isolation tests. (Harness in scripts/tenant-isolation-smoke.js; run in env with AppSync/JWTs.)
- [ ] RBAC checks server-side for sensitive actions (fee adjustments, refunds, role changes, result publish).
- [ ] Secrets in Secrets Manager/SSM only; no secrets in clients/logs.
- [ ] TLS everywhere; KMS for DynamoDB/S3; WAF rules for auth/payment endpoints + rate limits.
- [ ] NDPR support plan: export/delete workflow for admins.

## Observability & Ops (Ongoing)
- [ ] Structured logs with `requestId` + `schoolId`; correlation IDs through async flows.
- [x] Dashboards/alarms: API latency/error, webhook failures, queue depth, messaging failures.
- [x] Synthetic checks for public pages and key flows.
- [x] Backups/versioning: DynamoDB PITR, S3 versioning; tested restore runbook.

## Testing Strategy (Every Phase)
- [ ] Unit + integration tests for API/resolvers with tenant isolation and RBAC cases.
- [ ] Contract tests for payment webhooks (happy/idempotent/replay/bad signature).
- [ ] E2E journeys: onboarding, invoice generation, payment, messaging, result gating.
- [ ] Load tests: imports (5k students), invoice generation bursts.

## Release Flow
- [x] Dev deploy + smoke tests.
- [ ] Stage regression (multi-tenant scenarios) + synthetic journeys.
- [ ] Prod deploy via pipeline with manual gate; feature flags ready to disable risky features.
- [ ] Post-deploy checks: health endpoints, logs, alarms, synthetics.
- [ ] Rollback plan validated (previous artifacts/feature flag off/DB migration reversal strategy).
