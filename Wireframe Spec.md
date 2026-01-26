Below are **exact step-by-step wireframe descriptions** for the **ClassPoint School Admin Setup Wizard** (8 steps), plus the **Wizard Hub** and shared UI components. This is written so your AI developer can implement without guessing.

---

# A) Setup Wizard System (Global Wireframe Spec)

## A1) Routes

* `/admin/setup` → Wizard Hub
* `/admin/setup/:stepKey` → Step page (e.g., `/admin/setup/branding`)
* `/admin/setup/review` → Go-live Review (Step 8)

## A2) Layout (every step page)

**Dashboard Shell**

* Left Sidebar (collapsible)
* Top Bar: Search, Notifications, Profile (show display name)

**Wizard Body**

* Desktop: 2-column

  * Left: Stepper (sticky)
  * Right: Step content (scroll)
* Mobile: 1-column

  * Top: progress bar + “Step X of 8”
  * Step list accessible via “Steps” button (drawer/bottom sheet)

**Sticky Action Bar**

* Desktop: bottom aligned within content container
* Mobile: sticky bottom bar full width

Buttons (consistent order):

* Left: **Back**
* Middle: **Save Draft**
* Right (Primary): **Save & Continue**
* Optional: **Skip Step** (only where allowed)

Status chips at top:

* `Not started` / `In progress` / `Completed`

Autosave:

* Show small text: “Last saved: 2 mins ago”

Error model:

* Inline field error under input
* Top banner error only for “submit failure” (API/network)

---

# B) Wizard Hub (/admin/setup) Wireframe

## Header

* Title: **School Setup**
* Subtext: “Complete setup to start billing, communication, and academics.”
* Right: Primary CTA: **Continue setup** (goes to next incomplete step)

## Content sections

### 1) Progress Overview Card

* Progress ring or bar: “45% complete”
* Next step: “Academic Structure”
* Button: **Continue**

### 2) Step List (cards)

Each step card shows:

* Step number + title
* Status pill
* 1-line description
* Completion criteria hint
* CTA:

  * If incomplete: **Start** / **Continue**
  * If complete: **Edit**
  * If optional: **Skip** (with confirmation)

### 3) Readiness checklist (collapsed)

* “Go-Live Readiness”
* shows missing items and links

### Mobile

* Step cards become a vertical list, full width, big tap targets

---

# C) Step 1 — School Profile & Branding (/admin/setup/branding)

## Goal

Capture the identity of the school and preview how the portal will look.

## Sections

### C1) Step header

* Title: **School Profile & Branding**
* Description: “Set your school’s name, contact details, and branding for the portal.”

### C2) School details card

Fields:

* School Name (required)
* Short Name / Display Name (optional)
* Address (optional)
* City (required)
* State (required dropdown)
* Phone (required)
* Email (required)
* Website (optional)

Validation:

* Required fields must show errors on blur
* Phone normalized (+234…)

### C3) Branding card

Fields:

* Upload Logo (required)

  * Preview + “Replace”
* Upload Hero Image (optional)

  * Preview
* Primary Color (required color picker)
* Accent Color (optional)
* Receipt header name (optional, defaults to School Name)

### C4) Live preview panel (must-have)

Right side on desktop / collapsible accordion on mobile:

* Preview of:

  * Portal top header (logo + school name)
  * Sample announcement card
  * Receipt header preview
* Toggle: “Light/Dark preview” (optional)

### C5) Actions

* Save Draft
* Save & Continue

Completion criteria:

* School Name, City, State, Phone, Email, Logo, Primary Color saved successfully

---

# D) Step 2 — Academic Structure (/admin/setup/academic-structure)

## Goal

Create class years, arms, class groups, and subject structure.

## Sections

### D1) Step header

Title: **Academic Structure**
Description: “Set up levels, class years, arms, and subjects. We can generate defaults.”

### D2) Quick generator card (top)

* Toggle: Enable Primary / Enable Secondary
* Buttons:

  * **Generate Defaults**
  * **Reset**
* Preview summary:

  * “Primary: 6 class years”
  * “Secondary: JSS1–SS3”

### D3) Class years card

Two tabs:

* Primary
* Secondary

Each tab has:

* Table/list (desktop) or cards (mobile)
* Add Class Year button

Row fields:

