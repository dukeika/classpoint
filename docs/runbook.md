# Runbook

Environments:
- dev, stage, prod (separate accounts). Deploy via CI/CD; prod requires manual approval.
- Default host until DNS: use CloudFront distribution domain output; when domains are ready, attach ACM cert + Route 53 records to CloudFront/AppSync/API Gateway.

Stacks (dev example, same naming per env):
- `ClasspointStack-<env>`: core data plane (AppSync, DynamoDB, Cognito, S3, EventBridge, base Lambdas).
- `ClasspointServicesStack-<env>`: edge + async (CloudFront, WAF, SQS, workers, API Gateway webhooks).
- `ClasspointPublishStack-<env>`: publish pipelines (announcements/results).
- `ClasspointAcademicsStack-<env>`: attendance/assessments resolvers.

Deploy order:
- `ClasspointStack-<env>` first, then `ClasspointServicesStack-<env>`, then `ClasspointPublishStack-<env>` and `ClasspointAcademicsStack-<env>`.

Core commands (infra):
- `cd infra; npm run build && npm run synth` – validate CDK app.
- `cd infra; npm run diff -- --profile <profile> -c env=<env>` – inspect changes.
- `cd infra; npm run deploy -- --profile <profile> -c env=<env>` – deploy target env (pipeline-owned role in prod).
- `cd infra; npm run lint:schema` – schema lint (allows custom directives, warnings only).

Frontend deploy (static export):
- Ensure `apps/web/.env.local` sets `NEXT_PUBLIC_APPSYNC_URL` (and `NEXT_PUBLIC_APPSYNC_PUBLIC_URL` if needed) so the static build talks directly to AppSync instead of `/api/graphql`.
- Build/export: `cd apps/web && npm run build` (outputs to `apps/web/out`).
- Upload `apps/web/out` to the `FrontendBucketName` output from `ClasspointServicesStack-<env>`.
- Invalidate the CloudFront distribution (output `CloudFrontDomain`) after upload.

Deploy / rollback guardrails:
- Deploy from CI/CD only; prod requires a manual approval gate.
- Always run build + diff before deploy; review DynamoDB/queue changes.
- Rollback options: redeploy previous artifact, toggle feature flags, or disable EventBridge rules if a worker misbehaves. Prefer additive schema changes; avoid destructive field removals.
- Keep PITR enabled for DynamoDB; S3 versioning on uploads/receipts. Document restore steps per env (PITR restore or S3 previous version).

Backups / restores (quick steps):
- DynamoDB PITR: restore affected table to a point-in-time, validate records, then swap table name in env vars or rebuild from restored table (use scripts to backfill if needed).
- S3 versioning: retrieve previous object version (uploads/receipts) and re-link in record if a bad overwrite occurred.

Upcoming entries:
- Provisioning: how to create/update a School (platform admin flow).
- Payments: webhook handling path and replay/idempotency checks.
- Messaging: campaign send flow and failure handling.
- Backups/restores: DynamoDB PITR, S3 versioning recovery steps.
- Incident steps: rollbacks (previous artifact/feature flags), log locations, alarms to watch.
- Edge/Async: CloudFront domain output, CloudFront logs bucket, EventBridge bus name, SQS queue URLs (in stack outputs). Workers consume invoicing/messaging queues; import worker is triggered directly by an EventBridge rule.
- WAF: attached to CloudFront in stage/prod (enabled in dev once the account allows CloudFront-scoped WAF).
- Payment webhook endpoint: exposed via API Gateway `payments/webhook` to the payment webhook Lambda (signature verification in code).
- Secrets: payment webhook secret expected in Secrets Manager at `classpoint/{env}/payments/webhook`; messaging providers under `classpoint/{env}/providers/<provider>`.
- Alarms: SNS topic output `InfraAlarmsTopicArn` receives CloudFront 4xx/5xx, API Gateway 5xx/latency, webhook/worker errors, queue depth/age, DLQ depth, and canary failures.
- Dashboards: CloudWatch dashboard output `OpsDashboardName` shows CloudFront, API Gateway, Lambda errors, queues, and canary.
- Synthetics: CloudWatch canary output `PublicCanaryName` probes the public homepage via CloudFront.

