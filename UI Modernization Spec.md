
## ClassPoint UI Modernization Spec (School Admin Dashboard + Setup Wizard)

### Goal

Make the School Admin experience feel like a **modern operating system**:

* clean, premium, trustworthy
* fast to understand
* optimized for phones
* guided setup in clear steps (wizard), not scattered forms

---

# 1) Immediate fixes (must do)

1. **Never show JWTs/tokens in the UI**

   * Remove any debug token box/field from the dashboard or header.
   * Tokens should never be displayed. If needed for dev, show behind a dev-only flag and not in production.

2. **Always display user names, never IDs**

   * In the top bar and profile menu show:

     * `displayName` (e.g., “Blessing A.”)
     * role label (e.g., “School Admin”)
     * avatar initials
   * Only show IDs inside admin-only logs or internal debug tools (not default UI).

---

# 2) Visual design direction (modern look)

### A) Layout + spacing

* Use a **clean neutral background** (plain or very subtle tint), avoid heavy gradients behind content.
* Keep content within a max width (e.g., **1200–1280px**) with generous padding.
* Use a consistent spacing system (8px grid):

  * card padding: 16–24px
  * section gap: 24–32px
  * page padding: 16 mobile / 24 desktop

### B) Typography

* Use a modern font stack (e.g., Inter/system).
* Strong hierarchy:

  * Page title: large and bold
  * Section headers: medium
  * Body text: calm, high readability
* Reduce all-caps headings; use normal case with subtle label styling.

### C) Card and component style

* Cards: subtle shadow + 12–16px radius
* Buttons:

  * Primary button only for the most important action on the page
  * Secondary for less critical actions
  * Destructive actions require confirm dialog
* Use consistent **status pills**:

  * `Completed`, `Pending`, `Overdue`, `Optional`
  * Each status pill must be readable and consistent across pages

### D) Color system

* Keep ClassPoint brand color as primary action color.
* Use neutral palette for surfaces, and reserve accent colors for:

  * statuses
  * highlights
  * charts
* Allow school branding color to tint the header/accents, but **don’t let it reduce readability**.

---

# 3) School Admin Dashboard redesign (what it should look like)

## A) Dashboard structure (top to bottom)

### 1) Header row

* Title: “School Admin Dashboard”
* Subtext: “Track collections, tasks, and actions that need attention.”
* Right side: a single primary CTA: **Generate invoices** (or “Continue setup” if setup incomplete)

### 2) KPI Summary strip (3–5 tiles)

Show only “decision KPIs”:

* Collected (this term)
* Outstanding
* Defaulters count
* Payments pending review
* Attendance pending (optional)
  Each KPI tile should support tap → navigate to the relevant page.

### 3) Work Queue (actionable tasks)

A dedicated **Work Queue panel** with 5–10 items max:

* “Payment proofs pending (6)”
* “Import errors (12)”
* “Attendance not submitted (2 classes)”
* “Results ready to publish (Primary 6)”
  Each item has:
* status pill
* short description
* CTA button (Review / Fix / Continue)

### 4) Quick Actions (context-aware)

Show 4–6 quick actions max:

* Continue setup
* Send reminders
* Review payment proofs
* Update fee schedules
* Import students
* Publish results (if available)

### 5) Recent Activity feed (audit-friendly)

A clean list:

* “Payment received — INV-2024-0091 — ₦45,000”
* “Invoice batch generated — JSS2 — 63 students”
  Each item links to its record.

## B) Smart behavior

* If setup is incomplete, the dashboard shows a prominent **Setup progress card**:

  * “Setup 45% complete”
  * next step CTA: “Continue setup”
* If setup is complete, hide setup prompts and focus on operations.

---

# 4) Setup Wizard redesign (make it a real wizard)

## A) Replace “many cards on one page” with a guided stepper

Current approach (many setup cards visible at once) is overwhelming and not mobile-friendly. Replace with:

### Wizard shell

* `/admin/setup` becomes a **Wizard Hub**
* Wizard uses a **Step Navigator**:

  * Desktop: left vertical stepper
  * Mobile: top stepper / progress bar + “Step X of Y”
* Each step is a focused page with:

  * step title + purpose
  * the required inputs
  * helpful defaults
  * “Save & Continue”

