# Scripts

## Tenant isolation harness
`scripts/tenant-isolation-smoke.js` is a lightweight integration harness for AppSync.

Required env:
- `APPSYNC_URL`
- `JWT_SCHOOL_A`
- `JWT_SCHOOL_B`

Optional env:
- `SCHOOL_A_ID`, `SCHOOL_B_ID`
- `INVOICE_NO_A`, `INVOICE_ID_A`, `CAMPAIGN_ID_A`
- `ALLOW_WRITE_TESTS=1` to run cross-tenant mutation checks
- `JWT_ADMIN_A` (defaults to `JWT_SCHOOL_A`)
- `JWT_LIMITED_A` (non-admin token for RBAC checks, same tenant as A)

Run:
```
node scripts/tenant-isolation-smoke.js
```

PowerShell helper:
```
cd scripts
.\run-tenant-isolation.ps1 -AppsyncUrl https://your-appsync/graphql -JwtSchoolA "<JWT>" -JwtSchoolB "<JWT>"
```

## Backfill invoice classGroupId
`scripts/backfill-invoice-classgroup.js` populates missing `Invoice.classGroupId` using Enrollments.

Required env:
- `INVOICES_TABLE`
- `ENROLLMENTS_TABLE`

Optional env:
- `SCHOOL_ID` to restrict to a tenant
- `MAX_UPDATES` to stop after N updates
- `DRY_RUN=1` or `--dry-run` to preview changes

Setup:
```
cd scripts
npm install
```

Run:
```
node scripts/backfill-invoice-classgroup.js --dry-run
```

## Seed dev data
`scripts/seed-dev-data.js` creates a demo school and basic academic structure.

Defaults:
- `STACK_NAME=ClasspointStack-dev`
- `SCHOOL_NAME=Demo School`
- `SCHOOL_SLUG=demo-school`
- `SCHOOL_CITY=Lagos`

Run:
```
node scripts/seed-dev-data.js
```

## Query messaging recipients by invoice (smoke)
`scripts/query-recipients.js` calls the `recipientsByInvoice` GraphQL query and prints destination/status/history.

Required:
- `GRAPHQL_URL` or `--url`
- `AUTH_TOKEN`/`ID_TOKEN` or `--token` (tenant admin ID token)
- `INVOICE_ID` or `--invoice`

Optional:
- `LIMIT` or `--limit` (default 50)

Run:
```
node scripts/query-recipients.js --url https://<api>/graphql --token "<ID token>" --invoice <invoiceId> --limit 20
```

## Payment smoke check
`scripts/payment-smoke.js` checks invoice/payment intent/payment transaction status for a given invoice.

Required env:
- `GRAPHQL_URL` or `APPSYNC_URL`
- `AUTH_TOKEN` or `ID_TOKEN`
- `INVOICE_ID`
- `SCHOOL_ID`

Run:
```
node scripts/payment-smoke.js
```
