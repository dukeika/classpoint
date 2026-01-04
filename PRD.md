ClassPoint PRD

Multi-tenant school fees + parent engagement + academics platform for Nigerian primary & secondary schools (Lagos, Port Harcourt, Calabar). A single application where the Application Admin creates and provisions Schools, and each School Admin configures and runs their own school instance via subdomain + branded home page.

1. Product summary
   Vision

Make Nigerian schools run smoothly by turning the most painful workflows—fees collection, parent communication, results, and daily operations—into a simple, WhatsApp-friendly system schools can adopt in days (not months).

Product promise

Parents: transparent fee breakdowns, easy payments, instant receipts, and clear balances.

Schools: faster collections, fewer disputes, cleaner records, less admin chaos.

Platform: scalable, multi-tenant, configurable, secure-by-default.

Primary users

Application Admin (ClassPoint HQ)

School Admin (school owner/proprietor/operations head)

Bursar/Accounts officer

Teacher (class teacher / subject teacher)

Parent/Guardian

Student (optional portal role)

Auditor/Viewer (optional)

2. Goals & success metrics
   Business goals

Acquire and retain schools with recurring subscription revenue.

Drive payment volume (optional transaction revenue share).

Build expansion path: feature add-ons, higher tiers, multi-branch schools.

Product success metrics

Activation: School completes onboarding (students/classes/fees) within 7–14 days.

Collections impact: % of invoices paid by due date improves term over term.

Disputes reduction: # of “I paid” disputes and manual reconciliations drops.

Engagement: Parent notification open/click rate; portal logins; WhatsApp link clicks.

Retention: School renewals per term/session; churn rate.

Support load: Tickets per school per month decreases as product matures.

3. Scope
   In-scope (MVP → v1)

Multi-tenant provisioning with subdomains

School branded landing/home page per tenant

Fees configuration with per class/year fee schedules

Fee breakdown display to parents + invoices + receipts

Payment tracking + reminders (WhatsApp/SMS/email)

Core academic module: attendance, assessments, results

Modular add-ons framework (feature toggles & billing)

Out-of-scope initially (future)

Full LMS with video classes

Government/public school procurement workflows

Heavy customizations per school (avoid early)

4. Personas & permissions
   Application Admin (Platform/HQ)

Create/activate/suspend schools

Configure global pricing plans, add-ons, payment settings, SMS/WhatsApp providers

View global metrics and tenant health

Manage support tools, system announcements, compliance

School Admin

Configure school identity (branding, homepage, subdomain settings)

Configure academic structure (levels/classes/arms, sessions, terms)

Configure fee schedules per class/year and fee items breakdown

Manage staff roles and access

Manage parents/students, approvals, disputes, refunds workflow

Enable/disable add-ons for their school (based on subscription)

Bursar/Accounts

Create invoices, manage payments, reconcile, export reports

Handle discounts, scholarship, waivers

Manage debts and reminders

Teachers

Take attendance, enter assessments/grades

Publish class comments, skills/behavior notes (if enabled)

Parents

See children profiles, fee breakdown, invoices, payment links

Download receipts, view statements

Receive announcements, view results (based on school policy)

5. Multi-tenancy model
   Tenant definition

A School is a tenant. Each school has:

Unique schoolId

Subdomain: {schoolSlug}.classpoint.ng (and optionally custom domain later)

Isolated data boundary (hard tenant separation)

Branded home page + login entry points

Configurable modules and billing

Tenant isolation (requirements)

Every data record belongs to a school tenant (except global platform config).

Access control must enforce tenant boundary at API/service layer.

Audit logs include schoolId, actor, action, timestamp.

6. Key user journeys
   Journey A: Platform creates a new school

Application Admin creates school record (name, slug, contact, plan, modules).

System provisions subdomain + tenant config.

Invitation sent to School Admin.

School Admin completes first-time setup wizard.

Journey B: School configures fees with per-class/year fee schedules

School Admin defines academic structure: Primary 1–6, JSS1–3, SSS1–3 (customizable).

For each class/year, admin sets Fee Schedule for term/session:

Fee items (Tuition, Dev levy, Uniform, Books, PTA, Exam, Bus, Lunch, etc.)

Optionality flags (required vs optional)

Due dates, installment options

Discount rules

Parents see transparent fee breakdown per child/class.

Journey C: Parent views breakdown and pays

Parent opens link from WhatsApp/SMS/email OR logs in.

Parent selects child → term invoice → sees itemized breakdown.

Parent pays online or marks as paid with reference (if offline supported).

Receipt generated instantly; balance updates.

Journey D: Results publishing with fee-policy rules

Teacher enters CA + exam scores.

School Admin configures result release policy:

Always show, or

Show only if “≥ X% fees paid” (configurable).

