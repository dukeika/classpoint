/**
 * Placeholder messaging worker.
 * Expected payloads from EventBridge (payment.confirmed, invoice.generated) or campaigns enqueued.
 */
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const eb = new EventBridgeClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secrets = new SecretsManagerClient({});
const https = require('https');
const querystring = require('querystring');

const TABLES = {
  templates: process.env.MESSAGE_TEMPLATES_TABLE,
  campaigns: process.env.MESSAGE_CAMPAIGNS_TABLE,
  recipients: process.env.MESSAGE_RECIPIENTS_TABLE,
  parents: process.env.PARENTS_TABLE,
  students: process.env.STUDENTS_TABLE,
  links: process.env.STUDENT_PARENT_LINKS_TABLE,
  invoices: process.env.INVOICES_TABLE,
  enrollments: process.env.ENROLLMENTS_TABLE
};

const loadTemplate = async (schoolId, templateId) => {
  if (!TABLES.templates || !templateId) return null;
  const res = await dynamo.send(
    new GetCommand({
      TableName: TABLES.templates,
      Key: { schoolId, id: templateId }
    })
  );
  return res.Item || null;
};

const findTemplateByType = async (schoolId, type) => {
  if (!TABLES.templates || !type) return null;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.templates,
      IndexName: 'bySchoolTemplate',
      KeyConditionExpression: 'schoolId = :sid AND #type = :t',
      ExpressionAttributeValues: {
        ':sid': schoolId,
        ':t': type
      },
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      Limit: 1
    })
  );
  return res.Items && res.Items.length ? res.Items[0] : null;
};

const loadRecipient = async (schoolId, recipientId) => {
  if (!TABLES.recipients || !recipientId) return null;
  const res = await dynamo.send(
    new GetCommand({
      TableName: TABLES.recipients,
      Key: { schoolId, id: recipientId }
    })
  );
  return res.Item || null;
};

const markStatus = async (schoolId, recipientId, status, providerMessageId, errorMessage) => {
  if (!TABLES.recipients || !recipientId) return;
  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.recipients,
      Key: { schoolId, id: recipientId },
      UpdateExpression:
        'SET #status = :s, lastUpdatedAt = :now, providerMessageId = if_not_exists(providerMessageId, :pmid), #history = list_append(if_not_exists(#history, :emptyList), :history), lastError = :err',
      ExpressionAttributeNames: { '#status': 'status', '#history': 'statusHistory' },
      ExpressionAttributeValues: {
        ':s': status,
        ':now': now,
        ':pmid': providerMessageId || `msg-${Date.now()}`,
        ':history': [
          { status, at: now, providerMessageId: providerMessageId || null, error: errorMessage || null }
        ],
        ':emptyList': [],
        ':err': errorMessage || null
      }
    })
  );
};

const loadProviderSecret = async (providerKey) => {
  if (!providerKey || !process.env.PROVIDER_SECRET_PREFIX) return null;
  const secretId = `${process.env.PROVIDER_SECRET_PREFIX}${providerKey}`;
  try {
    const res = await secrets.send(new GetSecretValueCommand({ SecretId: secretId }));
    return res.SecretString ? JSON.parse(res.SecretString) : null;
  } catch (err) {
    console.warn('Failed to load provider secret', secretId, err.message);
    return null;
  }
};

const loadParent = async (schoolId, parentId) => {
  if (!TABLES.parents || !parentId) return null;
  const res = await dynamo.send(
    new GetCommand({
      TableName: TABLES.parents,
      Key: { schoolId, id: parentId }
    })
  );
  return res.Item || null;
};

const loadStudent = async (schoolId, studentId) => {
  if (!TABLES.students || !studentId) return null;
  const res = await dynamo.send(
    new GetCommand({
      TableName: TABLES.students,
      Key: { schoolId, id: studentId }
    })
  );
  return res.Item || null;
};

const loadInvoice = async (schoolId, invoiceId) => {
  if (!TABLES.invoices || !invoiceId) return null;
  const res = await dynamo.send(
    new GetCommand({
      TableName: TABLES.invoices,
      Key: { schoolId, id: invoiceId }
    })
  );
  return res.Item || null;
};

const listParentsByStudent = async (studentId) => {
  if (!TABLES.links || !studentId) return [];
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.links,
      IndexName: 'byStudent',
      KeyConditionExpression: 'studentId = :sid',
      ExpressionAttributeValues: { ':sid': studentId }
    })
  );
  return res.Items || [];
};

