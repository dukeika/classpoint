# ============================================================

# ClassPoint — Multi-tenant (School = Tenant) GraphQL Schema

# Target: AWS AppSync / Amplify @model-style schema

#

# Key tenancy rule:

# - Every tenant-scoped model includes: schoolId: ID!

# - Auth pattern assumes Cognito token contains custom claim: custom:schoolId

# and uses ownerField="schoolId" to enforce tenant isolation.

#

# NOTE:

# - Fine-grained “role can do X” is best enforced via:

# (a) app layer checks + RBAC permissions tables, and/or

# (b) custom resolvers/Lambda authorizer.

# This schema provides strong tenant isolation + basic admin controls.

# ============================================================

# ------------------------------

# Scalars

# ------------------------------

scalar AWSDate
scalar AWSDateTime
scalar AWSJSON
scalar AWSEmail
scalar AWSPhone

# ------------------------------

# Enums

# ------------------------------

enum SchoolStatus { PROVISIONING ACTIVE SUSPENDED CLOSED }
enum SubscriptionStatus { TRIAL ACTIVE PAST_DUE SUSPENDED CANCELLED }
enum DomainType { SUBDOMAIN CUSTOM_DOMAIN }

enum UserType { SCHOOL_ADMIN STAFF PARENT STUDENT }
enum UserStatus { INVITED ACTIVE SUSPENDED }

enum AudienceType { ALL PARENTS STAFF CLASS_ONLY }

enum FeeCategory { TUITION LEVY UNIFORM BOOKS TRANSPORT LUNCH EXAM OTHER }
enum InvoiceStatus { DRAFT ISSUED PARTIALLY_PAID PAID VOID }

enum PaymentProvider { PAYSTACK FLUTTERWAVE OTHER }
enum PaymentIntentStatus { INITIATED PENDING SUCCEEDED FAILED CANCELLED }
enum PaymentMethod { CARD TRANSFER USSD CASH MANUAL }
enum PaymentTxnStatus { PENDING CONFIRMED REVERSED REFUNDED }

enum ProofStatus { SUBMITTED APPROVED REJECTED }
enum AdjustmentType { DISCOUNT WAIVER PENALTY REVERSAL }

enum AttendanceStatus { PRESENT ABSENT LATE EXCUSED }

enum AssessmentStatus { OPEN SUBMITTED LOCKED }
enum ReportCardStatus { DRAFT READY PUBLISHED }

enum MessageChannel { WHATSAPP SMS EMAIL IN_APP }
enum CampaignStatus { DRAFT SCHEDULED SENDING COMPLETED CANCELLED }
enum DeliveryStatus { PENDING SENT DELIVERED FAILED }

type DeliveryStatusEntry {
  status: DeliveryStatus!
  at: AWSDateTime!
  providerMessageId: String
}

# ============================================================

# PLATFORM / GLOBAL CATALOG

# ============================================================

type Plan
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: private, operations: [read] }
]) {
id: ID!
code: String! @index(name: "byPlanCode", queryField: "planByCode", fields: ["code"])
name: String!
description: String
billingCycle: String! # TERM | SESSION | YEAR (string for flexibility)
basePrice: Float!
currency: String! # "NGN"
status: String! # ACTIVE | RETIRED
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

type AddOn
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: private, operations: [read] }
]) {
id: ID!
code: String! @index(name: "byAddOnCode", queryField: "addOnByCode", fields: ["code"])
name: String!
description: String
pricingModel: String! # PER_STUDENT_PER_TERM | PER_SCHOOL_PER_TERM | FLAT
price: Float!
status: String! # ACTIVE | RETIRED
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

type Permission
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: private, operations: [read] }
]) {
id: ID!
code: String! @index(name: "byPermissionCode", queryField: "permissionByCode", fields: ["code"])
description: String
}

# ============================================================

# TENANT ROOT: SCHOOL + SUBDOMAIN + SUBSCRIPTION

# ============================================================

type School
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] }, # tenant isolation: logged in users can read their own school record
{ allow: owner, ownerField: "tenantKey", identityClaim: "custom:schoolId", operations: [read] }
]) {
id: ID!

# Important: set tenantKey = id (same UUID) on creation, used for auth.

tenantKey: ID!
name: String!
slug: String! @index(name: "bySchoolSlug", queryField: "schoolBySlug", fields: ["slug"])
status: SchoolStatus!
primaryCity: String
createdAt: AWSDateTime
activatedAt: AWSDateTime
updatedAt: AWSDateTime

profile: SchoolProfile @hasOne(fields: ["id"]) # create profile with id == school.id
domains: [SchoolDomain] @hasMany(indexName: "bySchool", fields: ["id"])
subscription: [SchoolSubscription] @hasMany(indexName: "bySchool", fields: ["id"])
}

