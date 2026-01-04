/**
 * Payment webhook handler (skeleton).
 * Validate provider signature (e.g., Paystack/Flutterwave), ensure idempotency, and emit payment.confirmed.
 */
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  TransactWriteCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');
const { randomUUID } = require('crypto');

const eb = new EventBridgeClient({});
const secrets = new SecretsManagerClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

let cachedWebhookSecret = null;

const loadWebhookSecret = async () => {
  if (cachedWebhookSecret !== null) return cachedWebhookSecret;
  if (process.env.PAYMENT_WEBHOOK_SECRET) {
    cachedWebhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    return cachedWebhookSecret;
  }
  const secretName = process.env.PAYMENT_WEBHOOK_SECRET_NAME;
  if (!secretName) {
    cachedWebhookSecret = null;
    return null;
  }
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: secretName }));
  if (!res.SecretString) {
    cachedWebhookSecret = null;
    return null;
  }
  try {
    const parsed = JSON.parse(res.SecretString);
    cachedWebhookSecret = parsed.secret || parsed.webhookSecret || res.SecretString;
  } catch (err) {
    cachedWebhookSecret = res.SecretString;
  }
  return cachedWebhookSecret;
};

const getNextReceiptNo = async (schoolId) => {
  if (!process.env.RECEIPT_COUNTERS_TABLE || !schoolId) {
    return `RCPT-${Date.now()}`;
  }
  const res = await dynamo.send(
    new UpdateCommand({
      TableName: process.env.RECEIPT_COUNTERS_TABLE,
      Key: { schoolId, id: 'receipt' },
      UpdateExpression: 'SET lastSeq = if_not_exists(lastSeq, :zero) + :inc, updatedAt = :now',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':now': new Date().toISOString()
      },
      ReturnValues: 'UPDATED_NEW'
    })
  );
  const seq = res.Attributes?.lastSeq || 0;
  return `RCPT-${seq}`;
};

const verifyPaystackSignature = (payload, signature, secret) => {
  if (!signature || !secret) return false;
  const computed = crypto.createHmac('sha512', secret).update(payload).digest('hex');
  return computed === signature;
};

const verifyFlutterwaveSignature = (payload, signature, secret) => {
  if (!signature || !secret) return false;
  const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return computed === signature;
};

const writeAuditEvent = async ({ schoolId, action, entityType, entityId, afterJson }) => {
  if (!process.env.AUDIT_EVENTS_TABLE || !schoolId || !entityId) return;
  await dynamo.send(
    new PutCommand({
      TableName: process.env.AUDIT_EVENTS_TABLE,
      Item: {
        schoolId,
        id: randomUUID(),
        actorUserId: null,
        action,
        entityType,
        entityId,
        afterJson: afterJson ? JSON.stringify(afterJson) : null,
        createdAt: new Date().toISOString()
      }
    })
  );
};

