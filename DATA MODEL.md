Full data model (ClassPoint)

I’m going to model this as a multi-tenant SaaS where almost every record is scoped by schoolId (tenant). Only platform configuration lives outside tenants.

Conventions:

PK: primary key (UUID/ULID)

FK: foreign key

schoolId present on all tenant data

Recommended unique constraints called out explicitly

“Soft delete” optional: deletedAt

A) Platform-level (global) entities

1. PlatformUser

For HQ staff (application admin/support).

PK: platformUserId

email (unique), name, phone, status (ACTIVE/SUSPENDED)

mfaEnabled, lastLoginAt, createdAt

2. School

Tenant root record.

PK: schoolId

name

slug (unique) → used for subdomain: {slug}.classpoint.ng

status (PROVISIONING/ACTIVE/SUSPENDED/CLOSED)

primaryCity (Lagos/Port Harcourt/Calabar/Other)

createdAt, activatedAt

Unique: slug

3. SchoolDomain

Subdomain/custom domain mapping.

PK: domainId

FK: schoolId

type (SUBDOMAIN/CUSTOM_DOMAIN)

hostname (unique) e.g., greenville.classpoint.ng

verified (bool), verifiedAt

Unique: hostname

4. Plan

Subscription plan catalog (Fees/Core/Plus).

PK: planId

code (unique), name, description

billingCycle (TERM/SESSION/YEAR)

basePrice (numeric), currency (NGN)

status (ACTIVE/RETIRED)

Unique: code

5. AddOn

Add-on catalog (Transport, Admissions, Inventory…).

PK: addOnId

code (unique), name, description

pricingModel (PER_STUDENT_PER_TERM / PER_SCHOOL_PER_TERM / FLAT)

price

status (ACTIVE/RETIRED)

Unique: code

6. SchoolSubscription

School’s active plan + add-ons.

PK: subscriptionId

FK: schoolId, planId

status (TRIAL/ACTIVE/PAST_DUE/SUSPENDED/CANCELLED)

startAt, endAt, renewalAt

gracePeriodDays

notes

7. SchoolSubscriptionAddOn

Join table: enabled add-ons for a school.

PK: schoolSubscriptionAddOnId

FK: subscriptionId, addOnId

status (ACTIVE/INACTIVE)

effectiveAt

8. ProviderConfig

Global provider settings per school (payment + messaging).

PK: providerConfigId

FK: schoolId

type (PAYMENT_GATEWAY/WHATSAPP/SMS/EMAIL)

providerName (Paystack/Flutterwave/Twilio/etc.)

configJson (encrypted at rest)

status (ACTIVE/DISABLED)

createdAt

9. SupportTicket

PK: ticketId

FK: schoolId

parentId

studentId (optional)

subject, category, detail

status (OPEN/IN_REVIEW/RESOLVED/CLOSED)

createdAt, updatedAt

10. SupportTicketMessage

PK: messageId

FK: schoolId

ticketId

authorType (PARENT/STAFF)

authorId

body

createdAt

B) Tenant identity, roles & audit 11) User

Tenant user identity (staff/parents/students if you allow login).

PK: userId

FK: schoolId

email (unique within school), phone (unique within school, optional)

name, userType (SCHOOL_ADMIN/STAFF/PARENT/STUDENT)

status (INVITED/ACTIVE/SUSPENDED)

lastLoginAt, createdAt

Unique: (schoolId, email), optionally (schoolId, phone)

11. Role

PK: roleId

FK: schoolId

name (e.g., Admin, Bursar, Teacher)

isSystemRole (bool)

12. Permission

Platform-defined permissions (global list).

PK: permissionId

code (unique) e.g., FEES.WRITE, RESULTS.PUBLISH

description

Unique: code

13. RolePermission

PK: rolePermissionId

FK: roleId, permissionId

14. UserRole

PK: userRoleId

FK: userId, roleId

Unique: (userId, roleId)

15. AuditEvent

Extremely important for trust (fee adjustments, results edits).

PK: auditEventId

FK: schoolId

actorUserId (nullable if system)

action (string code)

entityType, entityId

beforeJson, afterJson (optional)

ipAddress, userAgent

createdAt

Index: (schoolId, createdAt), (schoolId, entityType, entityId)

C) School branding + public home page 16) SchoolProfile

PK: schoolProfileId

FK: schoolId

address, city, state

contactEmail, contactPhone

logoUrl, heroImageUrl

themeJson (colors, fonts)

updatedAt

