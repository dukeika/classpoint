Permission Matrix for ClassPoint (Default Roles)

This is the role → permission baseline you can implement now (and later allow schools to customize with “Custom Roles” built on these permission codes). I’m splitting it into Platform (global) vs School (tenant) permissions, then giving the default role bundles.

0. Permission code convention

Use a consistent pattern so frontend + backend agree:

<DOMAIN>.<RESOURCE>.<ACTION>.<SCOPE?>

Examples:

FEES.INVOICE.READ.ANY

FEES.INVOICE.READ.CLASS

ACADEMICS.RESULT.PUBLISH

USERS.ROLE.MANAGE

SCHOOL.SETTINGS.UPDATE

Scopes (when needed):

ANY (whole school tenant)

CLASS (only assigned classGroup(s))

OWN (only items the user owns/linked to)

1. Platform roles (ClassPoint HQ)
   Platform resources & actions
   Permission Code What it allows APP_ADMIN PLATFORM_SUPPORT
   PLATFORM.SCHOOL.CREATE Create new schools/tenants ✅ ❌
   PLATFORM.SCHOOL.UPDATE Edit school profile/plan/status ✅ ❌
   PLATFORM.SCHOOL.SUSPEND Suspend/activate tenants ✅ ❌
   PLATFORM.SUBSCRIPTION.MANAGE Plans, add-ons, billing rules ✅ ❌
   PLATFORM.PROVIDERS.MANAGE Configure global payment/messaging providers ✅ ❌
   PLATFORM.ANALYTICS.READ View platform dashboards ✅ ✅
   PLATFORM.SUPPORT.IMPERSONATE Impersonate tenant user (audited) ✅ ✅ (read-only mode preferred)
   PLATFORM.AUDIT.READ Platform-level audit logs ✅ ✅
   PLATFORM.SECURITY.MANAGE Security settings/controls ✅ ❌

Strong rule: PLATFORM_SUPPORT should not be able to change billing/tenant status by default.

2. Tenant roles (inside a school)
   Default tenant roles

SCHOOL_ADMIN (owner/operator)

BURSAR (fees + payments)

ACADEMIC_ADMIN (results + academic structure; often vice principal)

TEACHER (attendance + scoring for assigned classes)

PARENT

STUDENT (optional)

AUDITOR_READONLY (optional)

3. Tenant permission matrix by domain
   A) School settings & branding
   Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN BURSAR TEACHER PARENT STUDENT
   SCHOOL.SETTINGS.READ ✅ ✅ ✅ ✅ ✅ (limited) ✅ (limited)
   SCHOOL.SETTINGS.UPDATE ✅ ❌ ❌ ❌ ❌ ❌
   SCHOOL.BRANDING.UPDATE ✅ ❌ ❌ ❌ ❌ ❌
   SCHOOL.HOMEPAGE.SECTIONS.MANAGE ✅ ❌ ❌ ❌ ❌ ❌
   SCHOOL.TERM.ROLLOVER.EXECUTE ✅ ✅ (optional) ❌ ❌ ❌ ❌

“Limited” for parents/students = public info only (address, announcements, calendar).

B) Users, roles, permissions
Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN BURSAR TEACHER PARENT STUDENT
USERS.USER.READ.ANY ✅ ✅ ✅ ✅ (limited) ❌ ❌
USERS.USER.INVITE ✅ ✅ (staff only) ✅ (accounts staff only) ❌ ❌ ❌
USERS.USER.SUSPEND ✅ ❌ ❌ ❌ ❌ ❌
USERS.ROLE.MANAGE ✅ ❌ ❌ ❌ ❌ ❌
USERS.PERMISSION.MANAGE ✅ ❌ ❌ ❌ ❌ ❌

Teacher limited user read = roster + parent contact visibility based on policy.

