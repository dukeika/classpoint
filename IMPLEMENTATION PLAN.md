0. Architecture decisions (lock these first)
   Recommended stack (serverless-first)

Frontend: Next.js (or React + Vite) hosted on CloudFront + S3 (or Amplify Hosting).

Auth: Cognito User Pools (+ groups and custom claims).

API: AppSync GraphQL (the schema you already have) + Lambda resolvers only where necessary.

Database: DynamoDB (multi-tenant by schoolId everywhere).

Files: S3 (logos, proofs, receipts PDFs).

Async workflows: EventBridge + SQS + Lambda (payments, messaging, invoice generation).

Messaging: WhatsApp via Meta Cloud API (or Twilio) through Lambda.

Payments: Paystack or Flutterwave webhooks → Lambda → DynamoDB.

Observability: CloudWatch Logs/Metrics/Alarms + X-Ray.

Security edge: WAF in front of CloudFront/AppSync.

Status update (dev)

Result release gate deployed and verified (blocked + allowed scenarios).

AppSync resource cap is at 500; maintain split-stack plan for academics.

Academics stack split is live: attendance/assessment queries re-enabled; create attendance session/entry and create assessment/score entry mutations deployed with admin UI controls.

Defaulter reminders UI present; batch enqueue mutation is next to reduce client-side loops.

Admin dashboard + setup wizard UX modernization in progress (wizard hub, stepper, import sub-steps, inline previews).

Multi-tenant domain model (strong opinion)

Don’t create separate infra per school. Use one CloudFront distribution + wildcard DNS:

\*.classpoint.ng → CloudFront → single frontend app

Frontend reads the subdomain (schoolSlug) and loads that school’s branding/home page and routes correctly.

Custom domains can be Phase 7+ (premium add-on).

1. AWS foundation setup (accounts, guardrails, DNS)
   1.1 Accounts & environments

Create AWS accounts:

dev

staging

prod
Optionally shared-services for DNS/logging.

1.2 Organization-level guardrails

Enable CloudTrail (org trail), Config, GuardDuty, Security Hub.

Create SCPs:

deny disabling security services

deny public S3 policies

deny security groups with 0.0.0.0/0 except 80/443 at edge

deny destructive actions in prod except via pipeline role

1.3 DNS

Buy/manage classpoint.ng in Route 53

Add wildcard record:

\*.classpoint.ng → CloudFront distribution

Reserve subdomain patterns:

{schoolSlug}.classpoint.ng (tenant)

app.classpoint.ng (HQ / marketing / admin portal)

2. Repo, IaC, CI/CD (make deployments boring)
   2.1 Repo structure (monorepo recommended)

/apps/web (tenant app + public pages)

/apps/admin (platform admin)

/services/api (AppSync schema + resolvers)

/infra (CDK/Terraform)

/docs (runbook/security/architecture)

2.2 IaC baseline

Use AWS CDK for:

Cognito

AppSync

DynamoDB

S3 buckets + policies

CloudFront + WAF

EventBridge/SQS/Lambda

KMS keys

CloudWatch alarms

Plan for AppSync resource caps: split resolvers into multiple stacks (core vs academics) when nearing 500 resources.

2.3 CI/CD

GitHub Actions (or CodePipeline):

PR: lint + typecheck + unit tests + schema validation

Merge to develop: deploy to dev

Promote to main: deploy to staging

Release tag: deploy to prod (manual approval gate)

Artifacts:

versioned frontend builds

versioned Lambda packages

schema migrations (where applicable)

3. Identity, roles, and tenant provisioning
   3.1 Cognito model

User groups: APP_ADMIN, SCHOOL_ADMIN, BURSAR, TEACHER, PARENT

Store custom:schoolId in token for tenant users.

Enforce tenant scoping in AppSync via:

@auth ownerField = schoolId using identityClaim custom:schoolId

plus defense-in-depth in resolvers for sensitive queries

3.2 Tenant provisioning workflow (Platform Admin creates a school)

Create a ProvisionSchool flow:

Platform Admin creates School (slug validated, unique)

System creates:

SchoolProfile skeleton

default roles + permissions

“Setup Wizard” tasks checklist

Invite School Admin (email/SMS link)

School Admin logs in on {slug}.classpoint.ng and runs wizard

Implementation detail:

Provisioning runs via Step Functions (or Lambda + EventBridge) so you can retry safely.

4. Core data layer (AppSync + DynamoDB) and tenant enforcement
   4.1 Database strategy (recommended)

Use DynamoDB per model (Amplify/AppSync style) initially for speed.

Ensure every table has schoolId and indices support key access patterns:

invoices by studentId+termId

fee schedules by termId+classYearId

defaulters by termId+classGroupId (GSI)

messages by campaignId
Later, if needed, consolidate hot paths into single-table patterns.

4.2 Access patterns to implement early

School home page: getSchoolBySlug, getSchoolProfile, sectionsBySchool

Parent dashboard: children list → invoices by term → breakdown

Bursar: defaulters list, payments list, collections summary

4.3 Audit logging

Implement AuditEvent writes for:

fee adjustments

refunds/reversals

score edits after lock

role changes

result publishing

5. School setup wizard (fast onboarding = competitive advantage)

Wizard modules:

Branding: logo/colors/contact

Academic structure: sessions/terms, class years/arms, class groups

Users: invite bursar/teachers

Students/parents import:

