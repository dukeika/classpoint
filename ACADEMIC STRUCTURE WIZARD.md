Instructions to AI Developer: Academic Setup Wizard (Simple + Advanced)
Design goals

No overwhelm: user answers a few questions → we generate everything.

Default-first: show common Nigerian defaults pre-selected.

Advanced optional: arms/streams/custom naming lives behind an “Advanced” toggle.

Preview + edit before saving: user can see the generated structure and tweak it.

Mobile-first: stepper wizard, big tap targets, no complex tables on mobile.

Wizard Flow (Academic Setup only)

Route: /admin/setup/academic-structure
Wizard style: Stepper (Desktop left step list, Mobile top progress “Step X of 5”)

Step 1: School Type & Levels
UI

Title: School Type

Choice cards (single select):

Primary only

Secondary only

Primary + Secondary (default for most private schools)

Nursery + Primary (optional)

Nursery + Primary + Secondary (optional)

Default generator (recommended)

When user picks an option, auto-select:

Primary: Primary 1–Primary 6 (enabled by default) 
ubec.gov.ng
+1

Secondary: JSS1–JSS3 + SS1–SS3 (enabled by default) 
ubec.gov.ng
+1

Optional ECCDE (if Nursery included): Nursery 1–2, KG 1–2 (editable)

Advanced (collapsed)

Rename “Primary” to “Basic” (some schools prefer)

Enable/disable ECCDE levels

Add custom level group (e.g., “Creche”)

CTA: Save & Continue

Step 2: Academic Session & Terms
UI

Title: Academic Calendar

Session naming (auto):

Default format: YYYY/YYYY (e.g., 2025/2026)

“Session start year” picker (default = current year)

Terms (default = 3 terms):

Toggle: 3 Terms (recommended) (default) 
fctubeb.gov.ng
+1

Alternative: 2 Terms (rare, but allow)

Term names (default):

1st Term, 2nd Term, 3rd Term

Optional term date ranges:

Keep OFF by default (because states vary)

If enabled: allow start/end dates per term

Provide presets (“Typical Sep–Dec / Jan–Mar / Apr–Jul”) but label as editable (don’t hardcode as universal) 
fctubeb.gov.ng
+1

Defaults to generate

Term objects:

Term 1, Term 2, Term 3 with ordering

Add “Mid-term break?” toggle (optional)

CTA: Save & Continue

Step 3: Classes & Naming (simple by default)
UI

Title: Class Structure

Primary class years: show generated list (Primary 1–6) with edit option

Secondary class years: show generated list (JSS1–3, SS1–3) with edit option

Default class groups

Default: No arms/streams (one class per year)

Example output: “Primary 1”, “Primary 2”, “JSS1”, “SS2”

Explain: “You can add arms like A/B or Blue/Gold in Advanced.”

Advanced: Arms/Streams

This is the key improvement to reduce confusion.

Advanced toggle: “Use Arms / Streams”
If enabled:

Ask: “How do you want class groups named?”

Option A: Letters (A, B, C) → “Primary 4A” (default)

Option B: Names (Blue, Gold, Green) → “Primary 4 Blue”

Option C: Custom pattern (admin defines)

Arms input UI:

Chip input: A, B OR Blue, Gold

Add/remove chips

Preview generator shows:

“Primary 4A, Primary 4B” OR “Primary 4 Blue, Primary 4 Gold”

Secondary Streams (optional, very common in SS)

Toggle: “Enable Senior Secondary streams”

Default OFF

If ON:

Streams: Science, Arts, Commercial (editable)

Stream affects subject sets later (Step 4)

Naming: “SS1 Science” or “SS1A Science” depending on arms setting

Output preview (must-have)

Before continuing, show a preview list (scrollable):

Level → Year → Generated Class Groups

Mobile: accordion per level

CTA: Save & Continue

Step 4: Subjects & Assessment Defaults (keep it light)
UI

Title: Subjects & Grading

Primary: minimal defaults

Option: “Set up subjects later” (default ON)

If user enables now: add common subjects list editable

Secondary:

Option: “Use default subject set” (default ON)

If streams enabled, show subject-set mapping per stream (optional)

Assessment structure preset:

Default: CA + Exams (simple)

Example presets:

“CA 40 / Exam 60”

“CA 30 / Exam 70”

(Editable later; keep it minimal here)

CTA: Save & Continue

Step 5: Review & Create
UI

Title: Review Academic Setup

Show a clean summary:

Session: 2025/2026

Terms: 3 terms

Levels enabled: Primary + Secondary

Class years: Primary 1–6, JSS1–3, SS1–3

Arms: None (or “Blue/Gold” etc.)

Streams: Off/On

Provide “Edit” links back to each step

Primary CTA: Create Academic Structure

Create actions (backend)

Create: Session + Terms

Create: Levels

Create: ClassYears

Create: ClassGroups

Create: Default subject sets (only if enabled)

Success screen

“Academic setup complete”

Next recommended step: “Import Students” and “Fees Setup”

Key UX rules (to avoid confusion)

Default = simplest possible

No arms unless user opts in

No term dates unless user opts in

Subjects setup can be postponed

Advanced options are progressive disclosure

Arms naming + streams are in Advanced

Always show a preview of what will be created

Allow editing after wizard

Settings → Academics should allow adjustments with proper warnings (e.g., changing structure mid-term)

Data model hints for implementation (so UI stays consistent)

Store a simple academicSetupState while the wizard runs:

schoolType

sessionName, termCount, termNames, optional termDates

levelsEnabled (nursery/primary/jss/sss)

armsEnabled, armsNamingMode, arms[]

streamsEnabled, streams[]

generatedClassYears[], generatedClassGroups[]

completion flags