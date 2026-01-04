Frontend principles for ClassPoint OS

Tenant-first: user lands on schoolSlug.classpoint.ng → branding loads instantly → login goes to correct tenant.

Role-first dashboards: every role has a “Today” view (what needs attention).

Mobile-first for Teachers + Parents, desktop-friendly for Admins.

Fast actions: everything critical is 2–3 clicks max.

Status clarity: payments, attendance, results, approval workflows show clear statuses and next steps.

Feature flags: menus appear only if plan/add-on is enabled.

1. Application Admin Frontend (ClassPoint HQ Console)

URL: admin.classpoint.ng (not tenant-specific)

A) Top navigation

Schools

Plans & Add-ons

Providers (Payments / Messaging)

Platform Analytics

Support & Operations

Security & Audit

Settings

B) Dashboard (HQ “control room”)

Cards + charts:

Active schools / new schools this week

Subscription revenue (termly/monthly)

Payment volume processed (optional)

Message volume + failure rate

System health: API latency, error rate, webhook failures

Support tickets: open/critical

Quick actions:

Create new school

Reset school admin access / resend invite

Impersonate school (audited)

Toggle platform-wide announcements

C) School Management (multi-tenant lifecycle)

School table:

Name, slug, plan, status, city, onboarded %, last activity
Actions:

View school profile + usage

Activate/suspend school

Change plan + add-ons

Assign School Admins

View tenant audit stream

View billing status + invoices to school

School detail page tabs:

Overview (branding, contacts, plan, domain)

Setup progress (wizard completion, imports, first invoice created, first payment)

Users (school admins & staff)

Usage (feature usage metrics)

Billing (ClassPoint subscription billing)

Incidents (errors, failed webhooks/messages)

D) Catalog: Plans & Add-ons

Create/edit plan tiers (Fees/Core/Plus/OS)

Add-ons catalog:

pricing model (per student/term / per school/term / flat)

enablement rules

feature flags mapping

Simulate what School Admin sees under each plan

E) Providers

Payments provider config templates (Paystack/Flutterwave)
Messaging providers:

Twilio SMS config

WhatsApp placeholder (later)

Email SES config
Controls:

Default provider by region

Rate limits + failover rules (WhatsApp → SMS)

F) Support & Operations

Ticket queue (by school)

“Audit-safe impersonation” (view-only by default)

Playbooks (common issues)

Broadcast platform notices (maintenance windows)

2. School Admin Frontend (Tenant Admin Console)

URL: schoolSlug.classpoint.ng/admin

A) School Admin Navigation (left sidebar)

Dashboard

Students & Parents

Staff & Roles

Academics

Attendance

Fees & Billing

Payments & Reconciliation

Results & Report Cards

Communication

Admissions (add-on)

Transport (add-on)

Inventory/Store (add-on)

Reports & Analytics

Settings (School)

Support Queue

B) School Admin Dashboard (“What needs attention”)

Widgets:

Collection status: total billed, collected, outstanding

Defaulters by class (top 5)

Recent payments (with exceptions flagged)

Import health: duplicates, missing phone numbers

Attendance completion (today)

Results status: pending score entry, ready to publish

Messages: campaigns sent, failed deliveries

Upcoming events (calendar)

Quick actions:

Generate term invoices

Send defaulter reminders

Approve payment proofs

Publish results (if ready)

Invite staff

Promote students (end-of-term)

Setup hub highlights (first-run focus)

Setup progress card with stepper and next action

Inline previews for branding and fee schedule snapshots

Compact action bar for mobile to continue the wizard

C) Students & Parents module

Key screens:

Student list (filters: class, status, fees outstanding, attendance risk)

Student profile tabs:

Overview (bio, class, parent contacts)

Billing (invoices, breakdown, receipts, balance)

Attendance (trend)

Results (term history)

Behavior/notes (optional)

Documents (optional)

Parent management:

Parent list (dedupe by phone/email)

Parent profile: linked children, communication preferences, message history

Bulk actions:

Import students/parents (CSV)

Class promotions wizard

Bulk assign class

Bulk message parents of a class

D) Staff & Roles

Staff directory

Invite staff (email/phone)

Roles (Admin, Bursar, Teacher, etc.)

Permission matrix editor (advanced)

Audit log view for sensitive actions

E) Academics setup

Sessions & Terms setup

Class years / arms / groups

Subjects per class (secondary)

Assessment policy setup (weights, grading scales)

Timetable builder (optional add-on)

Setup wizard flow (first-run)

Branding → Academic structure → Staff & roles → Import students/parents (upload → map → review → results)

Fees setup → Payments → Communications → Review → Go live

F) Fees & Billing (the powerhouse)

Screens:

Fee Items Catalog

Tuition, PTA, Uniform, Books, Bus, Lunch, etc.

Required vs optional

Category + descriptions

Fee Schedules (per class/year per term)

Create schedule: “JSS1 – 1st Term”

Add line items + amounts + due dates

Preview parent view fee breakdown

Invoices

Generate invoices for:

whole school

by class

single student

Invoice list filters:

status, class, outstanding range, due date

Invoice detail:

breakdown + adjustments + payment history + audit trail

Discounts/Scholarships

Discount rules setup (sibling, early payment)

Manual waivers (approval workflow)

Installments

Offer templates 60/40, 40/30/30

Track installment status per student

G) Payments & Reconciliation

Payments feed: online confirmed, manual pending approval

Proof review queue (approve/reject + note)

Dispute handling: mark disputed, request clarification

Exports: term collections, by fee item, by class

Finance audit trail

Payments overview: summary, recent transactions, receipts

Transactions list + detail: filters, CSV export, receipt download, proof timeline