17. SchoolHomePageSection

Simple CMS sections.

PK: sectionId

FK: schoolId

type (HERO/ABOUT/FEATURES/ANNOUNCEMENTS/CALENDAR/ADMISSIONS_CTA/FOOTER)

contentJson

sortOrder

isEnabled

18. Announcement

PK: announcementId

FK: schoolId

title, body, audience (ALL/PARENTS/STAFF/CLASS_ONLY)

classGroupId (nullable)

publishedAt, expiresAt (nullable)

attachmentsJson (optional)

19. CalendarEvent

PK: eventId

FK: schoolId

title, description

startAt, endAt

audience (ALL/PARENTS/STAFF/CLASS_ONLY)

classGroupId (nullable)

D) Academic structure 20) AcademicSession

E.g., 2025/2026

PK: sessionId

FK: schoolId

name, startDate, endDate

status (ACTIVE/ARCHIVED)

21. Term

E.g., 1st/2nd/3rd term

PK: termId

FK: schoolId, sessionId

name, startDate, endDate

status (UPCOMING/ACTIVE/CLOSED)

22. Level

Primary/Secondary subdivisions (optional but useful).

PK: levelId

FK: schoolId

type (PRIMARY/SECONDARY)

name (e.g., Primary, Secondary)

23. ClassYear

The “year” grouping: Primary 1, JSS1, SSS3…

PK: classYearId

FK: schoolId, levelId

name (e.g., “Primary 1”)

sortOrder

Unique: (schoolId, name)

24. ClassArm

Arms/streams: A/B/C

PK: classArmId

FK: schoolId

name (e.g., “A”)

Unique: (schoolId, name)

25. ClassGroup

Concrete class bucket: “Primary 1A”

PK: classGroupId

FK: schoolId, classYearId, classArmId (arm optional)

displayName (computed)

classTeacherUserId (nullable)

Unique: (schoolId, classYearId, classArmId)

26. Subject

PK: subjectId

FK: schoolId

name, code (optional), levelType (PRIMARY/SECONDARY/BOTH)

Unique: (schoolId, name)

27. ClassSubject

Which subjects apply to which class year/group.

PK: classSubjectId

FK: schoolId, classYearId (or classGroupId if more granular), subjectId

isCompulsory (bool)

E) Students, parents, enrollment 28) Student

PK: studentId

FK: schoolId

admissionNo (unique within school)

firstName, lastName, dob, gender

photoUrl (optional)

status (ACTIVE/TRANSFERRED/GRADUATED/ARCHIVED)

Unique: (schoolId, admissionNo)

29. ParentGuardian

(You can model parents as User with type PARENT, but keeping a profile table helps.)

PK: parentId

FK: schoolId, userId (nullable if parent doesn’t log in yet)

fullName, primaryPhone, email

preferredChannel (WHATSAPP/SMS/EMAIL)

optedOut (bool), optedOutChannels ([channel])

status (ACTIVE/INACTIVE)

30. StudentParentLink

PK: linkId

FK: schoolId, studentId, parentId

relationship (MOTHER/FATHER/GUARDIAN/OTHER)

isPrimary (bool)

Unique: (schoolId, studentId, parentId)

31. Enrollment

A student’s class for a term/session.

PK: enrollmentId

FK: schoolId, studentId, sessionId, termId, classGroupId

status (ENROLLED/WITHDRAWN)

Unique: (schoolId, studentId, termId)

F) Fees, breakdowns, invoices, payments 32) FeeItem

Atomic fee line parents understand.

PK: feeItemId

FK: schoolId

name (e.g., Tuition)

description (optional)

category (TUITION/LEVY/UNIFORM/BOOKS/TRANSPORT/LUNCH/EXAM/OTHER)

isOptional (bool)

isActive (bool)

Unique: (schoolId, name)

33. FeeSchedule

Defines fees for a specific class year (or group) for a specific term/session.

PK: feeScheduleId

FK: schoolId, sessionId, termId, classYearId (or classGroupId)

name (e.g., “Primary 3 – 1st Term Fees”)

currency (NGN)

isActive

Unique: (schoolId, termId, classYearId) (or classGroupId)

34. FeeScheduleLine

The breakdown lines with amounts.

PK: feeScheduleLineId

FK: schoolId, feeScheduleId, feeItemId

amount

isOptionalOverride (nullable) (lets schedule override item optionality)

dueDate (optional)

sortOrder

35. DiscountRule (optional but attractive)

PK: discountRuleId

