# Security (Stub)

Guardrails (from build guidelines):
- Separate AWS accounts: dev, stage, prod. Prod deploy via pipeline role only; no long-lived keys.
- Assume-role only; permission boundaries; explicit denies for public S3, wide-open SGs, disabling CloudTrail/Config/GuardDuty.
- Tenant isolation: every record keyed by `schoolId`; AppSync resolvers enforce `request.schoolId === token.schoolId` and apply tenant filters on non-schoolId GSIs.
- RBAC: server-side permission checks for sensitive actions (fees adjustments, refunds, role changes, result publish).
- Secrets: Secrets Manager/SSM only; no secrets in code, clients, or logs.
- Data protection: TLS everywhere; KMS for DynamoDB/S3/Secrets; WAF at edge; rate limits on auth/payment endpoints.

Current status (dev):
- CloudFront WAF is enabled with baseline managed rules + rate limits.
- Tenant isolation smoke tests exist (`scripts/tenant-isolation-smoke.js`); negative cases still in progress.
- RBAC guards are partially enforced in resolvers; remaining sensitive paths pending.

Next to flesh out:
- Threat model and abuse cases (broken tenant isolation, auth bypass, payment replay, messaging abuse).
- IAM roles/policies for CDK deploy, app runtime (Lambdas), and least-privilege bucket/table access.
- Logging/monitoring requirements and alert thresholds.
- NDPR data handling: export/delete flows, retention rules.

Flows to guard (summary)
- Auth & tenancy: require `custom:schoolId` in token; reject if missing/mismatched; ensure all AppSync/Lambda paths filter by `schoolId` and guard request args.
- Payments: webhook signature verification; idempotency on reference/invoice; block double-allocation; audit adjustments/refunds/payment confirmations.
- Messaging: rate limit campaigns; protect templates from injection; handle opt-outs; store provider secrets in Secrets Manager only.
- Imports: virus scan uploads if enabled; validate CSV strictly; limit row counts per job; audit bulk writes/import completion.
- Roles: audit role creation/updates/deletes and user-role assignments/removals.
- Results gating: enforce fee threshold checks server-side; avoid client-side bypass.

Monitoring/alerts (to specify)
- Auth failures spike, WAF blocked requests, AppSync 4xx/5xx, DynamoDB throttles.
- Payment webhook failures/retries; mismatched signature attempts.
- Messaging send failures/delivery failures above threshold.
- Queue depth alarms (stuck jobs) for invoicing/messaging; EventBridge rule/Lambda error alarms for imports.

ASCII security/control overview
```
Edge
  Route 53 -> CloudFront + WAF (rate limits, IP rep, login/payment rules)
                  |
                  +-> AppSync (Cognito auth) -- ownerField=schoolId
                  |       |         \
                  |       |          \-- Lambda resolvers (RBAC + schoolId checks + audit)
                  |       |
                  |       +-> DynamoDB (schoolId PK, KMS, PITR)
                  |
                  +-> API Gateway (webhooks) -> Lambda (signature verify, idempotent, audit)
                  |
                  +-> S3 (block public access, SSE-KMS) via presigned only

Secrets
  Secrets Manager/SSM (provider creds) -> scoped IAM policies -> Lambdas only

Observability
  CloudWatch Logs/Metrics/Alarms (AppSync, Lambda, WAF, DynamoDB, queues)
  Structured logs with requestId + schoolId; alarms on auth failures, throttles, webhook/messaging errors

Async workers
- Validate SQS payloads before DB writes; drop/alert on malformed messages.
- Grant least-privilege IAM: invoicing worker only on billing tables; messaging worker on templates/recipients/provider configs; import worker on student/parent/enrollment tables and uploads bucket.
- Emit events via EventBridge with audited sources/detailTypes.
- Messaging delivery webhooks: Twilio signature validation on `StatusCallback`, updates scoped to `schoolId` + `recipientId`, and logs/audits status changes.

Secrets
- Provider credentials (WhatsApp/SMS/email/payments) should live in Secrets Manager; grant scoped read to messaging/payment handlers only.
- Payment webhook secret stored in Secrets Manager (`classpoint/{env}/payments/webhook`); verify HMAC signature and add idempotency on transaction reference.
```
