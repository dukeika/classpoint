Phased backlog (development roadmap)

I’m laying this out as phases → epics → stories/tasks with clear outcomes and dependencies.

Status tags:
[done] [partial] [in-progress] [pending]

Phase 0 — Product skeleton & tenancy foundation

Outcome: You can create schools, enforce tenant isolation, and log in on a subdomain.

Epics

Multi-tenant provisioning

Create School (slug validation, status lifecycle) [done]

SchoolDomain: generate {slug}.classpoint.ng [done]

Tenant middleware: enforce schoolId on every request [done]

Basic audit logging framework [partial]

Auth + RBAC

Tenant login flow (school-scoped) [partial]

User invitations (School Admin invite) [partial]

Roles/permissions system with seed roles (Admin, Bursar, Teacher, Parent) [done]

MFA option for admin (optional) [partial]

School branding + homepage MVP

SchoolProfile CRUD [done]

HomePage sections CRUD (simple JSON sections) [partial]

Public home page rendering on subdomain [partial]

“Login” and “Pay Fees” CTA placeholders [partial]

Acceptance

Platform Admin creates a school → school admin logs in at subdomain → sees branded home page + admin console. [partial]

Phase 1 — Core onboarding + student/parent data

Outcome: A school can import students/parents, create classes, and enroll students into term.

Epics

Academic structure

Session + Term management [partial]

Level/ClassYear/ClassArm/ClassGroup setup [partial]

Teacher assignment to ClassGroup [pending]

Setup wizard hub + stepper UX overhaul [in-progress]

Student/Parent management

Student CRUD + bulk import (CSV/Excel template) [partial]

ParentGuardian CRUD [partial]

StudentParentLink (multiple parents, multiple children) [done]

Enrollment creation per term (bulk enrollment wizard) [partial]

Data quality tooling (huge differentiator)

Import validation report (missing phone, duplicates, invalid class) [partial]

Duplicate detection (admissionNo/email/phone) [partial]

Quick fixes UI [pending]

Acceptance

Import 500+ students, link parents, enroll into class groups, generate basic roster. [partial]

Phase 2 — Fees engine (fee schedules + breakdowns + invoices)

Outcome: Schools configure fees per class/year, parents see breakdowns, invoices generated.

Epics

Fee catalog

FeeItem CRUD (required/optional, categories) [partial]

Fee schedules per class/year

FeeSchedule CRUD scoped by (term, classYear) [partial]

FeeScheduleLines (amount, due dates, ordering) [partial]

Preview fee breakdown for a class [partial]

Invoice generation

Generate invoices per student per term from schedule [done]

InvoiceLine snapshotting [done]

Optional line selection (uniform/books can be opt-in) [done]

Invoice PDF export (optional at this stage, but valuable) [pending]

Parent invoice view

Parent portal: select child → view invoice breakdown [done]

Subtotals: required/optional/discount/paid/balance [done]

Acceptance

School sets Primary 3 fees and JSS1 fees differently; parent sees the correct breakdown for each child. [partial]

Phase 3 — Payments + reconciliation + receipts + defaulters

Outcome: Money flows, balances update, receipts exist, defaulters can be chased.

Epics

Payment gateway integration (choose 1 provider first) [pending]

PaymentIntent creation [done]

Webhook handler → PaymentTransaction confirm [partial]

Auto-update invoice amounts paid/due [partial]

Receipt generation (receipt number + PDF) [partial]

Manual/offline payments

Manual payment entry by bursar [done]

Proof upload by parent [done]

Approval workflow [done]

Audit logging for edits/reversals [partial] (submit/review/receipt attach/download logged)

Defaulters & finance reporting

Defaulters dashboard filters (class, amount overdue, days overdue) [done]

Collections report (term/class/fee item) [pending]

Export CSV [done] (transactions/receipts/defaulters)

Installments (optional but high-sales)

InstallmentPlan builder (fixed splits + due dates) [partial]

Overdue installment detection [pending]

Acceptance

Parent pays online → receipt is produced instantly → invoice shows PAID/PARTIALLY_PAID correctly → bursar has a term report. [partial]

Phase 4 — Messaging hub (WhatsApp-first) + campaigns

Outcome: Schools can run reminders and announcements reliably.

Epics

Templates + variables

MessageTemplate CRUD [partial]

Variable resolver (parentName, studentName, amountDue, dueDate, link) [partial]

Campaigns

MessageCampaign create/schedule [partial]

Audience targeting:

all parents [partial]

classGroup parents [partial]

defaulters list [partial]

Delivery tracking (sent/failed; delivered if supported) [partial]

Status tracking: `lastError` and statusHistory.error exposed; recipients queryable by invoice; worker env expects `PROVIDER_SECRET_PREFIX=classpoint/providers/` (seed `classpoint/providers/default`).

Parent preferences + compliance

Preferred channel per parent [pending]

Opt-out settings for non-critical broadcasts [pending]

Acceptance

Bursar selects “JSS1 defaulters” → sends WhatsApp reminder → sees delivery stats. [partial]

Phase 5 — Academics core (attendance + assessments + results)

Outcome: Teachers use it weekly, results publishing becomes sticky.

Epics

Attendance

Daily attendance session per class [done]

✅ Queries and basic create mutations live (attendance session/entry; assessment/score) with admin UI controls. [done]

Bulk mark + reports [pending]

Attendance summaries per student [pending]

Assessment policies

Configure components + weights per level [partial]

Configure grading scale [partial]

Score entry + report cards

Create assessments per subject/class/term [partial]

ScoreEntry per student [partial]

Auto compute totals/grades [pending]

ReportCard generation (portal + PDF) [partial]

Results release policy (fee gating)

ResultReleasePolicy config [partial]

Enforce “minimum % paid” rule [partial]

Parent messaging when blocked [pending]

Acceptance

Teacher publishes results; parent can view only if fees condition is satisfied (if enabled). [partial]

Next focus: moderation/locking, report card templates, publish scheduling, teacher score-entry UI.

Phase 6 — Add-ons marketplace + billing/feature gating

Outcome: Schools can “select extras,” and your app enforces it automatically.

Epics

Add-on catalog & enablement

Plan/AddOn admin tools (HQ) [pending]

SchoolSubscriptionAddOn enable/disable [pending]

FeatureFlag computation & enforcement [pending]

Tenant billing (school pays ClassPoint)

Subscription invoices (termly/sessionly) [pending]

Payment status → suspension/grace rules [pending]

“Read-only mode” when past due [pending]

Add-on modules v1 (pick 1–2 winners)

Admissions add-on (forms + applicant tracking) OR [pending]

Transport add-on (routes + billing) OR [pending]

Inventory add-on (uniform/books sales) [pending]

Acceptance

School enables “Admissions” add-on → admissions menus appear; other schools don’t see them. [pending]

Phase 7 — Scale, polish, enterprise features

Outcome: Ready for Lagos scale and premium schools.

Epics

Multi-branch schools + consolidated reporting [pending]

Advanced analytics dashboards (collections trends, cohort analysis) [pending]

Performance hardening (bulk operations, caching, queues) [pending]

More payment providers + bank statement reconciliation (optional) [pending]

Impersonation mode for support (fully audited) [pending]

NDPR tooling (export/delete requests) [pending]

