# UI Readiness Snapshot (Dev)

Last deploy: latest `ClasspointWebStack-dev` build (see CloudFront invalidation `/*` run post-deploy).

## Login & Access
- Single hosted login with school picker; demo option visible.
- Role gates (Admin/Teacher/Parent) show recovery actions and welcome cards when authenticated.
- Error/recovery flows: “Go to login” + “Sign out and try again” on access-required screens.

## Public & Demo
- Demo landing clarifies Parent vs Staff entry; support mailto present.
- Tenant public page includes contact CTA and demo-specific copy.
- Marketing site adds FAQ for rollout/term billing/local payments; “Built for local ops” messaging present.

## HQ/Platform/Admin/Teacher
- Platform `/platform`: clearer CTAs and KPI labels.
- Admin overview: campus/term badges; work queue empty state.
- Teacher dashboard: help link, class/attendance hints, quick actions.

## Portal
- Portal dashboard: empty-state guidance for children/invoices; support contact.
- Portal children: clearer empty state and support line.
- Signed-in welcome card for parents.

## Smoke Checks (dev)
- `https://app.classpoint.ng/platform` → 200
- `https://demo.classpoint.ng/` → 200
- `https://demo.classpoint.ng/login` → 200
- `https://demo.classpoint.ng/login?next=/portal` → 200
- `https://demo.classpoint.ng/login?next=/admin` → 200