const listParentsBySchool = async (schoolId) => {
  if (!TABLES.parents || !schoolId) return [];
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.parents,
      IndexName: 'bySchoolParents',
      KeyConditionExpression: 'schoolId = :sid',
      ExpressionAttributeValues: { ':sid': schoolId }
    })
  );
  return res.Items || [];
};

const listEnrollmentsByClassGroup = async (termId, classGroupId) => {
  if (!TABLES.enrollments || !termId || !classGroupId) return [];
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.enrollments,
      IndexName: 'byTermEnrollment',
      KeyConditionExpression: 'termId = :tid AND classGroupId = :cgid',
      ExpressionAttributeValues: { ':tid': termId, ':cgid': classGroupId }
    })
  );
  return res.Items || [];
};

const createRecipient = async (schoolId, destination, channel, parentId, studentId, invoiceId) => {
  if (!TABLES.recipients) return null;
  const id = `rec-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.recipients,
      Item: {
        schoolId,
        id,
        destination,
        status: 'PENDING',
        channel,
        parentId,
        studentId,
        invoiceId,
        createdAt: new Date().toISOString()
      }
    })
  );
  return id;
};

const render = (templateStr, vars) => {
  if (!templateStr) return '';
  return templateStr.replace(/{{\s*([\w]+)\s*}}/g, (_, key) => {
    return vars[key] ?? '';
  });
};

const sendMessage = async (channel, destination, body, providerCfg, context = {}) => {
  if (!destination) throw new Error('No destination');
  const providerType = (providerCfg?.type || channel || '').toString().toLowerCase();
  const upperChannel = channel.toUpperCase();

  if (providerType.startsWith('twilio') || upperChannel === 'SMS' || upperChannel === 'WHATSAPP') {
    return sendTwilioSms(upperChannel, destination, body, providerCfg, context);
  }
  if (providerType === 'ses' || upperChannel === 'EMAIL') {
    return sendEmail(destination, body, providerCfg);
  }
  // Log/no-op provider (dev)
  console.log(`Log-only send ${upperChannel} to ${destination}`, { body, context });
  return { providerMessageId: `log-${Date.now()}` };
};

const sendTwilioSms = async (channel, destination, body, providerCfg, context) => {
  if (!providerCfg?.accountSid || !providerCfg?.authToken) {
    throw new Error('Twilio credentials missing');
  }
  const callbackBase = process.env.DELIVERY_CALLBACK_URL || process.env.STATUS_CALLBACK_URL;
  const callbackUrl =
    callbackBase && context.schoolId && context.recipientId
      ? `${callbackBase}${
          callbackBase.includes('?') ? '&' : '?'
        }schoolId=${encodeURIComponent(context.schoolId)}&recipientId=${encodeURIComponent(
          context.recipientId
        )}`
      : undefined;
  const postData = querystring.stringify({
    To: channel === 'WHATSAPP' ? `whatsapp:${destination}` : destination,
    Body: body,
    ...(callbackUrl ? { StatusCallback: callbackUrl } : {}),
    ...(providerCfg.messagingServiceSid
      ? { MessagingServiceSid: providerCfg.messagingServiceSid }
      : { From: providerCfg.from })
  });

  const options = {
    hostname: 'api.twilio.com',
    path: `/2010-04-01/Accounts/${providerCfg.accountSid}/Messages.json`,
    method: 'POST',
    auth: `${providerCfg.accountSid}:${providerCfg.authToken}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          const parsed = JSON.parse(data);
          resolve({ providerMessageId: parsed.sid || `twilio-${Date.now()}` });
        } else {
          reject(new Error(`Twilio send failed: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
};

const sendEmail = async (destination, body, providerCfg) => {
  // Minimal SES integration placeholder; assumes providerCfg has region and from
  const region = providerCfg?.region || process.env.AWS_REGION;
  if (!region || !providerCfg?.from) {
    throw new Error('Email provider config missing');
  }
  const ses = new SESClient({ region });
  const params = {
    Destination: { ToAddresses: [destination] },
    Message: {
      Body: { Text: { Data: body } },
      Subject: { Data: providerCfg.subject || 'Notification' }
    },
    Source: providerCfg.from
  };
  const res = await ses.send(new SendEmailCommand(params));
  return { providerMessageId: res.MessageId || `email-${Date.now()}` };
};

const buildRecipientsFromEvent = async (payload) => {
  const detailType = payload.detailType || payload.detail?.detailType || payload.type;
  const schoolId = payload.schoolId || payload.detail?.schoolId;
  const invoiceId = payload.invoiceId || payload.detail?.invoiceId;
  const invoiceIds = payload.invoiceIds || payload.detail?.invoiceIds;
  const studentIdFromEvent = payload.studentId || payload.detail?.studentId;
  const classGroupId = payload.classGroupId || payload.detail?.classGroupId;
  const termId = payload.termId || payload.detail?.termId;
  const audience = payload.audience || payload.detail?.audience;
  if (!schoolId) return [];

  let templateType = payload.templateType;
  if (!templateType) {
    if (detailType === 'payment.confirmed') templateType = 'PAYMENT_RECEIPT';
    if (detailType === 'invoice.generated' || detailType === 'invoicing.processed') templateType = 'INVOICE_ISSUED';
    if (detailType === 'invoice.overdue') templateType = 'OVERDUE_NOTICE';
    if (detailType === 'result.ready') templateType = 'RESULT_READY';
    if (detailType === 'announcement.published') templateType = 'ANNOUNCEMENT';
  }
  const template =
    payload.template || (templateType ? await findTemplateByType(schoolId, templateType) : null);

  const recipients = [];
  const seen = new Set();

  const addRecipient = async (parent, studentId, invoice, channelOverride) => {
    const channel = (template?.channel || channelOverride || payload.channel || parent.preferredChannel || 'WHATSAPP').toUpperCase();
    const destination =
      channel === 'EMAIL' ? parent.email : parent.primaryPhone || parent.email;
    if (!destination) return;
    const dedupeKey = `${parent.id}:${channel}:${destination}:${invoice?.id || ''}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    const recipientId = await createRecipient(
      schoolId,
      destination,
      channel,
      parent.id,
      studentId,
      invoice?.id
    );
    recipients.push({
      schoolId,
      recipientId,
      templateId: template?.id || payload.templateId,
      parentId: parent.id,
      studentId,
      template,
      channel,
      amountDue: invoice?.amountDue ?? invoice?.requiredSubtotal ?? payload.amountDue,
      amount: payload.amount,
      currency: payload.currency,
      receiptNo: payload.receiptNo,
      paidAt: payload.paidAt,
      dueDate: invoice?.dueAt ?? payload.dueDate,
      invoiceLink: payload.invoiceLink,
      invoiceId: invoice?.id
    });
  };

  const addRecipientsForInvoice = async (invoiceIdToLoad) => {
    const invoice = invoiceIdToLoad ? await loadInvoice(schoolId, invoiceIdToLoad) : null;
    const studentId = studentIdFromEvent || invoice?.studentId;
    if (studentId) {
      const links = await listParentsByStudent(studentId);
      for (const link of links) {
        const parent = await loadParent(schoolId, link.parentId);
        if (parent) await addRecipient(parent, studentId, invoice);
      }
    }
    return invoice;
  };

  // Audience: specific invoice(s)
  if (Array.isArray(invoiceIds) && invoiceIds.length) {
    for (const invId of invoiceIds) {
      await addRecipientsForInvoice(invId);
    }
  }

  // Audience: single invoice from event payload
  if (!recipients.length && invoiceId) {
    await addRecipientsForInvoice(invoiceId);
  }

  // Audience: specific student -> parents
  if (!recipients.length && studentIdFromEvent) {
    const links = await listParentsByStudent(studentIdFromEvent);
    for (const link of links) {
      const parent = await loadParent(schoolId, link.parentId);
      if (parent) await addRecipient(parent, studentIdFromEvent, null);
    }
  }

  // Audience: classGroup + term -> parents of enrolled students
  if (!recipients.length && classGroupId && termId) {
    const enrollments = await listEnrollmentsByClassGroup(termId, classGroupId);
    for (const enroll of enrollments) {
      const links = await listParentsByStudent(enroll.studentId);
      for (const link of links) {
        const parent = await loadParent(schoolId, link.parentId);
        if (parent) await addRecipient(parent, enroll.studentId, null);
      }
    }
  }

  // Audience: all parents
  if (!recipients.length && audience === 'ALL_PARENTS') {
    const parents = await listParentsBySchool(schoolId);
    for (const parent of parents) {
      await addRecipient(parent, null, null);
    }
  }

  return recipients;
};

const processSend = async (payload) => {
  const { schoolId, recipientId, templateId } = payload;
  if (!schoolId || !recipientId) {
    console.warn('Missing schoolId or recipientId, skipping');
    return;
  }
  const retryOnFail = payload.retryOnFail !== false;
  const template = await loadTemplate(schoolId, templateId);
  const recipient = await loadRecipient(schoolId, recipientId);
  const providerCfg = await loadProviderSecret(payload.provider || 'default');
  const parent = payload.parentId ? await loadParent(schoolId, payload.parentId) : null;
  const student = payload.studentId ? await loadStudent(schoolId, payload.studentId) : null;

  if (!recipient) {
    console.warn('Recipient not found', recipientId);
    return;
  }

  let channel = (template?.channel || payload.channel || 'WHATSAPP').toUpperCase();

  // Respect preferred channel/opt-outs when sending to parents
  if (recipient.parentId && parent) {
    if (parent.optedOut === true) {
      console.warn('Parent opted out, skipping', parent.id);
      return;
    }
    if (Array.isArray(parent.optedOutChannels) && parent.optedOutChannels.includes(channel)) {
      console.warn('Parent opted out of channel, skipping', parent.id, channel);
      return;
    }
    if (parent.preferredChannel && parent.preferredChannel.toUpperCase() !== channel) {
      channel = parent.preferredChannel.toUpperCase();
      console.log('Switching to preferred channel', channel, 'from template/payload');
    }
  }

  const vars = {
    parentName: parent?.fullName || recipient.destination || 'Parent',
    studentName: student ? `${student.firstName} ${student.lastName}` : '',
    amountDue: payload.amountDue || '',
    amount: payload.amount || '',
    currency: payload.currency || '',
    receiptNo: payload.receiptNo || '',
    paidAt: payload.paidAt || '',
    dueDate: payload.dueDate || '',
    invoiceLink: payload.invoiceLink || ''
  };

  const body = template?.body ? render(template.body, vars) : JSON.stringify(payload);

  try {
    const sendResult = await sendMessage(
      channel,
      recipient.destination || parent?.primaryPhone,
      body,
      providerCfg,
      { schoolId, recipientId }
    );
    await markStatus(schoolId, recipientId, 'SENT', sendResult.providerMessageId);
  } catch (sendErr) {
    console.error('Send failed', sendErr);
    await markStatus(
      schoolId,
      recipientId,
      'FAILED',
      `err-${Date.now()}`,
      sendErr?.message || 'Send failed'
    );
    if (retryOnFail) {
      throw sendErr;
    }
    // Swallow error when retryOnFail=false to avoid requeue storm; rely on statusHistory for visibility.
    return;
  }

  if (process.env.EVENT_BUS_NAME) {
    await eb.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: process.env.EVENT_BUS_NAME,
            DetailType: payload.detailType || 'messaging.processed',
            Source: payload.source || 'classpoint.messaging',
            Detail: JSON.stringify(payload.detail || payload)
          }
        ]
      })
    );
  }
};

