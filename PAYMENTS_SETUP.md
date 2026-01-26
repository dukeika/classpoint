# Paystack Test Setup (School Fees)

## URLs to configure
- Callback URL: `https://<school-subdomain>.<root-domain>/portal/payments/callback`
- Webhook URL (school fees): `https://<payments-api-gateway>/api/webhooks/paystack/school`
- Webhook URL (ClassPoint subscriptions): `https://<payments-api-gateway>/api/webhooks/paystack/classpoint`

You can copy both from the Admin > Settings > Provider configs page (Paystack section) if
`NEXT_PUBLIC_PAYMENTS_WEBHOOK_URL` is set in the web stack.

## Provider config (per school)
Create or edit a ProviderConfig record for Paystack:
- `type`: `PAYMENT_GATEWAY`
- `providerName`: `PAYSTACK`
- `status`: `ACTIVE`
- `configJson` fields:
  - `environment`: `test` or `live`
  - `publicKey_test`: PAYSTACK_TEST_PUBLIC_KEY
  - `secretKey_test`: PAYSTACK_TEST_SECRET_KEY
  - `publicKey_live`: PAYSTACK_LIVE_PUBLIC_KEY
  - `secretKey_live`: PAYSTACK_LIVE_SECRET_KEY
  - `webhookSecret`: optional override (defaults to secret key)

## Paystack dashboard
- Set the webhook URL to the `/api/webhooks/paystack/school` endpoint above.
- Set the callback URL to `/portal/payments/callback`.

## Test flow
1) Create an invoice (Admin > Fees > Invoices).
2) Parent opens invoice in portal and clicks Pay.
3) Complete payment in Paystack test checkout.
4) Callback page shows "Processing" then "Confirmed".
5) Invoice status updates to PARTIALLY_PAID/PAID.
6) Receipt appears in portal and is downloadable.

## Notes
- Paystack test mode requires test keys stored per school.
- Webhook signature validation uses the Paystack secret key (or the optional override).
- `PaymentIntent` status moves: INITIATED -> REDIRECTED -> SUCCEEDED/FAILED.