* Name (e.g., Primary 1 / JSS1)
* Order (numeric)
* Active toggle

### D4) Arms/Streams card

* Field: Arms list input (e.g., A, B, C)
* Toggle: “No arms (single class per year)”
* Optional: custom names (“Gold”, “Blue”)

### D5) Class Groups generator card (must-have)

* Dropdown: “Generate groups for”

  * All class years
  * Selected
* Shows output preview:

  * “Primary 1A, Primary 1B…”
* Button: **Generate Class Groups**
* After generation: editable list

### D6) Subjects setup (secondary only)

* Toggle: “Set subjects now” / “Later”
* If now:

  * Subject catalog list
  * Assign subjects to class years
  * Default sets: “Science”, “Arts”, “Commercial” (optional)

### D7) Actions

* Back
* Save Draft
* Save & Continue

Completion criteria:

* At least one class year exists
* Class groups exist for each active year (or explicit “no arms” confirmed)

---

# E) Step 3 — Staff & Roles (/admin/setup/staff-roles)

## Goal

Invite key staff and assign roles + classes.

## Sections

### E1) Step header

Title: **Staff & Roles**
Description: “Invite your bursar and teachers. You can assign classes now or later.”

### E2) Key roles card (required)

* School Admin (shows current user)
* Bursar:

  * Invite via email/phone (required)
  * Role: BURSAR (fixed)
  * Permissions summary (read-only)

### E3) Teachers card

* Add Teacher button opens modal/slide-over:

  * Name (required)
  * Email (optional)
  * Phone (required)
  * Role: TEACHER
  * Assign classes (multi-select class groups) (optional)
  * Assign subjects (optional)
  * Send invite toggle (default ON)

List view shows:

* Name
* Role
* Assigned classes count
* Invite status: Pending/Accepted

### E4) Permission preview card (read-only)

* “What teachers can do”
* “What bursar can do”
  Short bullets only.

### E5) Actions

* Back
* Save Draft
* Save & Continue

Completion criteria:

* Bursar invited OR explicitly skipped with “I will add later” confirmation

---

# F) Step 4 — Students & Parents Import (/admin/setup/import)

## Goal

Upload CSV, validate, review, import, and show summary.

## Step layout

This step is itself a mini-wizard with 4 sub-steps:

* `/admin/setup/import/upload`
* `/admin/setup/import/map`
* `/admin/setup/import/review`
* `/admin/setup/import/results`

### F1) Upload

* Download template button (CSV)
* Drag-drop upload area
* Checkbox: “First row contains headers” (default true)
* Button: **Validate file**

Validation output:

* total rows
* detected columns
* missing required columns

### F2) Map fields

* Column mapping UI (if columns don’t match)
* Required mappings:

  * admissionNo, firstName, lastName, classYear, (arm optional), parentPhone
* Button: **Run validation**

### F3) Review validation report (must-have)

Tabs:

* Errors (must fix)
* Warnings (can proceed)
* Preview (first 20 rows)

Error cards show:

* Row number
* Issue
* Suggested fix

Buttons:

* **Download error report CSV**
* **Upload corrected file**
* **Proceed with valid rows only** (toggle, default OFF)

### F4) Import results

* Summary tiles:

  * Students created
  * Students updated (if enabled)
  * Parents merged
  * Rows skipped
* Button: **Go to Students**
* Button: **Continue setup**

Completion criteria:

* At least one student imported OR explicit skip confirmed

---

# G) Step 5 — Fees Setup (/admin/setup/fees)

## Goal

Create fee items, build schedules, preview, and generate invoices.

This is a 4-sub-step flow:

* Create fee items → Build schedule → Preview → Generate invoices

### G1) Create fee items

List with categories:

* Tuition
* Levies
* Uniform/Books (optional)
* Transport (optional)

Fields per item:

* Item name (required)
* Category (required)
* Required toggle (default required for tuition/levy)
* Optional toggle (mutually exclusive with required)
* Default description (optional)

Actions:

* Add item
* Edit item
* Archive item (confirm dialog)

### G2) Build schedule

Controls at top:

* Term selector (required)
* Class Year selector (required)
* Copy-from selector (copy schedule from another class year) (must-have)

Schedule editor (line items):

* Fee item dropdown
* Amount input (currency)
* Due date (optional)
* Notes (optional)
* Installment allowed? (optional toggle; default OFF)

