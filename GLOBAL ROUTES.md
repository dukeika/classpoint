Global routes (all authenticated users)

Dashboard Shell layout: Sidebar (collapsible) + TopBar (Search, Notifications, Profile) + Content.

/ → Redirect to role home

/dashboard → Role home (alias)

/notifications

/notifications/all

/notifications/settings

/search (optional standalone on mobile)

/profile

/profile/edit

/profile/security (password/MFA if allowed)

/profile/preferences (language, theme, sidebar pinned items)

/help

/help/quick-guides

/help/contact-support

/403 /404 /500

1. Application Admin (Platform) Sitemap

Base: admin.classpoint.ng (or /platform namespace)

Home

/platform/dashboard

Schools (Tenants)

/platform/schools

/platform/schools/new

/platform/schools/:schoolId/overview

/platform/schools/:schoolId/domains

/platform/schools/:schoolId/subscription

/platform/schools/:schoolId/addons

/platform/schools/:schoolId/users

/platform/schools/:schoolId/usage

/platform/schools/:schoolId/audit

/platform/schools/:schoolId/support

/platform/schools/:schoolId/support/impersonate (read-only; shows banner)

Plans & Add-ons Catalog

/platform/plans

/platform/plans/new

/platform/plans/:planId

/platform/addons

/platform/addons/new

/platform/addons/:addonId

/platform/feature-flags (global defaults)

Providers (Global templates)

/platform/providers

/platform/providers/payments

/platform/providers/messaging

/platform/providers/email

Platform Billing (ClassPoint → schools)

/platform/billing

/platform/billing/invoices

/platform/billing/invoices/:invoiceId

/platform/billing/payments

/platform/billing/revenue

Analytics & Monitoring

/platform/analytics

/platform/analytics/schools

/platform/analytics/messaging

/platform/analytics/payments

/platform/status

/platform/status/incidents

/platform/status/logs (links to dashboards)

Security & Audit

/platform/security

/platform/security/audit

/platform/security/access (admin accounts)

/platform/security/keys (read-only references to secrets, not values)

Support Ops

/platform/support

/platform/support/tickets

/platform/support/announcements (platform-wide notices)

2. School Admin (Tenant) Sitemap

Base: https://{schoolSlug}.classpoint.ng/admin

Home

/admin/dashboard

Setup Wizard (first-run)

/admin/setup

/admin/setup/branding

/admin/setup/academic-structure

/admin/setup/staff-roles

/admin/setup/import

/admin/setup/import/upload

/admin/setup/import/map

/admin/setup/import/review

/admin/setup/import/results

/admin/setup/fees

/admin/setup/payments

/admin/setup/communications

/admin/setup/review

/admin/setup/go-live

Legacy setup routes (to be removed after migration)

/admin/setup/staff-invites

/admin/setup/import/students-parents

Students & Parents

/admin/students

/admin/students/new

/admin/students/import

/admin/students/:studentId/overview

/admin/students/:studentId/enrollment

/admin/students/:studentId/billing

/admin/students/:studentId/attendance

/admin/students/:studentId/results

/admin/students/:studentId/documents

/admin/parents

/admin/parents/:parentId/overview

/admin/parents/:parentId/children

/admin/parents/:parentId/messages

Staff & Roles

/admin/staff

/admin/staff/invite

/admin/staff/:userId/overview

/admin/staff/:userId/roles

/admin/staff/:userId/activity

/admin/roles

/admin/roles/new

/admin/roles/:roleId

/admin/permissions (view matrix)

Academics (Structure)

/admin/academics

/admin/academics/sessions-terms

/admin/academics/classes

/admin/academics/classes/class-years

/admin/academics/classes/arms

/admin/academics/classes/groups

/admin/academics/subjects

/admin/academics/class-subjects

/admin/academics/timetable (add-on)

Attendance

/admin/attendance

/admin/attendance/overview

/admin/attendance/by-class

/admin/attendance/reports

Fees & Billing (Core)

/admin/fees

/admin/fees/items

/admin/fees/items/new

/admin/fees/items/:feeItemId

/admin/fees/schedules

/admin/fees/schedules/new

/admin/fees/schedules/:scheduleId

/admin/fees/schedules/:scheduleId/preview-parent-view

/admin/fees/invoices

/admin/fees/invoices/generate

/admin/fees/invoices/:invoiceId

/admin/fees/invoices/:invoiceId/adjustments

/admin/fees/discounts

/admin/fees/installments

Payments & Reconciliation

/admin/payments

/admin/payments/overview

/admin/payments/transactions

/admin/payments/transactions/:paymentTxnId