Upload CSV → S3

Lambda validates, returns report (duplicates/missing phones/bad classes)

Confirm import creates Students/Parents/Links/Enrollments

Fees setup sub-wizard (Admin/Bursar): create fee items → build schedule → preview → generate invoices

Test parent payment flow (sandbox)

Go-live checklist + “send first invoice batch”

6. Fees engine (fee breakdowns per class/year) + invoices
   6.1 Fee configuration

FeeItems (tuition, levy, uniform, books, etc.)

FeeSchedules:

by termId + classYearId (default)

optional override by classGroupId for special arms/streams

FeeScheduleLines:

amount, due date, required/optional

6.2 Invoice generation

Implement invoice generation service:

Triggered by:

term activation

new student enrollment

manual “generate invoices” action

Runs async (SQS) to avoid timeouts:

create Invoice + snapshot InvoiceLines

compute subtotals, discounts (if rules enabled)

create installment plan (optional)

6.3 Parent fee breakdown UX

Required vs optional sections

Toggle optional items (if school enables selection)

Display:

required subtotal

optional subtotal (selected)

discounts

amount paid

outstanding balance

Export invoice PDF later (Phase 4/5)

7. Payments (Paystack/Flutterwave) + reconciliation + receipts
   7.1 Payment initiation

Parent clicks “Pay now”

Create PaymentIntent with amount/currency/invoice reference

Redirect to gateway / open payment modal

Store gateway reference

7.2 Webhook processing (must be rock solid)

Gateway webhook → API Gateway (or Lambda URL) → Lambda

Validate signature

Idempotency:

if reference already processed, do nothing

Create PaymentTransaction CONFIRMED

Update Invoice totals atomically

Emit EventBridge event: payment.confirmed

7.3 Receipts

Receipt number sequence per school

Generate receipt record and optionally PDF in later phase

Notify parent via WhatsApp/SMS/email

7.4 Manual payments

Parent uploads proof (S3 presigned upload)

Bursar reviews → approve/reject

Audit every manual edit

8. Messaging hub (WhatsApp-first) + campaigns
   8.1 Provider integration

WhatsApp API credentials in Secrets Manager

Message sending via queue:

Campaign → create recipients → enqueue → Lambda sends

Store delivery status (SENT/DELIVERED/FAILED where available)

8.2 Templates & variables

Define templates:

invoice issued

overdue reminder

payment received

announcement

result ready
Variables:
{parentName}, {studentName}, {amountDue}, {invoiceLink}, {dueDate}

8.3 Campaign audiences

All parents

Parents of a class group

Defaulters by class / amount overdue / days overdue

Staff-only announcements

9. Academics module (attendance + assessments + results)
   9.1 Attendance

Daily AttendanceSession per class group/date

Bulk mark + edit controls

Parent view: weekly summary + absentee alerts (optional)

9.2 Assessment policies

Configure weights (CA1, CA2, Exam, etc.)

Configure grading scale

Subjects per class year

9.3 Results & report cards

Teacher enters scores

Admin can lock assessments after deadline

Generate report card summaries

Publish results:

immediate or scheduled

enforce ResultReleasePolicy (fee gating)

10. Add-ons marketplace + subscription billing (schools selecting extras)
    10.1 Feature gating

Plan + AddOns → FeatureFlags

Frontend hides features, backend enforces them

Add-ons toggled per tenant by School Admin (only within paid entitlements)

10.2 Tenant billing (schools pay ClassPoint)

Generate ClassPoint subscription invoice per term/session

Payment tracking (separate from school fees)

Grace period → read-only mode if overdue

10.3 First add-ons to build (high sales)

Pick 2:

Admissions portal (forms + applicant tracking)

Transport (routes + transport fee lines + enrolment)

Inventory (uniform/books store + stock movement)

11. Observability, security hardening, and scale readiness
    11.1 Observability

CloudWatch dashboards per env:

API latency, errors

webhook failures

message send failures

queue depth

Alarms to SMS/Email/Slack

11.2 Security

WAF rules for:

rate limiting auth/payment endpoints

common injection patterns

Strict CORS

No public buckets, no public DBs

KMS encryption for DynamoDB/S3/Secrets

Regular access reviews for AI roles

11.3 Data resilience

DynamoDB PITR enabled

S3 versioning enabled

Backup/restore runbook tested

12. Release plan (phased delivery with clear acceptance)
    Release 1: Tenant foundation + onboarding

school provisioning, subdomain routing, auth, roles

wizard: branding + academic structure + imports

Acceptance: Create a school → import students → log in on {slug}.classpoint.ng.

Release 2: Fees engine + breakdowns + invoices

fee schedules per class/year + invoice generation + parent view

Acceptance: Parent sees itemized breakdown; correct class fees applied.

Release 3: Payments + receipts + defaulters

gateway integration, webhooks, receipts, defaulters dashboard

Acceptance: Pay online → invoice updates instantly → receipt notification sent.

Release 4: Messaging campaigns

WhatsApp reminders, templates, campaigns, delivery tracking

Acceptance: Bursar sends defaulter reminders by class; can see status.

Release 5: Attendance + results with fee gating

attendance, assessments, report cards, release policy

Acceptance: Results blocked if fees below threshold (if enabled).

Release 6: Add-ons + tenant billing

add-ons marketplace + feature flags + school subscription billing

Acceptance: School enables paid add-on → features appear and are enforced.