type SchoolDomain
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchool", queryField: "domainsBySchool", fields: ["schoolId", "hostname"])
type: DomainType!
hostname: String!
verified: Boolean!
verifiedAt: AWSDateTime
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

type SchoolProfile
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {

# Keep id == school.id for simple @hasOne relationship from School

id: ID!
schoolId: ID! @index(name: "bySchoolProfile", queryField: "schoolProfileBySchool", fields: ["schoolId"])
address: String
city: String
state: String
contactEmail: AWSEmail
contactPhone: AWSPhone
logoUrl: String
heroImageUrl: String
themeJson: AWSJSON
updatedAt: AWSDateTime
}

# ============================================================
# SETUP WIZARD STATE
# ============================================================

type SchoolSetupState
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolSetup", queryField: "setupStateBySchool", fields: ["schoolId"])
progressJson: AWSJSON!
updatedAt: AWSDateTime
}

type SchoolHomePageSection
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolSections", queryField: "homeSectionsBySchool", fields: ["schoolId", "sortOrder"])
type: String! # HERO/ABOUT/FEATURES/ANNOUNCEMENTS/CALENDAR/ADMISSIONS_CTA/FOOTER
contentJson: AWSJSON!
sortOrder: Int!
isEnabled: Boolean!
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

type SchoolSubscription
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchool", queryField: "subscriptionsBySchool", fields: ["schoolId", "startAt"])
planId: ID! @index(name: "byPlan", queryField: "subscriptionsByPlan", fields: ["planId", "startAt"])
status: SubscriptionStatus!
startAt: AWSDateTime!
endAt: AWSDateTime
renewalAt: AWSDateTime
gracePeriodDays: Int
notes: String

addOns: [SchoolSubscriptionAddOn] @hasMany(indexName: "bySubscription", fields: ["id"])
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

type SchoolSubscriptionAddOn
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
subscriptionId: ID! @index(name: "bySubscription", queryField: "addOnsBySubscription", fields: ["subscriptionId", "effectiveAt"])
addOnId: ID! @index(name: "byAddOn", queryField: "schoolsByAddOn", fields: ["addOnId", "effectiveAt"])
status: String! # ACTIVE/INACTIVE
effectiveAt: AWSDateTime!
}

type ProviderConfig
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolProvider", queryField: "providerConfigsBySchool", fields: ["schoolId", "type"])
type: String! # PAYMENT_GATEWAY/WHATSAPP/SMS/EMAIL
providerName: String!
configJson: AWSJSON! # store encrypted at rest at DB layer
status: String! # ACTIVE/DISABLED
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

# ============================================================

# TENANT USERS + RBAC

# ============================================================

type User
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolUsers", queryField: "usersBySchool", fields: ["schoolId", "userType"])
email: AWSEmail
phone: AWSPhone
name: String!
userType: UserType!
status: UserStatus!
mfaEnabled: Boolean
lastLoginAt: AWSDateTime
createdAt: AWSDateTime
updatedAt: AWSDateTime

roles: [UserRole] @hasMany(indexName: "byUser", fields: ["id"])
}

type Role
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolRoles", queryField: "rolesBySchool", fields: ["schoolId", "name"])
name: String!
isSystemRole: Boolean!
permissions: [RolePermission] @hasMany(indexName: "byRole", fields: ["id"])
}

type RolePermission
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
roleId: ID! @index(name: "byRole", queryField: "rolePermissionsByRole", fields: ["roleId", "permissionCode"])
permissionCode: String! # references Permission.code
}

type UserRole
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
userId: ID! @index(name: "byUser", queryField: "userRolesByUser", fields: ["userId", "roleId"])
roleId: ID!
}

type AuditEvent
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId", operations: [read] }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolAudit", queryField: "auditBySchool", fields: ["schoolId", "createdAt"])
actorUserId: ID
action: String!
entityType: String!
entityId: ID!
beforeJson: AWSJSON
afterJson: AWSJSON
ipAddress: String
userAgent: String
createdAt: AWSDateTime!
}

# ============================================================

