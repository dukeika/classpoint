# Architecture

## Stack decisions (locked)
- Frontend: Next.js (apps/web) SSR/Edge via OpenNext on CloudFront + S3.
- Auth: Cognito with custom `schoolId` claim in tokens and groups for roles.
- API: AppSync GraphQL with DynamoDB backing tables; Lambda resolvers where needed; EventBridge/SQS for async flows.
- Storage: S3 (logos/uploads/receipts) with block-public-access and KMS; presigned upload for clients.
- Edge/Security: CloudFront + WAF; wildcard domain `*.classpoint.ng` and `app.classpoint.ng`.
- Messaging: WhatsApp/Twilio via Lambda; config from Secrets Manager/SSM.
- Payments: Paystack/Flutterwave webhooks via API Gateway/Lambda; idempotent payment records; invoicing worker recalculates totals via events.
- Observability: CloudWatch logs/metrics/alarms; structured logs with requestId + schoolId.

## ASCII component map (high-level)
```
Users (Parents/Staff/HQ)
   |
Route 53
   |
CloudFront + WAF  --+--> S3 (Next.js static assets)
                    |
                    +--> OpenNext SSR (Lambda) for dynamic routes
                    |
                    +--> AppSync (GraphQL)
                    |        |
                    |        +--> DynamoDB (tenant tables, KMS)
                    |        +--> Lambda resolvers (secure/complex paths)
                    |        +--> EventBridge (domain events)
                    |                      |
                    |                      v
                    |                 SQS queues --> Worker Lambdas (invoicing, messaging)
                    |                 EventBridge rules --> Worker Lambdas (imports)
                    |
                    +--> API Gateway (webhooks) --> Lambda (payments callbacks)
                    |
                    +--> CloudFront Functions / Lambda@Edge (subdomain routing, headers)

S3 (uploads/proofs/receipts, KMS) <--> presigned URLs for clients
Secrets Manager/SSM (provider creds) --> Lambdas (payments/messaging)
```

## Auth and tenancy (sequence)
```
Client -> Cognito Hosted UI -> JWT (groups + custom:schoolId)
Client -> AppSync with JWT
AppSync @auth enforces ownerField=schoolId (custom:schoolId)
Resolver/Lambda re-validates request.schoolId === token.schoolId
DynamoDB queries always include schoolId partition key
```

## Async/eventing
- EventBridge bus per env (`classpoint-{env}`) with rules routing payment.confirmed/invoice.generated to SQS queues and import.requested directly to the import worker.
- SQS queues + DLQs for invoicing/messaging; import worker invoked directly from EventBridge rules.
- AppSync mutation `publishEvent(detailType, source, detail)` uses a Lambda to publish to EventBridge.
- Parent optional item selection updates InvoiceLines, recomputes optionalSubtotal/amountDue, emits `invoice.generated` for full recalculation.

## Online payment (sequence)
```
Parent UI -> create PaymentIntent (AppSync)
UI -> Gateway checkout (Paystack/Flutterwave) with ref
 Gateway -> API Gateway webhook -> Lambda (verify signature/idempotent)
Lambda -> PaymentTransaction CONFIRMED -> EventBridge payment.confirmed
payment.confirmed -> invoicing worker recalculates totals; messaging sender (WhatsApp/SMS/email)
Client -> poll/subscription sees updated invoice/receipt
```

## Messaging campaign (sequence)
```
Admin -> create campaign (AppSync)
AppSync -> MessageRecipients (DynamoDB)
Worker -> SQS -> send via WhatsApp/Twilio (Secrets Manager creds)
Provider callback -> update MessageRecipient status
Alarms on failure rate; retries with backoff
```

## Logical component layout (text)
- Edge: Route 53 -> CloudFront (+WAF) -> S3 origin (Next.js static) + Lambda@Edge/CloudFront Functions (subdomain routing, security headers).
- DNS is live for `classpoint.ng` with `app.classpoint.ng` for HQ and `{slug}.classpoint.ng` for tenants.
- Auth: Cognito User Pool (groups: APP_ADMIN, SCHOOL_ADMIN, BURSAR, TEACHER, PARENT) + custom `schoolId` claim for tenant users.
- API: AppSync GraphQL (schema in services/api) -> direct DynamoDB resolvers for CRUD paths; Lambda resolvers for composite/secure flows; uses Cognito auth.
- Data: DynamoDB tables per model (Amplify-style) with GSIs for access patterns; all items keyed by `schoolId`.
- Async: EventBridge for domain events (payment.confirmed, invoice.generated, message.requested); SQS worker Lambdas for invoicing/messaging; import worker runs from EventBridge rule target.
- Storage: S3 buckets (public assets, uploads/proofs, receipts) with KMS and presigned uploads.
- Messaging: provider-agnostic hub (Twilio SMS/WhatsApp today; pluggable); status callbacks validate signature and update DynamoDB via providerMessageId GSI + status history.
- Payments: API Gateway/Lambda webhook endpoint verifies signatures -> updates DynamoDB -> emits events.

