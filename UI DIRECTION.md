ClassPoint UI/UX Direction Spec (Mobile-First Dashboard OS)

1. Global layout rules (applies to every authenticated page)

All authenticated pages must use a consistent “Dashboard Shell” layout:

Left Sidebar Navigation

Fixed on desktop/tablet, collapsible to icons-only.

On mobile, sidebar becomes a slide-in drawer (hamburger menu).

Must support:

collapse/expand

active state highlighting

section grouping (e.g., “Academics”, “Finance”, “Communication”)

role-based visibility (only show what the user is allowed to access)

Top Bar (Header)

Always visible (sticky) with:

User display name (not user ID) + avatar initials (e.g., “Blessing A.”)

Notifications bell (with unread badge)

Search bar (global search)

Quick actions menu (context-aware)

Optional school selector (only for platform/admin users)

Must show user’s role label (e.g., “School Admin”, “Teacher”) subtly.

Main Content Area

Uses responsive grid and card-based layout.

Every page has:

Page title + breadcrumbs (desktop) / compact title bar (mobile)

Primary action button (top-right on desktop; bottom sticky action on mobile if important)

Filters and tabs (where needed)

Footer

Minimal, optional. Avoid clutter.

IMPORTANT

Display the user’s name everywhere (top bar, profile menu, activity logs); never show internal IDs in the UI.

IDs can exist internally but should not be the primary label.

2. Navigation rules (Sidebar)

Sidebar must be:

Collapsible (expanded: icon + label; collapsed: icon only + tooltip)

Supports nested menu items (accordion)

Has a “Favorites” section (user can pin 3–6 pages for quick access)

Shows “Help” + “Support” at bottom

Shows current school branding (logo + school name) at top for tenant users

Default sidebar behavior

Desktop: expanded by default

Mobile: collapsed, opens as drawer

Remember user preference (collapsed/expanded) per device

Role-based menu

Menus are dynamically generated from a permission map:

If user lacks permission, the menu item must not appear.

If user deep-links to a page without permission, show a clean 403 Access Denied screen with a “Request access” button (optional).

3. Top bar rules (Header)

Header contains:

Hamburger menu (mobile only, left)

Search (center or left)

Global search must support:

Students (name, admission number)

Invoices

Payments (reference)

Staff (name)

Classes

On mobile, search is a button that expands full width.

Notifications

Badge count

Notification panel dropdown:

“Payment received”

“Proof pending approval”

“Attendance pending”

“Results ready to publish”

Profile menu

Display name + role

Profile

Settings (role-dependent)

Switch account (optional)

Logout

Best practice

Keep the top bar height compact for mobile.

Avoid long labels; use icons + clear tooltips.

4. Dashboard page standard (applies to every role)

Every role’s landing page must be a Dashboard with:

“Today” or “Overview” cards at the top

A “Quick Actions” row (2–6 actions)

A “Work Queue” section (what needs action)

Recent activity feed (last 10 items)

Optional KPI charts (only if useful and readable on mobile)

Dashboard cards must be tappable and take users directly to the next action.

5. Mobile-first requirements (non-negotiable)

All layouts must work perfectly on:

360×640 (small Android)

390×844 (iPhone)

768×1024 (tablet)

Use large touch targets:

Minimum 44px height buttons

Adequate spacing between actions

Avoid horizontal scrolling on tables:

Use “card rows” on mobile (stack key fields)

Provide “View details” drill-in pages

Use sticky bottom actions where appropriate:

“Take Attendance”

“Pay Now”

“Approve Proof”

Support poor network:

Skeleton loading

Retry states

Offline-friendly caching for read-heavy screens (optional but ideal)

6. Page UI patterns (must implement consistently)
   A) Lists (tables) — desktop vs mobile

Desktop:

Standard table with:

search

filter chips

sortable columns

pagination (or “Load more”)

bulk actions (where relevant)

Mobile:

Replace tables with list cards:

Title line (bold)

2–4 key fields

Status pill (e.g., PAID, DUE, PENDING)

Right chevron to open detail view

B) Filters

Use filter chips + a “Filter” drawer on mobile

Filters must persist (until user clears)

C) Forms

Stepper forms for long workflows (imports, fee schedule creation)

Inline validation + friendly error messages

Save draft capability for complex forms (assessments, score entry)

Confirmation modals for destructive actions

D) Status & badges

Use consistent status pills everywhere:

PAID / PARTIAL / DUE / OVERDUE

SENT / FAILED

DRAFT / PUBLISHED

Status must be visible without opening the record.

7. UX requirements by user type (what their UI emphasizes)
   Application Admin (Platform)

Focus on:

Schools list + status

Subscription/add-ons

Platform analytics

Support tools

Must support “impersonate school (read-only)” with obvious banner: “Viewing as…”

School Admin

Focus on:

Setup wizard progress

Collections summary

Defaulters

Approvals queue

Staff management

Teacher (mobile-first)

Focus on:

“My classes today”

Attendance (fast)

Score entry (fast grid desktop; mobile simplified stepper)

Must minimize typing; use toggles and quick selections.

Parent/Student

Focus on:

Children cards

Fee breakdown + Pay now

Receipts

Announcements + Calendar

Results (if enabled)

Must be extremely simple, low clutter.

8. Additional UI features to include (best practices)

Dark mode toggle (optional, nice)

In-app help: quick tips / guided onboarding

Empty states that guide the user (“No invoices yet — generate invoices”)

Error boundary pages:

401 session expired → login redirect

403 forbidden → request access

404 not found → back to dashboard

500 unexpected → retry + report issue

Accessibility

Proper contrast

Keyboard nav on desktop

Screen-reader labels on controls

Performance

Code splitting per role

Lazy-load heavy pages

Optimize images (school logos/hero)

9. Visual style guidelines

Clean modern UI (cards + subtle shadows)

Rounded corners, readable font

Avoid dense screens; prioritize clarity

Use consistent spacing scale (8px grid)

Use icons + labels in nav for quick recognition

10. Implementation notes for the developer (do this)

Build a reusable layout component:

DashboardShell

SidebarNav

TopBar

Content

Build reusable UI components:

KpiCard, StatusPill, FilterDrawer, ListCardRow, EmptyState, ConfirmDialog

Enforce route protection:

requireAuth

requirePermission(permissionCode)

Ensure user profile display uses:

user.name (fallback to email prefix if name missing)

never display internal IDs