# PUBLIC CONTENT (Announcements + Calendar)

# ============================================================

type Announcement
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] }, # allow tenant users
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }, # optional: public read for school homepage (keep minimal)
{ allow: public, operations: [read] }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolAnnouncements", queryField: "announcementsBySchool", fields: ["schoolId", "publishedAt"])
title: String!
body: String!
audience: AudienceType!
classGroupId: ID
attachmentsJson: AWSJSON
publishedAt: AWSDateTime!
expiresAt: AWSDateTime
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

type CalendarEvent
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" },
{ allow: public, operations: [read] }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolEvents", queryField: "eventsBySchool", fields: ["schoolId", "startAt"])
title: String!
description: String
startAt: AWSDateTime!
endAt: AWSDateTime!
audience: AudienceType!
classGroupId: ID
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

# ============================================================

# ACADEMIC STRUCTURE

# ============================================================

type AcademicSession
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolSession", queryField: "sessionsBySchool", fields: ["schoolId", "startDate"])
name: String!
startDate: AWSDate!
endDate: AWSDate!
status: String! # ACTIVE/ARCHIVED
terms: [Term] @hasMany(indexName: "bySession", fields: ["id"])
}

type Term
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
sessionId: ID! @index(name: "bySession", queryField: "termsBySession", fields: ["sessionId", "startDate"])
name: String!
startDate: AWSDate!
endDate: AWSDate!
status: String! # UPCOMING/ACTIVE/CLOSED
}

type Level
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolLevel", queryField: "levelsBySchool", fields: ["schoolId", "sortOrder"])
type: String! # PRIMARY/SECONDARY
name: String!
sortOrder: Int!
}

type ClassYear
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolClassYear", queryField: "classYearsBySchool", fields: ["schoolId", "sortOrder"])
levelId: ID!
name: String!
sortOrder: Int!
}

type ClassArm
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolArm", queryField: "classArmsBySchool", fields: ["schoolId", "name"])
name: String!
}

type ClassGroup
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolClassGroup", queryField: "classGroupsBySchool", fields: ["schoolId", "displayName"])
classYearId: ID!
classArmId: ID
displayName: String!
classTeacherUserId: ID
}

type Subject
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolSubject", queryField: "subjectsBySchool", fields: ["schoolId", "name"])
name: String!
code: String
levelType: String # PRIMARY/SECONDARY/BOTH
}

type ClassSubject
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
classYearId: ID! @index(name: "byClassYear", queryField: "subjectsByClassYear", fields: ["classYearId", "subjectId"])
subjectId: ID!
isCompulsory: Boolean!
}

# ============================================================

# STUDENTS, PARENTS, ENROLLMENT

# ============================================================

type Student
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolStudents", queryField: "studentsBySchool", fields: ["schoolId", "admissionNo"])
admissionNo: String!
firstName: String!
lastName: String!
dob: AWSDate
gender: String
photoUrl: String
status: String! # ACTIVE/TRANSFERRED/GRADUATED/ARCHIVED
}

type ParentGuardian
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolParents", queryField: "parentsBySchool", fields: ["schoolId", "primaryPhone"])
userId: ID
fullName: String!
primaryPhone: AWSPhone!
email: AWSEmail
preferredChannel: MessageChannel
optedOut: Boolean
optedOutChannels: [MessageChannel]
status: String! # ACTIVE/INACTIVE
children: [StudentParentLink] @hasMany(indexName: "byParent", fields: ["id"])
}

type StudentParentLink
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
studentId: ID! @index(name: "byStudent", queryField: "parentsByStudent", fields: ["studentId", "parentId"])
parentId: ID! @index(name: "byParent", queryField: "studentsByParent", fields: ["parentId", "studentId"])
relationship: String! # MOTHER/FATHER/GUARDIAN/OTHER
isPrimary: Boolean!
}

type Enrollment
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
studentId: ID! @index(name: "byStudentEnrollment", queryField: "enrollmentsByStudent", fields: ["studentId", "termId"])
sessionId: ID!
termId: ID! @index(name: "byTermEnrollment", queryField: "enrollmentsByTerm", fields: ["termId", "classGroupId"])
classGroupId: ID!
status: String! # ENROLLED/WITHDRAWN
}

# ============================================================

# FEES: ITEMS, SCHEDULES, INVOICES, PAYMENTS

# ============================================================