Parent receives “Result ready” notice and views report.

7. Functional requirements by module
   7.1 Platform Admin Console (HQ)

Must-have

Create/edit school tenants (name, slug, plan, region, status)

Assign School Admin(s)

Configure plans & add-ons catalog

Configure messaging providers (SMS/WhatsApp/email) and templates

View platform analytics: active schools, payments volume, usage

Support: impersonation mode (audited), ticket dashboard, system notices

Nice-to-have

Automated KYC/business verification for premium schools

Reseller/partner program dashboard

7.2 School Setup Wizard

Steps

School profile: name, logo, colors, address, contacts

Academic structure:

Session type (termly/semester/custom)

Terms (1st/2nd/3rd)

Levels/classes/arms (e.g., Primary 1A/1B)

Staff onboarding: invite bursar, teachers, admins

Fees setup: create fee schedules per class/year

Parent comms: WhatsApp/SMS sender identity settings (via platform)

Go-live checklist + test parent account

Acceptance

School can generate first invoice and send reminder within wizard completion.

7.3 School Home Page & Subdomain

Each school has a public-facing page on its subdomain:

Hero, school intro, admissions CTA, announcements feed (optional)

Calendar events (optional)

“Login” button routes to tenant login

“Pay Fees” quick link (optional: invoice lookup by student ID/phone)

Admin configuration

Page builder: sections toggles (About, Fees info, News, Calendar)

SEO basics: title/description, social preview image

Theme settings: colors, logo, header/footer

Nice-to-have

Multi-language support (English first, add later)

7.4 Identity & Access Management

Requirements

Tenant-aware authentication (login ties to school)

Roles + granular permissions (RBAC)

Parent accounts can link multiple children

Invitation links for staff and parents

Optional: SSO for large schools (future)

Security

MFA option for admins

Password policies + lockout rules

Session management + device tracking (optional)

7.5 Student & Parent Management

Student profile

Bio: name, DOB, gender, class, admission no, photo

Parent/guardian links (multiple)

Emergency contacts

Medical notes (optional add-on; strict permissions)

Parent profile

Multiple children

Contact channels preference (WhatsApp/SMS/email)

Consent settings (NDPR)

Bulk operations

Import via Excel/CSV templates

Promotions: end-of-term class promotion wizard

Graduations/archive

7.6 Fees, Billing & Payments (core “money engine”)
Fee model

Schools have different fees per class/year and parents want breakdowns.

Entities

FeeItem: name, category, taxable? (optional), required/optional, visibility

FeeSchedule: class/year + term/session + list of fee items with amounts

Invoice: generated per student per term, itemized line-items

Payment: records payments, method, reference, status

Adjustment: discounts, waivers, scholarships, penalties

Fee breakdown requirements (Parent view)

Itemized list with:

item name, description (optional), amount

required vs optional flags

due date and installment eligibility

Subtotals:

required subtotal

optional subtotal (selectable)

discounts applied

amount paid

outstanding balance

Downloadable invoice PDF and receipts

Billing workflows

Must-have

Generate invoices automatically at term start per student/class

Support installment plans:

e.g., 60/40, or monthly

due dates per installment

Late fee rules (optional): fixed or % after grace period

Discounts:

sibling discount

early payment discount

scholarship/waiver (role-restricted)

Defaulters dashboard (filters by class, amount, days overdue)

Reminders:

scheduled (e.g., weekly)

triggered (e.g., 7 days to due date)

Reconciliation:

online payments auto-confirm

offline/manual payments allow evidence upload + approval

Payments

Online: card/bank transfer/USSD depending on gateway

Offline: cash/transfer with reference entry and approval workflow

Parent can attach proof of payment (image/pdf)

Reporting

Collections summary by:

term, class, fee item, payment method

Export CSV/PDF

Audit log of adjustments and cancellations

Policy controls (school-specific)

“Restrict result access until fees ≥ X% paid”

“Restrict exam card/clearance until fees cleared”

“Allow partial payment” toggle

7.7 Communication Hub (WhatsApp-first)

Channels

WhatsApp (preferred)

SMS fallback

Email fallback

In-app notifications

Templates

Fee invoice generated

Payment received

Payment overdue reminder

Announcement

Result ready

Attendance alert (optional)

Emergency broadcast

Features

Contact preference per parent

Delivery tracking (sent/delivered/failed where provider supports)

Opt-in/out management for non-essential messages

7.8 Attendance

Primary

Daily class attendance (present/absent/late)

Bulk mark + comments

Attendance reports per student and per class

Secondary

Subject period attendance (optional add-on if needed)

Parent view

Weekly/monthly attendance summary

Alerts for repeated absenteeism (optional)

7.9 Assessments, Grades & Results

Configuration

Assessment structure per school:

e.g., CA1 10%, CA2 10%, Test 20%, Exam 60%