## Auth and tenancy flow (detailed)
1) User hits `{slug}.classpoint.ng` -> CloudFront serves Next.js.
2) Login with Cognito Hosted UI / custom UI -> token issued with `custom:schoolId` and groups.
3) Frontend attaches JWT to AppSync requests.
4) AppSync `@auth` enforces ownerField `schoolId` against `custom:schoolId`.
5) Resolvers/services validate `request.schoolId === token.schoolId` before DB ops.
6) Responses include only tenant-scoped data; audit events log `schoolId`.

## Payments flow (online)
1) Parent clicks "Pay" -> frontend calls AppSync mutation to create PaymentIntent (stores amount/invoiceId/gateway ref).
2) Frontend launches gateway (Paystack/Flutterwave) with reference.
3) Gateway notifies webhook (API Gateway + Lambda); Lambda verifies signature/idempotency.
4) Lambda writes PaymentTransaction CONFIRMED and updates Invoice snapshot; emits `payment.confirmed`.
5) `payment.confirmed` triggers receipts worker (receipt record), invoicing recalculation, and messaging.
6) AppSync subscription/poll updates client; receipt available (record/PDF).

## Payments flow (manual/offline)
1) Parent/bursar submits proof via presigned S3 upload; mutation creates ManualPaymentProof (status SUBMITTED).
2) Reviewer approves/rejects -> PaymentTransaction recorded (method MANUAL/TRANSFER) -> Invoice totals updated.
3) Audit event logged; optional notification sent.

## Messaging flow
1) Event (invoice issued/payment confirmed/announcement) or campaign creation triggers MessageCampaign + MessageRecipients.
2) Sender Lambda pulls from SQS, resolves template variables, sends via WhatsApp/Twilio using credentials from Secrets Manager.
3) Domain events (`payment.confirmed`, `invoice.generated`/processed, `invoice.overdue`) emit `messaging.requested` automatically; result/announcement events are emitted via helper mutations.
4) Delivery callbacks update MessageRecipient status; failures retried with backoff; metrics/alarms on failure rates.

## Import flow (students/parents)
1) Admin uploads CSV to S3 via presigned URL.
2) `createImportJob` writes an ImportJob record and publishes `import.requested`.
3) Import worker parses/validates CSV, writes Students/Parents/Links/Enrollments in batches, updates ImportJob status/counts, and stores an error report CSV in S3.

## Result gating flow
1) Teacher publishes scores -> ReportCard generated (status READY).
2) Before publish to parent, service checks ResultReleasePolicy vs Invoice payments (percentage paid).
3) If below threshold, block access and return policy message; log audit.

## Network and KMS
- Perimeter: Route 53 -> CloudFront (+WAF) as public entry. AppSync is internet-facing but locked to Cognito auth; webhook/API Gateway endpoints fronted by WAF rules/rate limits.
- VPC stance: Prefer VPC-less for Lambdas unless outbound control is required. If VPC is used (e.g., for interface endpoints), put Lambdas in private subnets with no public IP, egress via NAT or VPC endpoints (S3, Secrets Manager, SSM, DynamoDB optional gateway endpoint).
- Private data paths: No public databases; DynamoDB is managed; S3 buckets block public access with explicit allowed principals only.
- KMS keys:
  - Separate CMKs for: (a) app data (DynamoDB), (b) S3 buckets (assets/uploads/receipts), (c) secrets (Secrets Manager/SSM), (d) optional logs.
  - Grant least-privilege key access per Lambda/service role; disable wildcard `kms:*`; enable key rotation.
  - Use SSE-KMS on buckets and DynamoDB tables; enforce bucket policies requiring TLS and denying unencrypted puts.
- Backups/recovery:
  - DynamoDB PITR enabled for all tables; table export to S3 for point-in-time restores if needed.
  - S3 versioning on critical buckets (uploads/receipts/config). Optionally enable lifecycle + replication for durability.
  - Document restore runbooks (table restore, S3 object version recovery); periodic DR drill recommended.