Receipts manager: search, upload PDF, download, CSV export (with parent contacts)

Defaulters dashboard: filters + CSV export

Manual payment entry: invoice lookup + proof upload

H) Results & Report Cards

Score entry progress dashboard (by class/subject)

Moderation view (lock/unlock)

Report card templates:

primary skills ratings + comments

secondary subject scores + GPA (optional)

Result release policy:

schedule release date

fee gating rule (min % paid)

I) Communication Hub

Templates (SMS/WhatsApp later)

Campaign builder:

target: all parents / class / defaulters

schedule send

preview

Delivery tracking & failures

Announcement composer:

attach documents

push to home page + notify parents

I2) Support & Disputes

Support queue (parent tickets)

Ticket detail view (status updates + replies)

SLA badges by category

J) Reports & Analytics

Collections trend per term

Defaulters aging

Student attendance risk list

Academic performance summaries

Staff activity (attendance completion, score entry completion)

Export center (CSV/PDF)

K) Settings (School)

Branding (logo/colors)

Home page sections editor

Domain settings (subdomain + later custom domain)

Provider configs (payments, SMS)

Data retention & privacy

Term rollover (close term, archive, promote, generate next invoices)

3. Teacher Frontend (Mobile-first “Daily Work App”)

URL: schoolSlug.classpoint.ng/teacher

A) Teacher Dashboard (“Today”)

My classes + subjects today

Attendance pending (tap to complete)

Assessments pending grading

Announcements (staff)

Quick links: take attendance, enter scores, class notes

B) Attendance flow (1-minute UX)

Select class → list of students

Tap present/absent (default present toggle option)

Mark late/excused

Save → shows completion badge

Offline-friendly caching (optional but great)

C) Assessments & scoring

My assessments list (by class/subject/term)

Enter scores grid (fast table)

Auto totals + grade

Save draft vs submit

Lock awareness (once locked can request unlock)

D) Class management

Roster view

Student quick profile (limited):

photo/name

attendance trend

fee clearance indicator (optional — but careful)

Behavior notes / comments (if enabled)

Homework/assignments (lightweight)

E) Messaging (teacher-to-parent) — optional

I recommend v1 teacher messaging be restricted:

Teacher can send only pre-approved templates to parents of their class

All messages are logged
This avoids drama and keeps school control.

4. Parent / Student Frontend (Portal + WhatsApp link experience)

URL: schoolSlug.classpoint.ng (public home) → login to .../portal

A) The “no-login” parent experience (mass adoption)

Parents receive SMS/WhatsApp link:

“Your child’s invoice is ready”

link opens invoice breakdown view with OTP (optional)

Parent can pay, download receipt, see balance
This is key for Nigeria: not everyone wants accounts/passwords.

B) Parent dashboard (after login)

Children cards (each child status)

Outstanding balances per child

Quick actions:

Pay now

Download receipt

View results

Message history

View announcements/calendar

Support tickets (raise issue + track responses)

C) Fees & breakdown view (must be beautiful)

For each child:

Term invoice summary

Itemized breakdown (clear categories)

Required vs optional items

Discounts/waivers shown clearly

Installment schedule (if applicable)

Payment history + receipts

“Ask for clarification” / dispute button (routes to bursar queue)

D) Results & report cards

Term selector

Report card view + PDF download

Teacher comments

Result release gating messaging if blocked (fee policy)

E) Attendance & wellbeing

Monthly attendance summary

Absence alerts (optional)

Behavior notes (optional)

F) Announcements & calendar

School announcements feed

Events calendar

Attachments (PDFs)

G) Student portal (secondary priority)

If you enable student accounts:

Timetable

Assignments/homework

Results

Announcements

(No payments)

Full feature list (ClassPoint School Operating System)
Core OS pillars

1. Tenant & Identity

Multi-tenant schools (subdomains)

Role-based access control (RBAC)

Invitations + MFA (admins)

Audit logs (sensitive actions)

2. School Branding + Home Page

Per-school landing page

Announcements + calendar on public page

Theme customization (logo/colors/hero)

3. Student & Parent Management

Student records + enrollment history

Parent linking (multiple children)

Bulk import + validation + dedupe

Promotions/graduations

4. Fees, Billing & Payments (best-selling pillar)

Fee items catalog

Fee schedules per class/year per term/session

Parent-friendly fee breakdowns

Optional items selection (uniform/books/bus)

Discounts (sibling, early payment, scholarship/waiver)

Installments (60/40, 40/30/30 + custom later)

Payment gateway + receipts

Manual payments + proof approvals

Defaulters dashboard + reminders

Reconciliation + exports

5. Communication Hub

Announcements (targeted)

SMS (Twilio) now, WhatsApp later

Template-based campaigns

Delivery tracking + retries

Parent preference management

6. Academics

Attendance (class daily)

Subjects + class mapping

Assessment policies + grading scales

Score entry + moderation/locking

Report cards (primary + secondary templates)

Results release scheduling

Fee gating rule (optional)

7. Reporting & Analytics

Collections + outstanding aging

Class performance summaries

Attendance risk list

Staff completion metrics

Export center

Add-ons (schools select extra features)
Admissions

Online application forms

Applicant pipeline

Entrance exam/interview scheduling

Offer letters + acceptance tracking

Transport

Routes + bus fees

Transport enrollment + attendance

Driver/bus records

Inventory/Store

Uniform/book sales

Stock management

Student billing integration

Timetable

Drag/drop timetable builder

Teacher schedules

Clinic/Medical (strict permissions)

Medical notes + consent

Incident logs

Gate pass / Visitor management (premium)

QR visitor logs

Pickup authorization