Grading scale per level:

A–F, 1–5, etc.

Subjects per class (secondary), basic subjects (primary)

Entry

Teachers enter scores for their classes/subjects

Moderation window (admin approval optional)

Locking after deadline

Results

Term report per student (PDF + portal view)

Teacher comment + head teacher comment

Positioning (optional, often requested but can be contentious)

Behavior/skills ratings (primary) as optional

Release policy

Release now / schedule release

Fee compliance gating (configurable)

7.10 Calendar & Announcements

School events calendar (PTA meetings, holidays, exams)

Announcements feed to parents/staff

Attachments (PDF/Images)

Target audiences: whole school / specific classes / staff only

7.11 Add-ons Marketplace (Feature selection)

Schools can enable add-ons (based on plan/billing). Examples:

Operational add-ons

Transport management (bus routes, fees, attendance)

Lunch/meal plan management

Inventory/store (uniforms, books)

Clinic/medical log (strict permissions)

Behavior & discipline tracking

Homework diary (simple, not full LMS)

Growth add-ons

Admissions portal + entrance exams scheduling

Alumni management

Website builder enhancements + custom domain

Security add-ons

Visitor management / gate pass QR (estate-style)

ID card generation integration

Finance add-ons

Advanced accounting exports

Multi-branch consolidated reports

Add-ons requirements

Toggleable per tenant

Role-based access for each add-on

Billing rules: per student/term, per school/term, or fixed

8. Non-functional requirements
   Performance

Parent invoice view loads < 2 seconds on average mobile networks

Bulk import handles 5,000+ students per school without timeouts

Messaging queue scalable for mass reminders

Reliability

99.5%+ uptime target (initial), higher later

Graceful degradation: parents can still view invoices even if some modules fail

Security & Compliance

NDPR-aware data handling

Encryption in transit and at rest

Tenant isolation enforcement

Audit logs for sensitive actions (adjustments, result edits, role changes)

Data retention rules configurable by school (within policy)

Observability

Centralized logs with tenant context

Error monitoring and alerting

Per-tenant usage analytics

Data portability

School can export data (students, invoices, receipts, results) in standard formats

9. Pricing & packaging model (product requirement)

System must support:

Plans: Fees / Core / Plus (or similar)

Add-ons billed separately

Billing cycles: termly, sessionly, yearly

Invoice generation for schools (tenant billing)

Grace periods and suspension rules

Feature gating by plan/add-on

10. Admin & support requirements

Support ticketing module or integration

Tenant impersonation (read-only preferred, fully audited)

System status page (optional)

Knowledge base links per tenant

11. Edge cases & policies

Parent with multiple children in different classes

Mid-term transfers (pro-rate fees or manual adjustments)

Sibling discounts and custom scholarship rules

Reversals/refunds (approval workflow)

Repeaters / class changes mid-term

Split custody: two parents want notifications

Offline payments at scale (bulk reconciliation upload via CSV)

12. MVP release plan (phased)
    Phase 1: Money + Tenant foundation (Launch-ready MVP)

Platform Admin Console: create schools, plans, add-ons

Tenant subdomain + school homepage

RBAC + invitations

Students/parents import

Fee schedules per class/year + itemized invoices + receipts

Payment tracking + manual/offline flow

Reminders (WhatsApp/SMS/email basic)

Reports: collections + defaulters

Phase 2: Academics core

Attendance

Assessments + results + PDF report

Results release policy + fee gating

Announcements + calendar

Phase 3: Add-ons & scale

Add-ons marketplace + billing rules

Admissions portal add-on

Transport/lunch add-ons (based on demand)

Multi-branch consolidation (for premium schools)

13. Acceptance criteria (samples)
    Fees breakdown

Parent can see an invoice with at least 10 line items showing amounts, required/optional, subtotal, paid, balance.

Invoice reflects class/year fee schedule for the child’s current class.

Discounts/waivers are visible and auditable.

Tenant isolation

A user from School A cannot access any record from School B by URL manipulation or API requests.

All logs and exports are scoped to tenant.

Messaging

Fee reminder can be sent to all defaulters of a class and delivery status is recorded.

Parents can choose preferred channel and it is respected.

Results gating

If policy is enabled, parent with < X% fees paid cannot view results; message explains requirement.

14. “Attractive” differentiators to include early (high ROI)

These make ClassPoint feel premium without huge complexity:

WhatsApp-first experience (links, receipts, announcements)

Fee breakdown transparency (parents love this; schools get fewer disputes)

Installment plans + automated reminders

Defaulters dashboard with one-click campaigns

Branded school subdomain home page

Result release scheduling + fee compliance control

Sibling discount + scholarship workflows

Fast onboarding tooling (Excel templates, import validation, go-live checklist)