exports.handler = async (event) => {
  console.log('Payment webhook event', JSON.stringify(event));
  try {
    const rawBody = event.body || '';
    const detail = rawBody ? JSON.parse(rawBody) : {};
    const provider = (detail.provider || 'paystack').toLowerCase();
    const paystackSig =
      event.headers?.['x-paystack-signature'] || event.headers?.['X-Paystack-Signature'];
    const flwSig = event.headers?.['verif-hash'] || event.headers?.['Verif-Hash'];

    const secret = await loadWebhookSecret();
    const ok =
      provider === 'flutterwave'
        ? verifyFlutterwaveSignature(rawBody, flwSig, secret)
        : verifyPaystackSignature(rawBody, paystackSig, secret);
    if (!ok) {
      return { statusCode: 401, body: JSON.stringify({ error: 'invalid signature' }) };
    }

    // Idempotency: check payments table by reference if provided
    const reference = detail.reference || detail.data?.reference;
    const schoolId = detail.schoolId || detail.data?.metadata?.schoolId;
    const invoiceId = detail.invoiceId || detail.data?.metadata?.invoiceId;
    const amount = detail.amount || detail.data?.amount;

    if (reference && process.env.PAYMENT_TRANSACTIONS_TABLE && schoolId) {
      const res = await dynamo.send(
        new QueryCommand({
          TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
          IndexName: 'byReference',
          KeyConditionExpression: 'reference = :ref',
          ExpressionAttributeValues: { ':ref': reference }
        })
      );
      if ((res.Items || []).length > 0) {
        return { statusCode: 200, body: JSON.stringify({ ok: true, idempotent: true }) };
      }
    }

    let receiptNo = null;
    let paymentTxnId = null;
    const paidAt = detail.paidAt || new Date().toISOString();
    // Insert payment transaction and update invoice totals (best-effort, atomic when possible)
    if (process.env.PAYMENT_TRANSACTIONS_TABLE) {
      paymentTxnId = randomUUID();
      receiptNo = await getNextReceiptNo(schoolId);
      const paymentItem = {
        schoolId,
        id: paymentTxnId,
        invoiceId,
        method: detail.method || 'CARD',
        amount,
        currency: detail.currency || 'NGN',
        status: 'CONFIRMED',
        paidAt,
        reference: reference || `ref-${paymentTxnId}`,
        receiptNo
      };
      const shouldUpdateInvoice =
        !!process.env.INVOICES_TABLE && !!invoiceId && !!schoolId && typeof amount === 'number';

      try {
        if (shouldUpdateInvoice) {
          await dynamo.send(
            new TransactWriteCommand({
              TransactItems: [
                {
                  Put: {
                    TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
                    Item: paymentItem,
                    ConditionExpression: 'attribute_not_exists(reference)'
                  }
                },
                {
                  Update: {
                    TableName: process.env.INVOICES_TABLE,
                    Key: { schoolId, id: invoiceId },
                    UpdateExpression:
                      'SET amountPaid = if_not_exists(amountPaid, :zero) + :amt, amountDue = if_not_exists(amountDue, :zero) - :amt, lastPaymentAt = :paidAt',
                    ExpressionAttributeValues: {
                      ':amt': amount,
                      ':zero': 0,
                      ':paidAt': paidAt
                    },
                    ConditionExpression: 'attribute_exists(id)'
                  }
                }
              ]
            })
          );
        } else {
          await dynamo.send(
            new PutCommand({
              TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
              Item: paymentItem,
              ConditionExpression: 'attribute_not_exists(reference)'
            })
          );
        }
      } catch (err) {
        if (err.name === 'TransactionCanceledException') {
          // Retry payment insert if invoice update failed (e.g., invoice missing)
          await dynamo.send(
            new PutCommand({
              TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
              Item: paymentItem,
              ConditionExpression: 'attribute_not_exists(reference)'
            })
          );
        } else if (err.name !== 'ConditionalCheckFailedException') {
          throw err;
        } else {
          return { statusCode: 200, body: JSON.stringify({ ok: true, idempotent: true }) };
        }
      }
    }

    if (paymentTxnId) {
      await writeAuditEvent({
        schoolId,
        action: 'PAYMENT_CONFIRMED',
        entityType: 'PaymentTransaction',
        entityId: paymentTxnId,
        afterJson: {
          schoolId,
          invoiceId,
          amount,
          currency: detail.currency || 'NGN',
          paidAt,
          reference,
          receiptNo
        }
      });
    }

    if (process.env.EVENT_BUS_NAME) {
      await eb.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: process.env.EVENT_BUS_NAME,
              DetailType: 'payment.confirmed',
              Source: 'classpoint.payments',
              Detail: JSON.stringify({
                schoolId,
                invoiceId,
                amount,
                currency: detail.currency || 'NGN',
                paidAt,
                reference,
                receiptNo,
                raw: detail
              })
            },
            {
              EventBusName: process.env.EVENT_BUS_NAME,
              DetailType: 'messaging.requested',
              Source: 'classpoint.messaging',
              Detail: JSON.stringify({
                schoolId,
                invoiceId,
                amount,
                reference,
                receiptNo,
                currency: detail.currency || 'NGN',
                paidAt,
                templateType: 'PAYMENT_RECEIPT',
                detailType: 'payment.confirmed'
              })
            }
          ]
        })
      );
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Webhook handling failed', err);
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid' }) };
  }
};
