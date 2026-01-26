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
  GetCommand,
  TransactWriteCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');
const { randomUUID } = require('crypto');

const eb = new EventBridgeClient({});
const secrets = new SecretsManagerClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

let cachedWebhookSecret = null;

const normalizeEnvironment = (value) => {
  return String(value || '').toLowerCase() === 'live' ? 'live' : 'test';
};

const pickEnvValue = (config, key, environment) => {
  const envKey = `${key}_${environment}`;
  if (typeof config[envKey] === 'string' && config[envKey].trim()) return config[envKey];
  const camelKey = `${key}${environment === 'live' ? 'Live' : 'Test'}`;
  if (typeof config[camelKey] === 'string' && config[camelKey].trim()) return config[camelKey];
  if (typeof config[key] === 'string' && config[key].trim()) return config[key];
  return '';
};

const resolvePaystackSecret = (config, environment) => {
  const env = normalizeEnvironment(environment || config.environment);
  const secretKey = pickEnvValue(config, 'secretKey', env);
  const webhookSecret =
    pickEnvValue(config, 'webhookSecret', env) || (config.webhookSecret ? String(config.webhookSecret) : '');
  return webhookSecret || secretKey || null;
};

const loadClasspointPaystackSecret = (environment) => {
  const env = normalizeEnvironment(environment || process.env.CLASSPOINT_PAYSTACK_ENV);
  return env === 'live'
    ? process.env.CLASSPOINT_PAYSTACK_SECRET_KEY_LIVE
    : process.env.CLASSPOINT_PAYSTACK_SECRET_KEY_TEST;
};

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

const loadSchoolWebhookSecret = async (schoolId, provider, environment) => {
  const tableName = process.env.PROVIDER_CONFIGS_TABLE;
  if (!tableName || !schoolId) return null;
  const providerKey = (provider || '').toUpperCase();
  const types = ['PAYMENT_GATEWAY', 'PAYMENTS'];
  for (const type of types) {
    const res = await dynamo.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'bySchoolProvider',
        KeyConditionExpression: 'schoolId = :sid and #type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':sid': schoolId, ':type': type }
      })
    );
    const match = (res.Items || []).find(
      (item) => String(item.providerName || '').toUpperCase() === providerKey
    );
    if (!match) continue;
    const rawConfig = match.configJson;
    let config = {};
    if (typeof rawConfig === 'string') {
      try {
        config = JSON.parse(rawConfig);
      } catch {
        config = {};
      }
    } else if (rawConfig && typeof rawConfig === 'object') {
      config = rawConfig;
    }
    if (providerKey === 'PAYSTACK') {
      return resolvePaystackSecret(config, environment);
    }
    return config.webhookSecret || config.secretKey || config.secret || null;
  }
  return null;
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

const writeWebhookEvent = async ({
  schoolId,
  provider,
  reference,
  eventType,
  environment,
  scope,
  signatureValid,
  payload,
  headers,
  status,
  error
}) => {
  if (!process.env.WEBHOOK_EVENTS_TABLE) return;
  await dynamo.send(
    new PutCommand({
      TableName: process.env.WEBHOOK_EVENTS_TABLE,
      Item: {
        schoolId: schoolId || 'UNKNOWN',
        id: randomUUID(),
        provider: provider ? String(provider).toUpperCase() : 'UNKNOWN',
        scope,
        reference: reference || null,
        eventType: eventType || null,
        environment: environment || null,
        signatureValid: Boolean(signatureValid),
        status: status || null,
        error: error || null,
        payload: payload || null,
        headers: headers ? JSON.stringify(headers) : null,
        receivedAt: new Date().toISOString()
      }
    })
  );
};

const normalizePaymentMethod = (value) => {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('transfer')) return 'TRANSFER';
  if (raw.includes('ussd')) return 'USSD';
  if (raw.includes('cash')) return 'CASH';
  return 'CARD';
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

const updatePaymentIntent = async (schoolId, paymentIntentId, updates) => {
  if (!process.env.PAYMENT_INTENTS_TABLE || !schoolId || !paymentIntentId) return;
  const names = [];
  const values = {};
  const expr = [];
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    const name = `#${key}`;
    const val = `:${key}`;
    names.push([name, key]);
    values[val] = value;
    expr.push(`${name} = ${val}`);
  });
  if (!expr.length) return;
  await dynamo.send(
    new UpdateCommand({
      TableName: process.env.PAYMENT_INTENTS_TABLE,
      Key: { schoolId, id: paymentIntentId },
      UpdateExpression: `SET ${expr.join(', ')}`,
      ExpressionAttributeNames: Object.fromEntries(names),
      ExpressionAttributeValues: values
    })
  );
};