/admin/payments/proofs

/admin/payments/proofs/:proofId/review

/admin/payments/defaulters

/admin/payments/reconciliation

/admin/payments/exports

/admin/payments/receipts

Results & Report Cards

/admin/results

/admin/results/assessment-policies

/admin/results/assessments

/admin/results/score-entry-progress

/admin/results/moderation (lock/unlock)

/admin/results/report-cards

/admin/results/publish

/admin/results/release-policy

Communication Hub

/admin/comms

/admin/comms/announcements

/admin/comms/announcements/new

/admin/comms/announcements/:announcementId

/admin/comms/calendar

/admin/comms/calendar/new

/admin/comms/calendar/:eventId

/admin/comms/templates

/admin/comms/campaigns

/admin/comms/campaigns/new

/admin/comms/campaigns/:campaignId

/admin/comms/campaigns/:campaignId/recipients

/admin/comms/campaigns/:campaignId/stats

Support & Disputes

/admin/support

/admin/support/:ticketId

Add-ons (Feature-gated)

/admin/admissions (add-on)

/admin/admissions/applications

/admin/admissions/applications/:applicationId

/admin/admissions/settings

/admin/transport (add-on)

/admin/transport/routes

/admin/transport/enrollments

/admin/inventory (add-on)

/admin/inventory/items

/admin/inventory/stock

/admin/inventory/sales

Reports & Analytics

/admin/reports

/admin/reports/collections

/admin/reports/outstanding-aging

/admin/reports/attendance

/admin/reports/performance

/admin/reports/staff-activity

/admin/reports/export-center

Settings

/admin/settings

/admin/settings/school-profile

/admin/settings/branding

/admin/settings/homepage

/admin/settings/domains (subdomain + later custom domain)

/admin/settings/providers

/admin/settings/providers/payments

/admin/settings/providers/sms (Twilio)

/admin/settings/providers/whatsapp (placeholder/disabled)

/admin/settings/security

/admin/settings/audit

/admin/settings/term-rollover

3. Teacher Sitemap (Mobile-first)

Base: https://{schoolSlug}.classpoint.ng/teacher

Home

/teacher/dashboard

My Classes & Subjects

/teacher/classes

/teacher/classes/:classGroupId/roster

/teacher/classes/:classGroupId/student/:studentId (limited view)

Attendance (fast flows)

/teacher/attendance

/teacher/attendance/take (wizard)

/teacher/attendance/take/:classGroupId/:date

/teacher/attendance/history

/teacher/attendance/history/:classGroupId/:date

Assessments & Scores

/teacher/assessments

/teacher/assessments/new (if allowed)

/teacher/assessments/:assessmentId

/teacher/assessments/:assessmentId/score-entry

/teacher/assessments/:assessmentId/submit

/teacher/results

/teacher/results/progress (what’s pending)

/teacher/results/class/:classGroupId

Announcements & Calendar

/teacher/comms

/teacher/comms/announcements

/teacher/comms/calendar

(Optional feature) Teacher notes / behavior

/teacher/notes

/teacher/notes/class/:classGroupId

/teacher/notes/student/:studentId

4. Parent / Student Portal Sitemap (Mobile-first)

Base: https://{schoolSlug}.classpoint.ng/portal

Public school home (no login)

/ (public home page)

/announcements (public feed)

/calendar (public calendar)

/login

Parent Portal (authenticated)

/portal/dashboard

/portal/children

/portal/children/:studentId/overview

/portal/children/:studentId/fees

/portal/children/:studentId/fees/invoices

/portal/children/:studentId/fees/invoices/:invoiceId (breakdown)

/portal/children/:studentId/fees/pay/:invoiceId

/portal/children/:studentId/fees/receipts/:receiptId

/portal/children/:studentId/attendance

/portal/children/:studentId/results

/portal/children/:studentId/results/:termId

/portal/children/:studentId/report-card/:reportCardId

/portal/announcements

/portal/calendar

/portal/messages (delivery history + school contact)

/portal/support (raise ticket/dispute payment)

/portal/support/new

/portal/support/:ticketId

Student Portal (optional; only if student accounts enabled)

/student/dashboard

/student/timetable (add-on)

/student/assignments (add-on)

/student/results

/student/announcements

/student/calendar

Cross-cutting UI requirements (apply to all routes)

Every route uses DashboardShell except public pages.

Sidebar items are generated from permission codes (can(permission)).

Mobile:

list views become card lists

tables use drill-down detail pages

key actions can appear as sticky bottom button

Show user display name everywhere, never internal IDs.

Add feature gating:

menus hidden if add-on disabled

backend still enforces permissions
