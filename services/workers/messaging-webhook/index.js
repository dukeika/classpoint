/**
 * Messaging delivery status webhook (Twilio SMS/WhatsApp).
 * Validates Twilio signature and updates MessageRecipient status.
 */
const crypto = require('crypto');
const querystring = require('querystring');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const secrets = new SecretsManagerClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLES = {
  recipients: process.env.MESSAGE_RECIPIENTS_TABLE
};

let cachedTwilioAuthToken = null;

const loadTwilioAuthToken = async () => {
  if (cachedTwilioAuthToken !== null) return cachedTwilioAuthToken;
  if (process.env.TWILIO_AUTH_TOKEN) {
    cachedTwilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    return cachedTwilioAuthToken;
  }
  const secretName = process.env.TWILIO_SECRET_NAME;
  if (!secretName) {
    cachedTwilioAuthToken = null;
    return null;
  }
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: secretName }));
  if (!res.SecretString) {
    cachedTwilioAuthToken = null;
    return null;
  }
  try {
    const parsed = JSON.parse(res.SecretString);
    cachedTwilioAuthToken = parsed.authToken || res.SecretString;
  } catch (err) {
    cachedTwilioAuthToken = res.SecretString;
  }
  return cachedTwilioAuthToken;
};

const validateTwilioSignature = (url, params, signature, authToken) => {
  if (!signature || !authToken) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const computed = crypto.createHmac('sha1', authToken).update(data).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
};

const updateRecipientStatus = async (schoolId, recipientId, status, providerMessageId) => {
  if (!TABLES.recipients) return;
  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.recipients,
      Key: { schoolId, id: recipientId },
      UpdateExpression:
        'SET #status = :s, lastUpdatedAt = :now, providerMessageId = if_not_exists(providerMessageId, :pmid), #history = list_append(if_not_exists(#history, :emptyList), :history)',
      ExpressionAttributeNames: { '#status': 'status', '#history': 'statusHistory' },
      ExpressionAttributeValues: {
        ':s': status,
        ':now': now,
        ':pmid': providerMessageId,
        ':history': [{ status, at: now, providerMessageId }],
        ':emptyList': []
      }
    })
  );
};

const findRecipientByProviderMessageId = async (providerMessageId) => {
  if (!TABLES.recipients || !providerMessageId) return null;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.recipients,
      IndexName: 'byProviderMessage',
      KeyConditionExpression: 'providerMessageId = :p',
      ExpressionAttributeValues: { ':p': providerMessageId },
      Limit: 1
    })
  );
  return res.Items && res.Items.length ? res.Items[0] : null;
};

const buildFullUrl = (event) => {
  const base = process.env.WEBHOOK_BASE_URL;
  const qs =
    event.rawQueryString ||
    (event.queryStringParameters
      ? Object.entries(event.queryStringParameters)
          .map(([k, v]) => `${k}=${encodeURIComponent(v ?? '')}`)
          .join('&')
      : '');
  if (base) {
    return qs ? `${base}?${qs}` : base;
  }
  const proto = event.headers?.['X-Forwarded-Proto'] || 'https';
  const host = event.headers?.Host || '';
  const stage = event.requestContext?.stage ? `/${event.requestContext.stage}` : '';
  const path = event.path?.startsWith('/') ? event.path : `/${event.path || ''}`;
  return `${proto}://${host}${stage}${path}${qs ? `?${qs}` : ''}`;
};

exports.handler = async (event) => {
  console.log('Messaging webhook event', JSON.stringify(event));
  const params =
    event.httpMethod === 'POST'
      ? querystring.parse(event.body || '')
      : event.queryStringParameters || {};
  const signature =
    event.headers?.['x-twilio-signature'] || event.headers?.['X-Twilio-Signature'];
  const authToken = await loadTwilioAuthToken();
  const fullUrl = buildFullUrl(event);

  if (!validateTwilioSignature(fullUrl, params, signature, authToken)) {
    return { statusCode: 401, body: 'invalid signature' };
  }

  const messageSid = params.MessageSid;
  const messageStatus = params.MessageStatus || params.SmsStatus;
  let schoolId = params.SchoolId || params.schoolId;
  let recipientId = params.RecipientId || params.recipientId;

  if ((!schoolId || !recipientId) && messageSid) {
    const recipient = await findRecipientByProviderMessageId(messageSid);
    if (recipient) {
      schoolId = recipient.schoolId;
      recipientId = recipient.id;
    }
  }

  if (schoolId && recipientId && messageStatus) {
    await updateRecipientStatus(schoolId, recipientId, messageStatus.toUpperCase(), messageSid);
  }

  return { statusCode: 200, body: 'ok' };
};