Right panel (desktop) / accordion (mobile):

* Running totals:

  * Required subtotal
  * Optional subtotal
  * Grand total

### G3) Preview (must-have)

Preview shows:

* Parent invoice layout exactly:

  * Required items section
  * Optional items section with toggles (if enabled)
  * Totals
  * Due date info
  * “Pay now” button mock
* “Continue to invoice generation” button

Completion criteria:

* At least one schedule exists for current term
* Parent preview confirmed

### G4) Generate invoices

Controls:

* Class group selector (required)
* Skip duplicates toggle (default ON)
* “Generate invoices” button

Results:

* Created count
* Skipped duplicates count
* Link to invoices list

Completion criteria:

* Invoice batch generated OR explicit “Generate later” confirmation

---

# H) Step 6 — Payments (/admin/setup/payments)

## Goal

Choose provider, configure, test.

### H1) Provider selection

* Provider cards:

  * Paystack
  * Flutterwave
* Choose one (radio)
* Note: “You can change later, but test before go-live.”

### H2) Provider configuration (based on selection)

Fields:

* Public key (required)
* Secret key (required) (masked)
* Webhook secret (required) (masked)
* Settlement account name/number (optional)
* Payment description text (optional)

Security:

* Keys saved in Secrets Manager (never stored in frontend local storage)

### H3) Workflow settings

Toggles:

* Enable manual payment proofs (default ON for Nigeria)
* Auto-receipt on successful payment (default ON)
* Allow partial payments (default OFF for pilot unless specified)

### H4) Test payment

* Button: **Send test payment link to admin phone/email**
* Status indicator:

  * webhook received ✅ / ❌
  * receipt generated ✅ / ❌
* Link to troubleshooting if failed

Completion criteria:

* Provider keys saved + webhook test passed OR explicit “I’ll test later” confirmation

---

# I) Step 7 — Communications (/admin/setup/communications)

## Goal

Configure SMS now (Twilio), prepare WhatsApp later.

### I1) Channel setup cards

* SMS (Twilio) — Active
* WhatsApp — Disabled “Coming later”
* Email — Optional

### I2) Twilio configuration

Fields:

* Account SID (required)
* Auth Token (required, masked)
* Messaging Service SID OR Sender number (required)
* Default sender label (optional)

### I3) Templates (must-have)

Template list:

* Invoice ready
* Payment received
* Fee reminder
* Announcement

Template editor:

* Message body
* Variables insert helper (chips)
* Character count
* Preview panel (with sample data)

### I4) Send test message

* Input: admin phone
* Button: **Send test**
* Show delivery status

Completion criteria:

* Twilio configured + at least one test message sent successfully OR explicit skip

---

# J) Step 8 — Go-Live Review (/admin/setup/review)

## Goal

Confirm readiness, policies, and activate.

### J1) Readiness checklist (must-have)

Checklist grouped:

* Branding ✅
* Academic structure ✅
* Staff ✅
* Students import ✅
* Fees schedules ✅
* Payments ✅
* Communications ✅

Each item has:

* status
* “Fix” link to the step

### J2) Policy confirmations (simple toggles)

* Discounts enabled? (default OFF)
* Installments enabled? (default OFF)
* Results release rule:

  * No gating (default)
  * Gate results if outstanding > X (optional)
* Parent access mode:

  * Login required (default)
  * OTP invoice links (nice-to-have)

### J3) Go-live actions

Buttons:

* **Mark Setup Complete** (primary)
* **Generate first invoices** (secondary, if not done)
* **Send onboarding message to parents** (secondary)

### J4) Success screen

After completion:

* “Setup complete”
* Next recommended actions:

  * Generate invoices
  * Send reminders
  * Invite more staff
* Button: **Go to Dashboard**

Completion criteria:

* Setup marked complete (writes `school.setupStatus = COMPLETE`)

---

# K) Developer Implementation Notes (must follow)

* Each step must be backed by:

  * `GET setupState`
  * `PUT setupState` (partial updates)
* Store completion flags per step:

  * `completedAt`, `completedBy`, `status`
* Autosave debounce: 1–2 seconds after input stop
* Mobile:

  * wizard stepper becomes top progress + steps drawer
  * sticky bottom bar for actions