## B) Wizard steps (recommended)

**Step 1: School Profile & Branding**

* School name, address, city/state
* logo upload
* primary/accent color picker
* preview of landing page header + receipt header

**Step 2: Academic Structure**

* Levels (Primary/Secondary)
* Class years (Primary 1–6, JSS1–SS3, etc.)
* Arms (A/B/C optional)
* Class groups generator (Primary 1A, JSS1B, etc.)
* Subjects setup (secondary)
  ✅ Add “Generate defaults” button with preview + edit before saving.

**Step 3: Staff & Roles**

* Invite School Admin, Bursar, Teachers
* Role permissions summary (read-only default)
* Optional: class teacher assignment

**Step 4: Students & Parents**

* Import wizard (CSV upload)
* Dedupe + validation report
* Review screen before commit
* Post-import summary

**Step 5: Fees Setup**

* Fee items catalog (Tuition, PTA, Books, etc.)
* Fee schedules per class/year per term
* Parent fee breakdown preview (must look clean)
* Optional items selection (uniform/bus/lunch)

**Step 6: Payments**

* Select provider (Paystack/Flutterwave)
* Configure settlement account
* Manual payment proof workflow toggle
* Test payment flow checklist (sandbox)

**Step 7: Communications**

* SMS provider config (Twilio)
* Message templates (receipt + reminder)
* Send test message to admin phone

**Step 8: Go-Live Review**

* Readiness checklist
* confirm policies:

  * discounts/installments enabled?
  * result release rule?
* “Mark pilot ready” + notes
* “Launch school portal” button

## C) Step completion logic

Each step has:

* status: Not started / In progress / Completed / Optional skipped
* progress saved automatically (draft)
* users can exit and resume any time

## D) Wizard CTAs (consistent)

At bottom of every step:

* Back
* Save Draft
* Save & Continue (primary)
* Skip (only if optional)
  Also allow “Save” at top on mobile for ease.

---

# 5) Mobile-first requirements (critical)

### A) Navigation

* Sidebar becomes a **drawer** on mobile.
* Setup wizard uses:

  * compact progress bar
  * “Next” sticky bottom bar
* Avoid multi-column layouts on mobile.

### B) Forms

* One column forms on mobile.
* Use step sub-pages for long forms (e.g., Fees Setup):

  * “Fee Items” → “Schedules” → “Preview” → “Publish”
* Use large touch targets and clear spacing.

### C) Lists and tables

* On mobile, all tables become **stacked cards**:

  * title
  * 2–4 key fields
  * status pill
  * “View” action

---

# 6) Usability improvements & modern UX patterns

1. **Inline validation**

   * show field-level errors as user types
   * show a summary at top only if needed

2. **Draft + autosave**

   * setup wizard should auto-save step progress
   * show “Last saved: 2 mins ago”

3. **Preview panels**

   * In Branding: show preview of portal header/receipt header
   * In Fees: show parent invoice breakdown preview (exact final look)

4. **Smart defaults + generators**

   * “Generate default levels”
   * “Generate class years”
   * “Generate class groups”
   * always allow edit before saving

5. **Empty states with guidance**

   * “No fee items yet — Create your first fee item”
   * include a short “why this matters” sentence

6. **Performance**

   * skeleton loaders
   * optimistic UI where safe
   * avoid full page reloads

7. **Accessibility**

   * keyboard navigation on desktop
   * clear focus states
   * good contrast

---

# 7) Recommended information architecture updates

* Treat Setup as a **first-class flow**:

  * Dashboard shows setup progress until complete.
  * Setup hub always accessible from sidebar.
* Add an “Onboarding checklist” widget to the admin dashboard:

  * shows remaining tasks and deep links to steps.

---

# 8) Deliverables I want from you (developer)

1. New `AdminDashboard` layout with:

   * KPI tiles
   * Work Queue
   * Quick Actions
   * Recent Activity
   * Setup progress card (conditional)

2. New `SetupWizard` system:

   * stepper navigation (desktop + mobile)
   * per-step pages with autosave
   * completion tracking + readiness review
   * preview panels for branding + fees

3. Consistent component library:

   * `KpiCard`, `StatusPill`, `WorkQueueItem`, `WizardStepper`, `StickyBottomActions`, `EmptyState`

---