exports.handler = async (event) => {
  console.log('Messaging worker received', JSON.stringify(event));
  for (const record of event.Records ?? []) {
    try {
      const payload = JSON.parse(record.body);
      console.log('Processing record', record.messageId, 'payload', payload);
      const retryOnFail = payload.retryOnFail !== false;
      const errors = [];

      const domainDerived =
        !payload.recipientId &&
        (payload.detailType || payload.detail?.detailType || payload.templateType);
      if (domainDerived) {
        const derivedRecipients = await buildRecipientsFromEvent(payload.detail || payload);
        const derivedErrors = [];
        for (const derived of derivedRecipients) {
          try {
            await processSend({ ...payload, ...derived, retryOnFail });
          } catch (err) {
            derivedErrors.push({ err, invoiceId: derived.invoiceId, recipientId: derived.recipientId });
            errors.push(err);
          }
        }
        if (derivedErrors.length) {
          console.error(
            'Derived recipients failed',
            derivedErrors.map((e) => ({
              invoiceId: e.invoiceId,
              recipientId: e.recipientId,
              message: e.err?.message
            }))
          );
        }
        if (errors.length && retryOnFail) {
          throw errors[0];
        }
        continue;
      }

      try {
        await processSend(payload);
      } catch (err) {
        if (retryOnFail) throw err;
        errors.push(err);
      }
      if (errors.length && retryOnFail) {
        throw errors[0];
      }
    } catch (err) {
      console.error('Failed processing record', record.messageId, err);
      throw err;
    }
  }
  return {};
};