FK: schoolId

type (SIBLING/EARLY_PAYMENT/SCHOLARSHIP/FIXED_CUSTOM)

valueType (PERCENT/FIXED)

value

criteriaJson (e.g., “>=2 siblings”, “before date”)

isActive

36. Invoice

Generated per student per term.

PK: invoiceId

FK: schoolId, studentId, enrollmentId, termId, sessionId

invoiceNo (unique within school)

status (DRAFT/ISSUED/PARTIALLY_PAID/PAID/VOID)

issuedAt, dueAt (optional)

classGroupId (for defaulter/class reporting)

Derives from Enrollment when `createInvoice` is called without a classGroupId.

requiredSubtotal, optionalSubtotal, discountTotal, penaltyTotal

amountPaid, amountDue

Unique: (schoolId, invoiceNo)

Index: (schoolId, studentId, termId)

Index: (termId, classGroupId)

37. InvoiceLine

Breakdown lines shown to parents.

PK: invoiceLineId

FK: schoolId, invoiceId, feeItemId

label (freeze name at time of invoicing)

description (optional)

amount

isOptional

isSelected (if optional items can be chosen)

Selection toggled by selectInvoiceOptionalItems; optionalSubtotal uses selected optional lines.

sortOrder

38. PaymentIntent

Represents an attempt to pay (gateway session).

PK: paymentIntentId

FK: schoolId, invoiceId, payerParentId (nullable)

provider (Paystack/Flutterwave)

amount, currency

status (INITIATED/PENDING/SUCCEEDED/FAILED/CANCELLED)

externalReference (gateway ref)

createdAt

39. ReceiptCounter

Tracks per-school receipt sequencing.

PK: schoolId

SK: id ("receipt")

lastSeq

updatedAt

40. PaymentTransaction

Stores confirmed money movement.

PK: paymentTxnId

FK: schoolId, paymentIntentId (nullable), invoiceId

method (CARD/TRANSFER/USSD/CASH/MANUAL)

amount, currency

status (PENDING/CONFIRMED/REVERSED/REFUNDED)

paidAt

reference (bank/gateway ref)

receiptNo (generated on confirmation)

recordedByUserId (for manual)

Index: (schoolId, reference)
Query: paymentsBySchool (schoolId), paymentsByInvoice (invoiceId)

41. Receipt

Record of issued receipt per payment.

PK: schoolId

SK: receiptNo (id)

FK: schoolId, invoiceId

paymentReference

amount, currency

paidAt

createdAt

Index: byInvoiceReceipt (invoiceId, createdAt)

receiptUrl (optional PDF link)

receiptBucket (S3 bucket)

receiptKey (S3 key)

Query: receiptsBySchool (schoolId), receiptsByInvoice (invoiceId), receiptByNumber (schoolId + receiptNo)

42. PaymentAllocation

If a payment covers multiple invoices (rare, but useful).

PK: allocationId

FK: schoolId, paymentTxnId, invoiceId

amountAllocated

43. ManualPaymentProof

Proof uploads for transfers/cash.

PK: proofId

FK: schoolId, paymentTxnId

fileUrl, submittedByParentId

status (SUBMITTED/APPROVED/REJECTED)

Query: proofsByPayment (paymentTxnId), manualPaymentProofsBySchool (schoolId)

reviewedByUserId, reviewedAt, notes

44. FeeAdjustment

Discounts, waivers, penalties, reversals (audited).

PK: adjustmentId

FK: schoolId, invoiceId

type (DISCOUNT/WAIVER/PENALTY/REVERSAL)

amount (positive number)

reason

createdByUserId, createdAt

approvedByUserId (optional workflow), approvedAt

45. InstallmentPlan (optional but very attractive)

PK: installmentPlanId

FK: schoolId, invoiceId

status (ACTIVE/COMPLETED/CANCELLED)

totalAmount

createdAt

46. Installment

PK: installmentId

FK: schoolId, installmentPlanId

sequenceNo

amount

dueAt

status (DUE/PAID/OVERDUE)

G) Messaging & campaigns (WhatsApp/SMS/email) 45) MessageTemplate

PK: templateId

FK: schoolId

type (FEE_REMINDER/PAYMENT_RECEIPT/ANNOUNCEMENT/RESULT_READY/etc.)

channel (WHATSAPP/SMS/EMAIL/IN_APP)

subject (email), body

variablesJson (e.g., {parentName, studentName, amountDue})

isActive

48. MessageCampaign