type FeeItem
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolFeeItem", queryField: "feeItemsBySchool", fields: ["schoolId", "name"])
name: String!
description: String
category: FeeCategory!
isOptional: Boolean!
isActive: Boolean!
}

type FeeSchedule
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
sessionId: ID!
termId: ID! @index(name: "byTermFeeSchedule", queryField: "feeSchedulesByTerm", fields: ["termId", "classYearId"])

# Default: per classYear. For special cases you can use classGroupId instead.

classYearId: ID!
classGroupId: ID
name: String!
currency: String! # NGN
isActive: Boolean!

lines: [FeeScheduleLine] @hasMany(indexName: "bySchedule", fields: ["id"])
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

type FeeScheduleLine
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
feeScheduleId: ID! @index(name: "bySchedule", queryField: "feeScheduleLinesBySchedule", fields: ["feeScheduleId", "sortOrder"])
feeItemId: ID!
amount: Float!
isOptionalOverride: Boolean
dueDate: AWSDate
sortOrder: Int!
}

type DiscountRule
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolDiscount", queryField: "discountRulesBySchool", fields: ["schoolId", "type"])
type: String! # SIBLING/EARLY_PAYMENT/SCHOLARSHIP/FIXED_CUSTOM
valueType: String! # PERCENT/FIXED
value: Float!
criteriaJson: AWSJSON
isActive: Boolean!
}

type Invoice
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
invoiceNo: String! @index(name: "bySchoolInvoiceNo", queryField: "invoiceByNumber", fields: ["schoolId", "invoiceNo"])
studentId: ID! @index(name: "byStudentInvoice", queryField: "invoicesByStudent", fields: ["studentId", "termId"])
enrollmentId: ID
sessionId: ID!
termId: ID! @index(name: "byTermClassGroup", queryField: "invoicesByTermClassGroup", fields: ["termId", "classGroupId"])
classGroupId: ID
status: InvoiceStatus!
issuedAt: AWSDateTime
dueAt: AWSDateTime

requiredSubtotal: Float!
optionalSubtotal: Float!
discountTotal: Float!
penaltyTotal: Float!
amountPaid: Float!
amountDue: Float!

lines: [InvoiceLine] @hasMany(indexName: "byInvoice", fields: ["id"])
payments: [PaymentTransaction] @hasMany(indexName: "byInvoicePayment", fields: ["id"])
adjustments: [FeeAdjustment] @hasMany(indexName: "byInvoiceAdjustment", fields: ["id"])
}

type InvoiceLine
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
invoiceId: ID! @index(name: "byInvoice", queryField: "invoiceLinesByInvoice", fields: ["invoiceId", "sortOrder"])
feeItemId: ID
label: String! # snapshot at invoice creation
description: String
amount: Float!
isOptional: Boolean!
isSelected: Boolean
sortOrder: Int!
}

type PaymentIntent
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
invoiceId: ID! @index(name: "byInvoiceIntent", queryField: "paymentIntentsByInvoice", fields: ["invoiceId", "createdAt"])
payerParentId: ID
provider: PaymentProvider!
amount: Float!
currency: String!
status: PaymentIntentStatus!
externalReference: String
createdAt: AWSDateTime!
updatedAt: AWSDateTime
}

type PaymentTransaction
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
invoiceId: ID! @index(name: "byInvoicePayment", queryField: "paymentsByInvoice", fields: ["invoiceId", "paidAt"])
paymentIntentId: ID
method: PaymentMethod!
amount: Float!
currency: String!
status: PaymentTxnStatus!
paidAt: AWSDateTime
reference: String
receiptNo: String
recordedByUserId: ID

proofs: [ManualPaymentProof] @hasMany(indexName: "byPaymentTxn", fields: ["id"])
allocations: [PaymentAllocation] @hasMany(indexName: "byPaymentTxnAlloc", fields: ["id"])
}

type Receipt
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
receiptNo: String!
invoiceId: ID! @index(name: "byInvoiceReceipt", queryField: "receiptsByInvoice", fields: ["invoiceId", "createdAt"])
paymentReference: String
amount: Float!
currency: String!
receiptUrl: String
receiptBucket: String
receiptKey: String
paidAt: AWSDateTime
createdAt: AWSDateTime!
}

type PaymentAllocation
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
paymentTxnId: ID! @index(name: "byPaymentTxnAlloc", queryField: "allocationsByPayment", fields: ["paymentTxnId", "invoiceId"])
invoiceId: ID!
amountAllocated: Float!
}