C) Academic structure (sessions, terms, classes, subjects)
Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN BURSAR TEACHER PARENT STUDENT
ACADEMICS.STRUCTURE.READ ✅ ✅ ✅ ✅ ✅ (basic) ✅ (basic)
ACADEMICS.STRUCTURE.MANAGE ✅ ✅ ❌ ❌ ❌ ❌
ACADEMICS.SUBJECT.MANAGE ✅ ✅ ❌ ❌ ❌ ❌
ACADEMICS.CLASS_ASSIGN.TEACHERS ✅ ✅ ❌ ❌ ❌ ❌
D) Students & parents (records + enrollment)
Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN BURSAR TEACHER PARENT STUDENT
STUDENTS.READ.ANY ✅ ✅ ✅ ✅ (CLASS) ❌ ❌
STUDENTS.CREATE ✅ ✅ ✅ (optional) ❌ ❌ ❌
STUDENTS.UPDATE ✅ ✅ ❌ ✅ (CLASS notes only) ❌ ❌
STUDENTS.ENROLL.MANAGE ✅ ✅ ❌ ❌ ❌ ❌
PARENTS.READ.ANY ✅ ✅ ✅ ✅ (CLASS limited) ❌ ❌
PARENTS.UPDATE ✅ ✅ ✅ (contact fixes) ❌ ✅ (OWN) ❌
IMPORT.STUDENTS.EXECUTE ✅ ✅ ✅ ❌ ❌ ❌ 4) Fees & finance (core OS pillar)
A) Fee setup (items, schedules)
Permission Code SCHOOL_ADMIN BURSAR ACADEMIC_ADMIN TEACHER PARENT STUDENT
FEES.ITEM.MANAGE ✅ ✅ ❌ ❌ ❌ ❌
FEES.SCHEDULE.MANAGE ✅ ✅ ❌ ❌ ❌ ❌
FEES.SCHEDULE.READ ✅ ✅ ✅ ❌ ✅ (OWN view via invoice) ❌
B) Invoices & adjustments
Permission Code SCHOOL_ADMIN BURSAR ACADEMIC_ADMIN TEACHER PARENT STUDENT
FEES.INVOICE.GENERATE ✅ ✅ ❌ ❌ ❌ ❌
FEES.INVOICE.READ.ANY ✅ ✅ ✅ (optional) ❌ ❌ ❌
FEES.INVOICE.READ.OWN ❌ ❌ ❌ ❌ ✅ ✅ (if student portal)
FEES.INVOICE.UPDATE ✅ ✅ ❌ ❌ ❌ ❌
FEES.ADJUSTMENT.CREATE ✅ ✅ ❌ ❌ ❌ ❌
FEES.ADJUSTMENT.APPROVE ✅ ✅ (if you trust bursar) ❌ ❌ ❌ ❌
FEES.REFUND.INITIATE ✅ ✅ (optional) ❌ ❌ ❌ ❌
FEES.REFUND.APPROVE ✅ ❌ ❌ ❌ ❌ ❌

Best practice: split “create adjustment” and “approve adjustment” if you want dual control.