Bulk sends (defaulters blasts, announcements).

PK: campaignId

FK: schoolId

name, type, channel

createdByUserId

status (DRAFT/SCHEDULED/SENDING/COMPLETED/CANCELLED)

scheduledAt, createdAt

audienceJson (filters: classGroup, defaulters, etc.)

49. MessageRecipient

PK: recipientId

FK: schoolId, campaignId, parentId (or userId)

destination (phone/email)

  status (PENDING/SENT/DELIVERED/FAILED)

  statusHistory (list of {status, at, providerMessageId})

  providerMessageId

lastUpdatedAt

H) Attendance 48) AttendanceSession

PK: attendanceSessionId

FK: schoolId, termId, classGroupId

date

takenByUserId

Unique: (schoolId, classGroupId, date)

51. AttendanceEntry

PK: attendanceEntryId

FK: schoolId, attendanceSessionId, studentId

status (PRESENT/ABSENT/LATE/EXCUSED)

notes (optional)

I) Assessments, results, report cards 50) AssessmentPolicy

Weights and components per level/class.

PK: policyId

FK: schoolId

name

appliesTo (PRIMARY/SECONDARY/BOTH)

componentsJson (e.g., [{name:"CA1", weight:10}, …])

gradingScaleJson (A=70–100, etc.)

isActive

53. Assessment

An assessment instance per subject/class/term.

PK: assessmentId

FK: schoolId, termId, classGroupId, subjectId, policyId

title (e.g., “1st Term Assessment”)

status (OPEN/SUBMITTED/LOCKED)

54. ScoreEntry

PK: scoreEntryId

FK: schoolId, assessmentId, studentId

scoresJson (per component)

totalScore

grade

enteredByUserId, enteredAt

Unique: (schoolId, assessmentId, studentId)

55. ReportCard

Generated per student per term.

PK: reportCardId

FK: schoolId, studentId, termId, classGroupId

status (DRAFT/READY/PUBLISHED)

teacherComment, headComment

attendanceSummaryJson

publishedAt

56. ResultReleasePolicy

Fee gating rules.

PK: releasePolicyId

FK: schoolId

isEnabled

minimumPaymentPercent (0–100)

messageToParent

appliesTo (ALL/SECONDARY_ONLY/etc.)

J) Add-ons framework (feature toggles) 55) FeatureFlag

Computed flags per school (derived from subscription + add-ons).

PK: featureFlagId

FK: schoolId

code (e.g., TRANSPORT.ENABLED)

isEnabled

Unique: (schoolId, code)

(When a school buys an add-on, your system updates these flags automatically.)

K) Optional premium modules (when enabled)
Admissions add-on

AdmissionForm, AdmissionApplicant, EntranceExamSchedule, AdmissionStatusHistory

Transport add-on

Route, Bus, Driver, TransportEnrollment, TransportAttendance

Inventory add-on

Item, StockMovement, Sale, SaleLine

Data integrity rules (non-negotiable)

Tenant boundary: every query filtered by schoolId.

Adjustments and score edits must write AuditEvent.

InvoiceLine.label must be snapshotted at invoice creation (so historical invoices don’t change if fee item names change).

FeeSchedule supports per classYear by default; allow override by classGroup for special arms (e.g., “Science class fees”).

# Access patterns (targeted)

Billing
- Invoice: lookup by schoolId+invoiceNo (human-facing), by studentId+termId (student-term invoices), and by termId+classGroupId (defaulters by class).
- PaymentTransaction: by invoiceId (history) and reference (webhook idempotency).
- Receipt: by invoiceId (receipt history) and by receiptNo (school lookup).
- PaymentIntent: by invoiceId (pending intents); FeeAdjustment: by invoiceId; InstallmentPlan/Installment by invoiceId/planId for schedules.

Messaging
- MessageTemplate: by schoolId+type; MessageCampaign: by schoolId+createdAt.
- MessageRecipient: by campaignId+destination for fanout; by providerMessageId for delivery callbacks/status updates.
- Template types expected for system notifications: PAYMENT_RECEIPT, INVOICE_ISSUED, OVERDUE_NOTICE, RESULT_READY, ANNOUNCEMENT.

Imports
- Student: by schoolId+admissionNo for dedupe; Parent: by schoolId+primaryPhone (email secondary, GSI bySchoolParentEmail).
- Enrollment: by studentId+termId (one active per term) and termId+classGroupId (roster).
- StudentParentLink: by student and by parent for relationship lookups.