type ManualPaymentProof
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
paymentTxnId: ID! @index(name: "byPaymentTxn", queryField: "proofsByPayment", fields: ["paymentTxnId", "createdAt"])
fileUrl: String!
submittedByParentId: ID
status: ProofStatus!
reviewedByUserId: ID
reviewedAt: AWSDateTime
notes: String
createdAt: AWSDateTime!
}

type FeeAdjustment
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
invoiceId: ID! @index(name: "byInvoiceAdjustment", queryField: "adjustmentsByInvoice", fields: ["invoiceId", "createdAt"])
type: AdjustmentType!
amount: Float!
reason: String
createdByUserId: ID!
approvedByUserId: ID
approvedAt: AWSDateTime
createdAt: AWSDateTime!
}

type InstallmentPlan
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
invoiceId: ID! @index(name: "byInvoiceInstallment", queryField: "installmentPlanByInvoice", fields: ["invoiceId", "createdAt"])
status: String! # ACTIVE/COMPLETED/CANCELLED
totalAmount: Float!
installments: [Installment] @hasMany(indexName: "byInstallmentPlan", fields: ["id"])
createdAt: AWSDateTime!
}

type Installment
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
installmentPlanId: ID! @index(name: "byInstallmentPlan", queryField: "installmentsByPlan", fields: ["installmentPlanId", "sequenceNo"])
sequenceNo: Int!
amount: Float!
dueAt: AWSDateTime!
status: String! # DUE/PAID/OVERDUE
}

# ============================================================

# MESSAGING (Templates + Campaigns)

# ============================================================

type MessageTemplate
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolTemplate", queryField: "templatesBySchool", fields: ["schoolId", "type"])
type: String! # FEE_REMINDER/PAYMENT_RECEIPT/ANNOUNCEMENT/RESULT_READY/etc
channel: MessageChannel!
subject: String
body: String!
variablesJson: AWSJSON
isActive: Boolean!
createdAt: AWSDateTime
updatedAt: AWSDateTime
}

type MessageCampaign
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolCampaign", queryField: "campaignsBySchool", fields: ["schoolId", "createdAt"])
name: String!
type: String!
channel: MessageChannel!
templateId: ID
createdByUserId: ID!
status: CampaignStatus!
scheduledAt: AWSDateTime
audienceJson: AWSJSON
recipients: [MessageRecipient] @hasMany(indexName: "byCampaign", fields: ["id"])
createdAt: AWSDateTime!
}

type MessageRecipient
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
campaignId: ID! @index(name: "byCampaign", queryField: "recipientsByCampaign", fields: ["campaignId", "destination"])
parentId: ID
userId: ID
  destination: String!
  status: DeliveryStatus!
  statusHistory: [DeliveryStatusEntry!]
  providerMessageId: String
  lastUpdatedAt: AWSDateTime
  }

# ============================================================

# ATTENDANCE

# ============================================================

type AttendanceSession
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
termId: ID! @index(name: "byClassDay", queryField: "attendanceSessionsByClassAndDay", fields: ["classGroupId", "date"])
classGroupId: ID!
date: AWSDate!
takenByUserId: ID!
entries: [AttendanceEntry] @hasMany(indexName: "byAttendanceSession", fields: ["id"])
}

type AttendanceEntry
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
attendanceSessionId: ID! @index(name: "byAttendanceSession", queryField: "attendanceEntriesBySession", fields: ["attendanceSessionId", "studentId"])
studentId: ID!
status: AttendanceStatus!
notes: String
}

# ============================================================

# ASSESSMENTS + RESULTS

# ============================================================

type AssessmentPolicy
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolPolicy", queryField: "assessmentPoliciesBySchool", fields: ["schoolId", "name"])
name: String!
appliesTo: String # PRIMARY/SECONDARY/BOTH
componentsJson: AWSJSON! # [{name, weight}, ...]
gradingScaleJson: AWSJSON
isActive: Boolean!
}

type Assessment
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
termId: ID! @index(name: "byClassSubjectTerm", queryField: "assessmentsByClassSubjectTerm", fields: ["classGroupId", "subjectId"])
classGroupId: ID!
subjectId: ID!
policyId: ID!
title: String!
status: AssessmentStatus!
scores: [ScoreEntry] @hasMany(indexName: "byAssessment", fields: ["id"])
}