Provider secret schema (messaging):
- Naming: `classpoint/{env}/providers/<key>` where `<key>` is referenced by campaigns/jobs (default key can be `twilio`).
- Shape examples:
  - Twilio SMS/WhatsApp:
    ```json
    {
      "type": "twilio",
      "accountSid": "ACxxxxxxxx",
      "authToken": "twilio-auth-token",
      "from": "+15551234567",
      "messagingServiceSid": "MGxxxxxxxx",
      "whatsappEnabled": true
    }
    ```
  - Email (SES):
    ```json
    {
      "type": "ses",
      "region": "us-east-1",
      "from": "no-reply@classpoint.dev",
      "subject": "Notification"
    }
    ```
- Log/no-op (dev):
  ```json
  { "type": "log" }
  ```
- Storage: Secrets Manager only; workers read with IAM-scoped `secretsmanager:GetSecretValue`. No secrets in code/env vars beyond secret names.

Notifications and templates:
- Templates needed per school: `PAYMENT_RECEIPT`, `INVOICE_ISSUED`, `OVERDUE_NOTICE`, `RESULT_READY`, `ANNOUNCEMENT`.
- Seed helper: `seedDefaultMessageTemplates(schoolId, channel)` creates missing defaults.
- Automated emissions:
  - `payment-webhook` emits `messaging.requested` with `templateType: PAYMENT_RECEIPT`.
  - Invoicing worker emits `messaging.requested` for invoice issued/processed and `OVERDUE_NOTICE` if past due with balance.
  - EventBridge routes `result.ready` (source `classpoint.academics`) and `announcement.published` (source `classpoint.cms`) to messaging.
- Delivery callbacks: messaging worker uses `DELIVERY_CALLBACK_URL` (set from `MessagingDeliveryCallbackUrl` stack output). Optionally set `WEBHOOK_BASE_URL` on the webhook for provider callbacks.
- Manual/stub emitters (AppSync mutations): `emitResultReadyNotification(schoolId, studentId, termId, classGroupId?)` and `emitAnnouncementNotification(schoolId, announcementId)`.
- Publish helpers (AppSync mutations): `publishAnnouncement` updates `publishedAt` + emits `announcement.published`; `publishResultReady` updates `ReportCard` + emits `result.ready`.
- Collections reminders: temporary UI enqueues one `messaging.requested` per defaulter; batch mutation `sendDefaulterReminders` added to reduce calls (use when API is updated).

Provisioning (stub):
- Use `provisionSchool(input)` to create School + SchoolProfile + SchoolDomain and seed default roles/permissions.
- Slug uniqueness is enforced; hostname defaults to `{slug}.classpoint.ng` until custom DNS.

Imports (stub):
- Call `createImportJob(schoolId, bucket, key)` to publish `import.requested`; status/counts are written to ImportJob and an errors CSV is stored to the uploads bucket.
- Use `importJobsBySchool(schoolId)` to list jobs; read `errorReportKey` for CSV details.
- Use `createImportUploadUrl(schoolId, fileName, contentType?)` to upload CSV to the uploads bucket.
- Use `createImportErrorDownloadUrl(schoolId, key)` with the `errorReportKey` to get a presigned download URL for the error report.

Fees (stub):
- Use `createFeeItem`, `createFeeSchedule`, `createFeeScheduleLine` to configure fees.
- Use `createInvoice` to generate an invoice and enqueue invoicing job (totals computed async). When `classGroupId` is omitted, the resolver derives it from the student's enrollment.

Payments (stub):
- Use `createPaymentIntent` to create a gateway intent (status INITIATED).
- Use `createManualPaymentProofUploadUrl` to upload manual proof, then `submitManualPaymentProof` to attach it (creates PENDING PaymentTransaction).
- Use `reviewManualPaymentProof` to approve/reject proofs; approval emits `payment.confirmed` for invoice recalculation + receipts.
- Receipt numbers are generated per school via ReceiptCounters.
- Use `createReceiptUploadUrl` to upload a PDF to S3, then `attachReceiptUrl` to link it to the Receipt record.
- Use `createReceiptDownloadUrl` to generate a presigned download URL.

Defaulters (stub):
- Query `defaultersByClass(termId, classGroupId, minDaysOverdue?, minAmountDue?)` for overdue invoices.
- Daily overdue scan rule triggers invoicing worker with `invoice.overdue.scan` (currently a stub).
- Ensure invoices carry `classGroupId` (pass it on create or backfill with `scripts/backfill-invoice-classgroup.js`).