const getRawBody = (event) => {
  if (!event?.body) return '';
  if (event.isBase64Encoded) {
    try {
      return Buffer.from(event.body, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }
  return event.body;
};

const safeJsonParse = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const findPaymentByReference = async (reference) => {
  if (!reference || !process.env.PAYMENT_TRANSACTIONS_TABLE) return null;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
      IndexName: 'byReference',
      KeyConditionExpression: 'reference = :ref',
      ExpressionAttributeValues: { ':ref': reference }
    })
  );
  return (res.Items || [])[0] || null;
};

const resolveBillingCycleMonths = (value) => {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('month')) return 1;
  if (raw.includes('term')) return 4;
  if (raw.includes('semester')) return 6;
  if (raw.includes('session') || raw.includes('year') || raw.includes('annual')) return 12;
  return 1;
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const loadPlanById = async (planId) => {
  if (!process.env.PLANS_TABLE || !planId) return null;
  const res = await dynamo.send(
    new GetCommand({
      TableName: process.env.PLANS_TABLE,
      Key: { id: planId }
    })
  );
  return res.Item || null;
};

const upsertSubscription = async ({ schoolId, subscriptionId, planId, billingCycle }) => {
  if (!process.env.SCHOOL_SUBSCRIPTIONS_TABLE || !schoolId || !planId) return null;
  const now = new Date();
  const months = resolveBillingCycleMonths(billingCycle);
  const startAt = now.toISOString();
  const endAt = addMonths(now, months).toISOString();

  if (subscriptionId) {
    await dynamo.send(
      new UpdateCommand({
        TableName: process.env.SCHOOL_SUBSCRIPTIONS_TABLE,
        Key: { schoolId, id: subscriptionId },
        UpdateExpression:
          'SET #status = :status, planId = :planId, startAt = :startAt, endAt = :endAt, renewalAt = :renewalAt, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'ACTIVE',
          ':planId': planId,
          ':startAt': startAt,
          ':endAt': endAt,
          ':renewalAt': endAt,
          ':updatedAt': new Date().toISOString()
        }
      })
    );
    return subscriptionId;
  }

  const id = randomUUID();
  await dynamo.send(
    new PutCommand({
      TableName: process.env.SCHOOL_SUBSCRIPTIONS_TABLE,
      Item: {
        schoolId,
        id,
        planId,
        status: 'ACTIVE',
        startAt,
        endAt,
        renewalAt: endAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  );
  return id;
};

exports.handler = async (event) => {
  console.log('Payment webhook event', JSON.stringify({ path: event?.path, id: event?.requestContext?.requestId }));
  const scope = String(process.env.WEBHOOK_SCOPE || 'school').toLowerCase();
  const rawBody = getRawBody(event);
  const detail = safeJsonParse(rawBody);
  const provider = (detail.provider || detail.data?.provider || 'paystack').toLowerCase();
  const paystackSig =
    event.headers?.['x-paystack-signature'] || event.headers?.['X-Paystack-Signature'];
  const flwSig = event.headers?.['verif-hash'] || event.headers?.['Verif-Hash'];

  const metadata = detail.metadata || detail.data?.metadata || {};
  const paymentType = String(metadata.type || metadata.paymentType || '').toUpperCase();
  const environment = normalizeEnvironment(metadata.environment || process.env.CLASSPOINT_PAYSTACK_ENV);
  const schoolId = metadata.schoolId || detail.schoolId || detail.data?.metadata?.schoolId || null;
  const reference = detail.reference || detail.data?.reference || null;
  const eventType = detail.event || detail.data?.event || null;

  let secret = null;
  if (provider === 'paystack') {
    secret =
      scope === 'classpoint'
        ? loadClasspointPaystackSecret(environment)
        : await loadSchoolWebhookSecret(schoolId, provider, environment);
  } else if (provider === 'flutterwave') {
    secret = await loadSchoolWebhookSecret(schoolId, provider, environment);
  }
  if (!secret) {
    secret = await loadWebhookSecret();
  }

  const signatureOk =
    provider === 'flutterwave'
      ? verifyFlutterwaveSignature(rawBody, flwSig, secret)
      : verifyPaystackSignature(rawBody, paystackSig, secret);

  await writeWebhookEvent({
    schoolId,
    provider,
    reference,
    eventType,
    environment,
    scope,
    signatureValid: signatureOk,
    payload: rawBody,
    headers: event.headers,
    status: signatureOk ? 'VERIFIED' : 'REJECTED'
  });

  if (!signatureOk) {
    return { statusCode: 401, body: JSON.stringify({ error: 'invalid signature' }) };
  }

  if (provider === 'paystack') {
    const isSuccessEvent = !eventType || eventType === 'charge.success';
    const isSuccessStatus = !detail.data?.status || detail.data.status === 'success';
    if (!isSuccessEvent || !isSuccessStatus) {
      if (scope !== 'classpoint') {
        await updatePaymentIntent(metadata.schoolId || detail.schoolId, metadata.paymentIntentId, {
          status: 'FAILED',
          failedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      if (reference) {
        const existing = await findPaymentByReference(reference);
        if (existing && process.env.PAYMENT_TRANSACTIONS_TABLE) {
          await dynamo.send(
            new UpdateCommand({
              TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
              Key: { schoolId: existing.schoolId, id: existing.id },
              UpdateExpression: 'SET #status = :status, providerResponse = :response, processedAt = :now, updatedAt = :now',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': 'FAILED',
                ':response': detail,
                ':now': new Date().toISOString()
              }
            })
          );
        }
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true, ignored: true }) };
    }
  }

  if (scope === 'classpoint') {
    if (paymentType && paymentType !== 'SUBSCRIPTION') {
      return { statusCode: 200, body: JSON.stringify({ ok: true, ignored: true }) };
    }
    if (!schoolId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'missing schoolId' }) };
    }

    const rawAmount = Number(detail.amount || detail.data?.amount || detail.data?.amount_paid || 0);
    const amount = provider === 'paystack' ? rawAmount / 100 : rawAmount;
    const rawFee = Number(detail.fees || detail.data?.fees || 0);
    const providerFee = provider === 'paystack' ? rawFee / 100 : rawFee;
    const paidAt = detail.paidAt || detail.data?.paid_at || new Date().toISOString();
    const planId = metadata.planId;
    const subscriptionId = metadata.subscriptionId || null;
    if (!planId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'missing planId' }) };
    }

    const existingTxn = reference ? await findPaymentByReference(reference) : null;
    if (existingTxn && existingTxn.status && existingTxn.status !== 'PENDING') {
      return { statusCode: 200, body: JSON.stringify({ ok: true, idempotent: true }) };
    }

    if (planId) {
      const plan = await loadPlanById(planId);
      if (plan && Number.isFinite(Number(plan.basePrice)) && Number(plan.basePrice) > 0) {
        const expected = Number(plan.basePrice);
        if (Number.isFinite(amount) && amount > 0 && Math.abs(amount - expected) > 0.01) {
          console.warn('Subscription amount mismatch', JSON.stringify({ schoolId, amount, expected, planId }));
        }
      }
    }

    const subscriptionRecordId = await upsertSubscription({
      schoolId,
      subscriptionId,
      planId,
      billingCycle: metadata.billingCycle
    });

    if (process.env.PAYMENT_TRANSACTIONS_TABLE) {
      const paymentTxnId = existingTxn?.id || randomUUID();
      const paymentItem = {
        schoolId,
        id: paymentTxnId,
        subscriptionId: subscriptionRecordId || subscriptionId || null,
        provider: provider.toUpperCase(),
        method: normalizePaymentMethod(detail.method || detail.data?.channel),
        amount: Number.isFinite(amount) ? amount : 0,
        grossAmount: Number.isFinite(amount) ? amount : null,
        netAmount:
          Number.isFinite(amount) && Number.isFinite(providerFee) ? amount - providerFee : null,
        providerFee: Number.isFinite(providerFee) ? providerFee : null,
        currency: detail.currency || detail.data?.currency || 'NGN',
        status: 'CONFIRMED',
        paidAt,
        reference: reference || `ref-${paymentTxnId}`,
        providerReference: reference || null,
        type: 'SUBSCRIPTION',
        environment,
        metadata,
        providerResponse: detail,
        processedAt: paidAt,
        updatedAt: new Date().toISOString()
      };
      if (existingTxn) {
        await dynamo.send(
          new UpdateCommand({
            TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
            Key: { schoolId: existingTxn.schoolId, id: existingTxn.id },
            UpdateExpression:
              'SET #status = :status, method = :method, amount = :amount, grossAmount = :grossAmount, netAmount = :netAmount, providerFee = :providerFee, currency = :currency, paidAt = :paidAt, providerReference = :providerReference, type = :type, environment = :environment, metadata = :metadata, providerResponse = :response, processedAt = :processedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'CONFIRMED',
              ':method': paymentItem.method,
              ':amount': paymentItem.amount,
              ':grossAmount': paymentItem.grossAmount,
              ':netAmount': paymentItem.netAmount,
              ':providerFee': paymentItem.providerFee,
              ':currency': paymentItem.currency,
              ':paidAt': paymentItem.paidAt,
              ':providerReference': paymentItem.providerReference,
              ':type': paymentItem.type,
              ':environment': paymentItem.environment,
              ':metadata': paymentItem.metadata,
              ':response': paymentItem.providerResponse,
              ':processedAt': paymentItem.processedAt,
              ':updatedAt': paymentItem.updatedAt
            }
          })
        );
      } else {
        await dynamo.send(
          new PutCommand({
            TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
            Item: {
              ...paymentItem,
              createdAt: new Date().toISOString()
            }
          })
        );
      }

      await writeAuditEvent({
        schoolId,
        action: 'SUBSCRIPTION_PAYMENT_CONFIRMED',
        entityType: 'PaymentTransaction',
        entityId: paymentTxnId,
        afterJson: {
          schoolId,
          subscriptionId: subscriptionRecordId || subscriptionId,
          amount: paymentItem.amount,
          currency: paymentItem.currency,
          paidAt,
          reference
        }
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (paymentType && paymentType !== 'SCHOOL_FEE') {
    return { statusCode: 200, body: JSON.stringify({ ok: true, ignored: true }) };
  }

  const invoiceId = detail.invoiceId || metadata.invoiceId;
  const paymentIntentId = detail.paymentIntentId || metadata.paymentIntentId || null;
  const rawAmount = Number(detail.amount || detail.data?.amount || detail.data?.amount_paid || 0);
  const amount = provider === 'paystack' ? rawAmount / 100 : rawAmount;
  const rawFee = Number(detail.fees || detail.data?.fees || 0);
  const providerFee = provider === 'paystack' ? rawFee / 100 : rawFee;
  const paidAt = detail.paidAt || detail.data?.paid_at || new Date().toISOString();
  if (!schoolId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'missing schoolId' }) };
  }

  const existingTxn = reference ? await findPaymentByReference(reference) : null;
  if (existingTxn && existingTxn.status && existingTxn.status !== 'PENDING') {
    return { statusCode: 200, body: JSON.stringify({ ok: true, idempotent: true }) };
  }

  let receiptNo = null;
  let paymentTxnId = existingTxn?.id || null;
  let amountApplied = Number.isFinite(amount) ? amount : 0;
  let invoice = null;
  if (process.env.INVOICES_TABLE && invoiceId) {
    const invoiceRes = await dynamo.send(
      new GetCommand({
        TableName: process.env.INVOICES_TABLE,
        Key: { schoolId, id: invoiceId }
      })
    );
    invoice = invoiceRes.Item || null;
    if (invoice) {
      const currentDue = Number(invoice.amountDue || 0);
      amountApplied = Math.min(amount, currentDue);
      if (amountApplied < amount) {
        console.warn(
          'Overpayment detected, capping applied amount',
          JSON.stringify({ invoiceId, amount, amountApplied, schoolId })
        );
      }
    }
  }

  if (process.env.PAYMENT_TRANSACTIONS_TABLE) {
    receiptNo = await getNextReceiptNo(schoolId);
    const paymentItem = {
      schoolId,
      id: paymentTxnId || randomUUID(),
      invoiceId,
      paymentIntentId,
      provider: provider.toUpperCase(),
      method: normalizePaymentMethod(detail.method || detail.data?.channel),
      amount: amountApplied,
      grossAmount: Number.isFinite(amount) ? amount : null,
      netAmount: Number.isFinite(amount) && Number.isFinite(providerFee) ? amount - providerFee : null,
      providerFee: Number.isFinite(providerFee) ? providerFee : null,
      currency: detail.currency || detail.data?.currency || 'NGN',
      status: 'CONFIRMED',
      paidAt,
      reference: reference || `ref-${paymentTxnId || 'payment'}`,
      providerReference: reference || null,
      receiptNo,
      type: 'SCHOOL_FEE',
      environment,
      metadata,
      providerResponse: detail,
      processedAt: paidAt,
      updatedAt: new Date().toISOString()
    };
    const shouldUpdateInvoice =
      !!process.env.INVOICES_TABLE &&
      !!invoiceId &&
      !!schoolId &&
      typeof amountApplied === 'number' &&
      amountApplied > 0;

    try {
      if (existingTxn) {
        if (shouldUpdateInvoice) {
          await dynamo.send(
            new TransactWriteCommand({
              TransactItems: [
                {
                  Update: {
                    TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
                    Key: { schoolId: existingTxn.schoolId, id: existingTxn.id },
                    UpdateExpression:
                      'SET #status = :status, method = :method, amount = :amount, grossAmount = :grossAmount, netAmount = :netAmount, providerFee = :providerFee, currency = :currency, paidAt = :paidAt, providerReference = :providerReference, receiptNo = :receiptNo, type = :type, environment = :environment, metadata = :metadata, providerResponse = :response, processedAt = :processedAt, updatedAt = :updatedAt',
                    ExpressionAttributeNames: { '#status': 'status' },
                    ExpressionAttributeValues: {
                      ':status': 'CONFIRMED',
                      ':method': paymentItem.method,
                      ':amount': paymentItem.amount,
                      ':grossAmount': paymentItem.grossAmount,
                      ':netAmount': paymentItem.netAmount,
                      ':providerFee': paymentItem.providerFee,
                      ':currency': paymentItem.currency,
                      ':paidAt': paymentItem.paidAt,
                      ':providerReference': paymentItem.providerReference,
                      ':receiptNo': paymentItem.receiptNo,
                      ':type': paymentItem.type,
                      ':environment': paymentItem.environment,
                      ':metadata': paymentItem.metadata,
                      ':response': paymentItem.providerResponse,
                      ':processedAt': paymentItem.processedAt,
                      ':updatedAt': paymentItem.updatedAt,
                      ':pending': 'PENDING'
                    },
                    ConditionExpression: '#status = :pending'
                  }
                },
                {
                  Update: {
                    TableName: process.env.INVOICES_TABLE,
                    Key: { schoolId, id: invoiceId },
                    UpdateExpression:
                      'SET amountPaid = if_not_exists(amountPaid, :zero) + :amt, amountDue = if_not_exists(amountDue, :zero) - :amt, lastPaymentAt = :paidAt',
                    ExpressionAttributeValues: {
                      ':amt': amountApplied,
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
            new UpdateCommand({
              TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
              Key: { schoolId: existingTxn.schoolId, id: existingTxn.id },
              UpdateExpression:
                'SET #status = :status, method = :method, amount = :amount, grossAmount = :grossAmount, netAmount = :netAmount, providerFee = :providerFee, currency = :currency, paidAt = :paidAt, providerReference = :providerReference, receiptNo = :receiptNo, type = :type, environment = :environment, metadata = :metadata, providerResponse = :response, processedAt = :processedAt, updatedAt = :updatedAt',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': 'CONFIRMED',
                ':method': paymentItem.method,
                ':amount': paymentItem.amount,
                ':grossAmount': paymentItem.grossAmount,
                ':netAmount': paymentItem.netAmount,
                ':providerFee': paymentItem.providerFee,
                ':currency': paymentItem.currency,
                ':paidAt': paymentItem.paidAt,
                ':providerReference': paymentItem.providerReference,
                ':receiptNo': paymentItem.receiptNo,
                ':type': paymentItem.type,
                ':environment': paymentItem.environment,
                ':metadata': paymentItem.metadata,
                ':response': paymentItem.providerResponse,
                ':processedAt': paymentItem.processedAt,
                ':updatedAt': paymentItem.updatedAt
              }
            })
          );
        }
        paymentTxnId = existingTxn.id;
      } else if (shouldUpdateInvoice) {
        await dynamo.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Put: {
                  TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
                  Item: {
                    ...paymentItem,
                    createdAt: new Date().toISOString()
                  }
                }
              },
              {
                Update: {
                  TableName: process.env.INVOICES_TABLE,
                  Key: { schoolId, id: invoiceId },
                  UpdateExpression:
                    'SET amountPaid = if_not_exists(amountPaid, :zero) + :amt, amountDue = if_not_exists(amountDue, :zero) - :amt, lastPaymentAt = :paidAt',
                  ExpressionAttributeValues: {
                    ':amt': amountApplied,
                    ':zero': 0,
                    ':paidAt': paidAt
                  },
                  ConditionExpression: 'attribute_exists(id)'
                }
              }
            ]
          })
        );
        paymentTxnId = paymentItem.id;
      } else {
        await dynamo.send(
          new PutCommand({
            TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
            Item: {
              ...paymentItem,
              createdAt: new Date().toISOString()
            }
          })
        );
        paymentTxnId = paymentItem.id;
      }
    } catch (err) {
      if (err.name === 'TransactionCanceledException') {
        await dynamo.send(
          new UpdateCommand({
            TableName: process.env.PAYMENT_TRANSACTIONS_TABLE,
            Key: { schoolId: paymentItem.schoolId, id: paymentItem.id },
            UpdateExpression:
              'SET #status = :status, method = :method, amount = :amount, grossAmount = :grossAmount, netAmount = :netAmount, providerFee = :providerFee, currency = :currency, paidAt = :paidAt, providerReference = :providerReference, receiptNo = :receiptNo, type = :type, environment = :environment, metadata = :metadata, providerResponse = :response, processedAt = :processedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'CONFIRMED',
              ':method': paymentItem.method,
              ':amount': paymentItem.amount,
              ':grossAmount': paymentItem.grossAmount,
              ':netAmount': paymentItem.netAmount,
              ':providerFee': paymentItem.providerFee,
              ':currency': paymentItem.currency,
              ':paidAt': paymentItem.paidAt,
              ':providerReference': paymentItem.providerReference,
              ':receiptNo': paymentItem.receiptNo,
              ':type': paymentItem.type,
              ':environment': paymentItem.environment,
              ':metadata': paymentItem.metadata,
              ':response': paymentItem.providerResponse,
              ':processedAt': paymentItem.processedAt,
              ':updatedAt': paymentItem.updatedAt
            }
          })
        );
        paymentTxnId = paymentItem.id;
      } else if (err.name !== 'ConditionalCheckFailedException') {
        throw err;
      } else {
        return { statusCode: 200, body: JSON.stringify({ ok: true, idempotent: true }) };
      }
    }
  }

  if (paymentTxnId) {
    if (process.env.INVOICES_TABLE && invoiceId && invoice) {
      const remainingDue = Math.max(0, Number(invoice.amountDue || 0) - amountApplied);
      const nextStatus =
        remainingDue <= 0
          ? 'PAID'
          : amountApplied > 0 || (invoice.amountPaid || 0) > 0
          ? 'PARTIALLY_PAID'
          : 'ISSUED';
      await dynamo.send(
        new UpdateCommand({
          TableName: process.env.INVOICES_TABLE,
          Key: { schoolId, id: invoiceId },
          UpdateExpression: 'SET #status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': nextStatus }
        })
      );
    }
    await updatePaymentIntent(schoolId, paymentIntentId, {
      status: 'SUCCEEDED',
      providerReference: reference || null,
      confirmedAt: paidAt,
      updatedAt: new Date().toISOString()
    });
    await writeAuditEvent({
      schoolId,
      action: 'PAYMENT_CONFIRMED',
      entityType: 'PaymentTransaction',
      entityId: paymentTxnId,
      afterJson: {
        schoolId,
        invoiceId,
        amount: amountApplied,
        currency: detail.currency || 'NGN',
        paidAt,
        reference,
        receiptNo
      }
    });
  }

  const shouldEmitPayment = paymentTxnId && amountApplied > 0;
  if (process.env.EVENT_BUS_NAME && shouldEmitPayment) {
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
              paymentTxnId,
              paymentIntentId,
              amount: amountApplied,
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
              amount: amountApplied,
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
};