type ScoreEntry
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
assessmentId: ID! @index(name: "byAssessment", queryField: "scoresByAssessment", fields: ["assessmentId", "studentId"])
studentId: ID!
scoresJson: AWSJSON! # per component
totalScore: Float
grade: String
enteredByUserId: ID!
enteredAt: AWSDateTime!
}

type ReportCard
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID!
studentId: ID! @index(name: "byStudentTermReport", queryField: "reportCardsByStudentTerm", fields: ["studentId", "termId"])
termId: ID!
classGroupId: ID!
status: ReportCardStatus!
teacherComment: String
headComment: String
attendanceSummaryJson: AWSJSON
publishedAt: AWSDateTime
}

type ResultReleasePolicy
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolReleasePolicy", queryField: "releasePolicyBySchool", fields: ["schoolId"])
isEnabled: Boolean!
minimumPaymentPercent: Int! # 0..100
messageToParent: String
appliesTo: String # ALL/SECONDARY_ONLY/etc
}

# ============================================================

# FEATURE FLAGS (derived from subscription + add-ons)

# ============================================================

type FeatureFlag
@model
@auth(rules: [
{ allow: groups, groups: ["APP_ADMIN"] },
{ allow: owner, ownerField: "schoolId", identityClaim: "custom:schoolId" }
]) {
id: ID!
schoolId: ID! @index(name: "bySchoolFeature", queryField: "featuresBySchool", fields: ["schoolId", "code"])
code: String! # TRANSPORT.ENABLED, ADMISSIONS.ENABLED, etc
isEnabled: Boolean!
updatedAt: AWSDateTime
}

# ============================================================
# Mutations (async helpers / notifications)
# ============================================================
- publishEvent(detailType, source, detail JSON) -> EventBridge.
- enqueueInvoicingJob / enqueueMessagingJob -> SQS via EventBridge rules; enqueueImportJob -> EventBridge rule target (import worker).
- create/update/delete MessageTemplate; create/update MessageCampaign.
- emitAnnouncementNotification(schoolId, announcementId) -> emits `announcement.published`.
- emitResultReadyNotification(schoolId, studentId, termId, classGroupId?) -> emits `result.ready`.
- publishAnnouncement(schoolId, announcementId, audience?, classGroupId?, termId?) -> updates publishedAt + emits `announcement.published`.
- publishResultReady(schoolId, studentId, termId, classGroupId?, reportCardId?) -> sets report card published + emits `result.ready`.
- createAttendanceSession (Mutation) -> Put AttendanceSession
- createAttendanceEntry (Mutation) -> Put AttendanceEntry
- createAssessment (Mutation) -> Put Assessment
- createScoreEntry (Mutation) -> Put ScoreEntry
- seedDefaultMessageTemplates(schoolId, channel?) -> creates missing default templates.
- provisionSchool(input) -> creates School, SchoolProfile, SchoolDomain, and default roles/permissions.
- create/update/delete AcademicSession, Term, Level, ClassYear, ClassArm, ClassGroup for setup wizard.
- createSchoolSetupState(input) -> stores wizard progress JSON for resume.
- updateSchoolSetupState(input) -> updates wizard progress JSON.
- setupStateBySchool(schoolId) -> fetch stored wizard progress.
- createImportJob(schoolId, bucket, key) -> publishes `import.requested`, tracks status in ImportJob, stores error report CSV in uploads bucket.
- createImportUploadUrl(schoolId, fileName, contentType?) -> returns presigned S3 URL for CSV upload.
- createImportErrorDownloadUrl(schoolId, key) -> returns presigned S3 URL for error report download.
- create/update/delete FeeItem, FeeSchedule, FeeScheduleLine for fee configuration; createFeeAdjustment for discounts/waivers/penalties with audit logging.
- create/update/delete Role; assign/remove UserRole and RolePermission with audit events for role changes.
- createInvoice(input) -> creates an invoice and triggers async invoicing job for totals; derives classGroupId from Enrollment if not provided.
- selectInvoiceOptionalItems(input) -> toggles optional invoice lines, updates optionalSubtotal/amountDue, emits invoice.generated.
- createPaymentIntent(input) -> stores payment intent for gateway handoff.
- createManualPaymentProofUploadUrl(input) -> presigned URL for manual proof uploads.
- submitManualPaymentProof(input) -> creates PENDING payment transaction + proof record.
- reviewManualPaymentProof(input) -> approves/rejects proof, updates payment txn, emits payment.confirmed on approval.
- createReceiptUploadUrl(input) -> presigned URL for receipt PDFs (S3).
- attachReceiptUrl(input) -> stores receiptUrl on Receipt by receiptNo.
- createReceiptDownloadUrl(input) -> presigned URL for receipt PDF downloads.
- paymentsBySchool(schoolId, limit?) -> returns payment transactions for admin dashboards.
- receiptsBySchool(schoolId, limit?) -> returns receipts for admin dashboards.
- manualPaymentProofsBySchool(schoolId, status?, limit?) -> returns manual payment proofs for admin review queues.
- proofsByPayment(paymentTxnId, limit?) -> proof history per payment transaction.
- invoiceById(schoolId, id) -> fetch invoice by ID for admin exports.
- Audit events emitted: MANUAL_PAYMENT_SUBMITTED, MANUAL_PAYMENT_APPROVED/REJECTED, RECEIPT_ATTACHED, RECEIPT_DOWNLOADED.
- createSupportTicket(input) -> creates a parent support ticket (status OPEN).
- updateSupportTicketStatus(input) -> updates ticket status for staff workflow.
- createSupportTicketMessage(input) -> append a ticket message (parent or staff).
- defaultersByClass(termId, classGroupId, minDaysOverdue?, minAmountDue?) -> invoices past due for a class.