C) Payments & reconciliation
Permission Code SCHOOL_ADMIN BURSAR ACADEMIC_ADMIN TEACHER PARENT STUDENT
PAYMENTS.READ.ANY ✅ ✅ ❌ ❌ ❌ ❌
PAYMENTS.MANUAL.RECORD ✅ ✅ ❌ ❌ ❌ ❌
PAYMENTS.PROOF.REVIEW ✅ ✅ ❌ ❌ ❌ ❌
PAYMENTS.RECONCILE.EXPORT ✅ ✅ ❌ ❌ ❌ ❌
RECEIPTS.DOWNLOAD.OWN ❌ ❌ ❌ ❌ ✅ ✅ (optional) 5) Academics (attendance, assessments, results)
A) Attendance
Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN TEACHER BURSAR PARENT STUDENT
ATTENDANCE.TAKE.CLASS ✅ ✅ ✅ (CLASS) ❌ ❌ ❌
ATTENDANCE.EDIT.CLASS ✅ ✅ ✅ (CLASS, within window) ❌ ❌ ❌
ATTENDANCE.READ.ANY ✅ ✅ ✅ (CLASS) ✅ (optional) ✅ (OWN) ✅ (OWN)
ATTENDANCE.LOCK.DAY ✅ ✅ ❌ ❌ ❌ ❌
B) Assessments & score entry
Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN TEACHER BURSAR PARENT STUDENT
ASSESSMENT.POLICY.MANAGE ✅ ✅ ❌ ❌ ❌ ❌
ASSESSMENT.CREATE ✅ ✅ ✅ (CLASS/SUBJECT) ❌ ❌ ❌
SCORES.ENTER ✅ ✅ ✅ (CLASS/SUBJECT) ❌ ❌ ❌
SCORES.EDIT.AFTER_SUBMIT ✅ ✅ ❌ (request unlock) ❌ ❌ ❌
SCORES.LOCK ✅ ✅ ❌ ❌ ❌ ❌
C) Results publishing & report cards
Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN TEACHER BURSAR PARENT STUDENT
RESULTS.VIEW.ANY ✅ ✅ ✅ (CLASS) ❌ ❌ ❌
RESULTS.PUBLISH ✅ ✅ ❌ ❌ ❌ ❌
RESULTS.RELEASE_POLICY.MANAGE ✅ ✅ ❌ ❌ ❌ ❌
REPORTCARD.DOWNLOAD.OWN ❌ ❌ ❌ ❌ ✅ ✅ 6) Communication (announcements + campaigns)
A) Announcements
Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN BURSAR TEACHER PARENT STUDENT
COMMS.ANNOUNCEMENT.CREATE ✅ ✅ ✅ (billing-only) ✅ (class-only) ❌ ❌
COMMS.ANNOUNCEMENT.PUBLISH ✅ ✅ ✅ (billing-only) ❌ ❌ ❌
COMMS.ANNOUNCEMENT.READ ✅ ✅ ✅ ✅ ✅ ✅
B) Campaigns (SMS now, WhatsApp later)
Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN BURSAR TEACHER PARENT STUDENT
COMMS.CAMPAIGN.CREATE ✅ ✅ ✅ ❌ (unless enabled) ❌ ❌
COMMS.CAMPAIGN.SEND ✅ ✅ ✅ ❌ ❌ ❌
COMMS.CAMPAIGN.VIEW_STATS ✅ ✅ ✅ ❌ ❌ ❌
COMMS.TEMPLATE.MANAGE ✅ ✅ ✅ (billing templates only) ❌ ❌ ❌

Recommendation: keep teacher campaigns OFF by default; allow only “teacher-to-parent templates” later if needed.

7. Reports & exports
   Permission Code SCHOOL_ADMIN ACADEMIC_ADMIN BURSAR TEACHER PARENT STUDENT
   REPORTS.FINANCE.READ ✅ ❌ ✅ ❌ ❌ ❌
   REPORTS.ACADEMICS.READ ✅ ✅ ❌ ✅ (CLASS) ✅ (OWN) ✅ (OWN)
   EXPORTS.FINANCE ✅ ❌ ✅ ❌ ❌ ❌
   EXPORTS.ACADEMICS ✅ ✅ ❌ ✅ (CLASS) ❌ ❌
8. Add-ons (feature gated)

When an add-on is enabled, it unlocks a permission set:

Admissions add-on

ADMISSIONS.APPLICATION.READ/UPDATE

ADMISSIONS.APPLICATION.DECIDE
Defaults:

SCHOOL_ADMIN ✅, ACADEMIC_ADMIN ✅, others ❌

Transport add-on

TRANSPORT.ROUTE.MANAGE

TRANSPORT.ENROLLMENT.MANAGE
Defaults:

SCHOOL_ADMIN ✅, BURSAR ✅ (fees tie-in), others ❌

Inventory add-on

INVENTORY.ITEM.MANAGE

INVENTORY.STOCK.MOVE

INVENTORY.SALE.MANAGE
Defaults:

SCHOOL_ADMIN ✅, BURSAR ✅, others ❌

9. Row-level rules (the “real” tenant isolation + correctness layer)

Even with RBAC, enforce these data-level constraints everywhere:

Teacher: can only access students, attendance, and scores for their assigned classGroupId (and subjects).

Parent: can only access children linked via StudentParentLink.

Student: can only access own profile/results (no sibling access).

Bursar: can’t edit results; Academic Admin can’t adjust invoices unless explicitly granted.

10. Suggested default role bundles (quick summary)

SCHOOL_ADMIN: full tenant control (minus platform).

BURSAR: fees, invoices, payments, reminders, finance reports.

ACADEMIC_ADMIN: academics setup, results publishing, attendance oversight, academic reports.

TEACHER: attendance + scoring for assigned class/subjects only.

PARENT/STUDENT: own invoices/receipts/results/announcements only.