# ============================================================

# ACCESS PATTERNS (messaging, billing, imports)

# ============================================================

# Messaging
# - MessageTemplate: index bySchoolTemplate (PK schoolId, SK type) for school-scoped template lists.
# - MessageCampaign: index bySchoolCampaign (PK schoolId, SK createdAt) for per-school history; owner list defaults to schoolId partition.
# - MessageRecipient: index byCampaign (PK campaignId, SK destination) for campaign detail; index byProviderMessage (PK providerMessageId) to resolve delivery callbacks without params.
# - Query field resolvers: recipientsByCampaign (campaignId + limit), templatesBySchool (schoolId + limit), campaignsBySchool (schoolId + limit).

# Billing (invoices/payments/discounts)
# - Invoice: index bySchoolInvoiceNo (PK schoolId, SK invoiceNo) for lookup by human-facing number; byStudentInvoice (PK studentId, SK termId) for student-term invoices; byTermClassGroup (PK termId, SK classGroupId) for defaulters by class.
# - InvoiceLine: index byInvoice (PK invoiceId, SK sortOrder) for line items.
# - PaymentIntent: index byInvoiceIntent (PK invoiceId, SK createdAt) for pending intents per invoice.
# - PaymentTransaction: index byInvoicePayment (PK invoiceId, SK paidAt) for payment history; byReference (PK reference) for idempotent webhook replay protection.
# - Receipt: index byInvoiceReceipt (PK invoiceId, SK createdAt) for receipt history; receiptByNumber via (schoolId, receiptNo).
# - PaymentAllocation: index byPaymentTxnAlloc (PK paymentTxnId, SK invoiceId) for allocations across invoices.
# - Queries: paymentsBySchool, receiptsBySchool, manualPaymentProofsBySchool, proofsByPayment, invoiceById.
# - FeeAdjustment: index byInvoiceAdjustment (PK invoiceId, SK createdAt) for discounts/waivers/penalties.
# - InstallmentPlan: index byInvoiceInstallment (PK invoiceId, SK createdAt); Installment: index byInstallmentPlan (PK installmentPlanId, SK sequenceNo).
# - DiscountRule: bySchoolDiscount (PK schoolId, SK type) for rule evaluation.

# Imports (students/parents/enrollments)
# - Student: index bySchoolStudents (PK schoolId, SK admissionNo) for uniqueness and import dedupe.
# - Parent: index bySchoolParents (PK schoolId, SK primaryPhone) for dedupe/merge.
# - StudentParentLink: byStudent (PK studentId, SK parentId) and byParent (PK parentId, SK studentId) for lookups.
# - Enrollment: byStudentEnrollment (PK studentId, SK termId) to enforce single active per term; byTermEnrollment (PK termId, SK classGroupId) for class rosters.

# Support (tickets + messages)
# - SupportTicket: bySchoolSupport (PK schoolId, SK createdAt) for admin queues; byParentSupport (PK parentId, SK createdAt) for parent history.
# - SupportTicketMessage: byTicket (PK ticketId, SK createdAt) for ticket conversations.
# - Queries: supportTicketsBySchool, supportTicketsByParent, supportTicketById, supportTicketMessagesByTicket.
