/**
 * Placeholder invoicing worker.
 * Expected payload (future): records with detailType "invoice.generated" or similar.
 */
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  BatchGetCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const eb = new EventBridgeClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const { randomUUID } = require('crypto');

const TABLES = {
  invoices: process.env.INVOICES_TABLE,
  invoiceLines: process.env.INVOICE_LINES_TABLE,
  feeSchedules: process.env.FEE_SCHEDULES_TABLE,
  feeScheduleLines: process.env.FEE_SCHEDULE_LINES_TABLE,
  payments: process.env.PAYMENT_TRANSACTIONS_TABLE,
  paymentIntents: process.env.PAYMENT_INTENTS_TABLE,
  adjustments: process.env.FEE_ADJUSTMENTS_TABLE,
  installmentPlans: process.env.INSTALLMENT_PLANS_TABLE,
  installments: process.env.INSTALLMENTS_TABLE,
  feeItems: process.env.FEE_ITEMS_TABLE
};

const parseEventPayload = (payload) => {
  let detail = payload.detail;
  if (typeof detail === 'string') {
    try {
      detail = JSON.parse(detail);
    } catch (err) {
      detail = {};
    }
  }
  if (!detail) {
    detail = payload.detailType || payload.source ? {} : payload;
  }
  const detailType = payload.detailType || detail.detailType;
  const source = payload.source || detail.source;
  return { detail, detailType, source };
};

const getInvoice = async (schoolId, invoiceId) => {
  if (!TABLES.invoices) return null;
  const res = await dynamo.send(
    new GetCommand({
      TableName: TABLES.invoices,
      Key: { schoolId, id: invoiceId }
    })
  );
  return res.Item || null;
};

const markProcessed = async (schoolId, invoiceId) => {
  if (!TABLES.invoices) return;
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.invoices,
      Key: { schoolId, id: invoiceId },
      UpdateExpression: 'SET lastProcessedAt = :now',
      ExpressionAttributeValues: { ':now': new Date().toISOString() }
    })
  );
};

const sumPayments = async (invoiceId) => {
  if (!TABLES.payments) return 0;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.payments,
      IndexName: 'byInvoicePayment',
      KeyConditionExpression: 'invoiceId = :iid',
      ExpressionAttributeValues: {
        ':iid': invoiceId
      }
    })
  );
  return (res.Items || []).reduce((sum, p) => sum + (p.amount || 0), 0);
};

const loadScheduleLines = async (feeScheduleId) => {
  if (!TABLES.feeScheduleLines) return [];
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.feeScheduleLines,
      IndexName: 'bySchedule',
      KeyConditionExpression: 'feeScheduleId = :sid',
      ExpressionAttributeValues: {
        ':sid': feeScheduleId
      }
    })
  );
  return res.Items || [];
};

const loadFeeItems = async (schoolId, ids) => {
  if (!TABLES.feeItems || !ids.length) return {};
  const keys = ids.slice(0, 100).map((id) => ({ schoolId, id }));
  const res = await dynamo.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLES.feeItems]: {
          Keys: keys
        }
      }
    })
  );
  const items = res.Responses?.[TABLES.feeItems] || [];
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
};

const loadInvoiceLines = async (invoiceId) => {
  if (!TABLES.invoiceLines) return [];
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.invoiceLines,
      IndexName: 'byInvoice',
      KeyConditionExpression: 'invoiceId = :iid',
      ExpressionAttributeValues: { ':iid': invoiceId }
    })
  );
  return res.Items || [];
};

const getAdjustments = async (invoiceId) => {
  if (!TABLES.adjustments) return [];
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.adjustments,
      IndexName: 'byInvoiceAdjustment',
      KeyConditionExpression: 'invoiceId = :iid',
      ExpressionAttributeValues: { ':iid': invoiceId }
    })
  );
  return res.Items || [];
};

const computeDiscounts = (adjustments, requiredSubtotal) => {
  const discounts = adjustments.filter((a) => a.type === 'DISCOUNT' || a.type === 'WAIVER');
  if (!discounts.length) return 0;
  const values = discounts.map((d) => d.amount || 0);
  const best = Math.max(...values);
  return Math.min(best, requiredSubtotal);
};

const computePenalty = (adjustments) => {
  const penalties = adjustments.filter((a) => a.type === 'PENALTY');
  return penalties.reduce((sum, p) => sum + (p.amount || 0), 0);
};

const ensureInstallmentPlan = async (schoolId, invoice, requiredSubtotal, template) => {
  if (!TABLES.installmentPlans || !TABLES.installments) return;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.installmentPlans,
      IndexName: 'byInvoiceInstallment',
      KeyConditionExpression: 'invoiceId = :iid',
      ExpressionAttributeValues: { ':iid': invoice.id }
    })
  );
  if ((res.Items || []).length) return; // already exists

  const sequences =
    template === '40/30/30' ? [0.4, 0.3, 0.3] : [0.6, 0.4]; // default 60/40
  const baseDate = invoice.dueAt ? new Date(invoice.dueAt) : new Date();
  const dueOffsets = sequences.map((_, idx) => idx * 30); // days offsets: 0,30,60...
  const planId = randomUUID();
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.installmentPlans,
      Item: {
        schoolId,
        id: planId,
        invoiceId: invoice.id,
        status: 'ACTIVE',
        totalAmount: requiredSubtotal,
        createdAt: new Date().toISOString()
      }
    })
  );

  let seq = 1;
  for (let i = 0; i < sequences.length; i++) {
    const ratio = sequences[i];
    const dueAt = new Date(baseDate.getTime() + dueOffsets[i] * 24 * 60 * 60 * 1000);
    await dynamo.send(
      new PutCommand({
        TableName: TABLES.installments,
        Item: {
          schoolId,
          id: randomUUID(),
          installmentPlanId: planId,
          sequenceNo: seq++,
          amount: Math.round(requiredSubtotal * ratio),
          dueAt: dueAt.toISOString(),
          status: 'DUE'
        }
      })
    );
  }
};

const updateInstallmentsStatus = async (schoolId, invoiceId, paid) => {
  if (!TABLES.installmentPlans || !TABLES.installments) return;
  const plansRes = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.installmentPlans,
      IndexName: 'byInvoiceInstallment',
      KeyConditionExpression: 'invoiceId = :iid',
      ExpressionAttributeValues: { ':iid': invoiceId }
    })
  );
  const plan = (plansRes.Items || [])[0];
  if (!plan) return;
  const instRes = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.installments,
      IndexName: 'byInstallmentPlan',
      KeyConditionExpression: 'installmentPlanId = :pid',
      ExpressionAttributeValues: { ':pid': plan.id }
    })
  );
  const installments = instRes.Items || [];
  let remaining = paid;
  for (const inst of installments.sort((a, b) => a.sequenceNo - b.sequenceNo)) {
    const dueDate = inst.dueAt ? new Date(inst.dueAt) : null;
    let status = 'DUE';
    if (remaining >= inst.amount) {
      status = 'PAID';
      remaining -= inst.amount;
    } else if (dueDate && dueDate.getTime() < Date.now()) {
      status = 'OVERDUE';
    }
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.installments,
        Key: { schoolId, id: inst.id },
        UpdateExpression: 'SET #status = :s',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':s': status }
      })
    );
  }
};

const updateTotals = async (schoolId, invoice, paid, adjustments) => {
  if (!TABLES.invoices || !invoice) return;
  const scheduleLines = invoice.feeScheduleId
    ? await loadScheduleLines(invoice.feeScheduleId)
    : [];
  const invoiceLines = invoice.id ? await loadInvoiceLines(invoice.id) : [];

  let derivedLines = invoiceLines;
  if (!invoiceLines.length && scheduleLines.length && TABLES.invoiceLines) {
    const feeItemIds = [
      ...new Set(scheduleLines.map((line) => line.feeItemId).filter(Boolean))
    ];
    const feeItemMap = await loadFeeItems(schoolId, feeItemIds);
    const createdLines = [];
    for (const line of scheduleLines) {
      const feeItem = feeItemMap[line.feeItemId] || {};
      const isOptional = line.isOptionalOverride === true || feeItem.isOptional === true;
      const item = {
        schoolId,
        id: randomUUID(),
        invoiceId: invoice.id,
        feeItemId: line.feeItemId,
        label: feeItem.name || line.feeItemId || 'Fee',
        description: feeItem.description || null,
        amount: line.amount || 0,
        isOptional,
        isSelected: isOptional ? false : true,
        sortOrder: line.sortOrder || 0
      };
      createdLines.push(item);
      await dynamo.send(
        new PutCommand({ TableName: TABLES.invoiceLines, Item: item })
      );
    }
    derivedLines = createdLines;
  }

  const sourceLines = derivedLines.length ? derivedLines : scheduleLines;
  const requiredSubtotal =
    sourceLines
      .filter((l) => !l.isOptionalOverride && l.isOptional !== true)
      .reduce((sum, l) => sum + (l.amount || 0), 0) || invoice.requiredSubtotal || 0;
  const optionalSubtotal =
    sourceLines
      .filter((l) => (l.isOptionalOverride || l.isOptional === true) && l.isSelected !== false)
      .reduce((sum, l) => sum + (l.amount || 0), 0) || invoice.optionalSubtotal || 0;
  const discountTotal = computeDiscounts(adjustments, requiredSubtotal);
  const penaltyTotal = computePenalty(adjustments);
  const amountDue = requiredSubtotal + optionalSubtotal - discountTotal + penaltyTotal - paid;

  // Enforce minimum first payment 30% of required subtotal by default (configurable via payload)
  const minFirstPercent = invoice.minFirstPercent || 30;
  const minFirstAmount = (minFirstPercent / 100) * requiredSubtotal;
  const belowMinFirst = paid < minFirstAmount;

  // Ensure installment plan exists if enabled
  const installmentTemplate = invoice.installmentTemplate || '60/40';
  await ensureInstallmentPlan(schoolId, invoice, requiredSubtotal, installmentTemplate);
  await updateInstallmentsStatus(schoolId, invoice.id, paid);

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.invoices,
      Key: { schoolId, id: invoice.id },
      UpdateExpression:
        'SET amountPaid = :paid, amountDue = :due, lastProcessedAt = :now, #status = :status, requiredSubtotal = :req, optionalSubtotal = :opt, discountTotal = :disc, penaltyTotal = :pen, minFirstAmount = :minFirst, belowMinFirst = :below',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':paid': paid,
        ':due': amountDue < 0 ? 0 : amountDue,
        ':now': new Date().toISOString(),
        ':status': amountDue <= 0 ? 'PAID' : 'PARTIALLY_PAID',
        ':req': requiredSubtotal,
        ':opt': optionalSubtotal,
        ':disc': discountTotal,
        ':pen': penaltyTotal,
        ':minFirst': minFirstAmount,
        ':below': belowMinFirst
      }
    })
  );

  return {
    requiredSubtotal,
    optionalSubtotal,
    discountTotal,
    penaltyTotal,
    amountDue: amountDue < 0 ? 0 : amountDue,
    amountPaid: paid
  };
};

exports.handler = async (event) => {
  console.log('Invoicing worker received', JSON.stringify(event));
  for (const record of event.Records ?? []) {
    try {
      const payload = JSON.parse(record.body);
      const { detail, detailType } = parseEventPayload(payload);
      console.log('Processing record', record.messageId, 'payload', payload);

      if (detailType === 'invoice.overdue.scan') {
        console.log('Overdue scan requested - stub (add scan by term/class in future)');
        continue;
      }

      const schoolId = detail?.schoolId || payload.schoolId;
      const invoiceId = detail?.invoiceId || payload.invoiceId;
      if (!schoolId || !invoiceId) {
        console.warn('Missing schoolId or invoiceId, skipping');
        continue;
      }

      const invoice = await getInvoice(schoolId, invoiceId);
      if (!invoice) {
        console.warn('Invoice not found', invoiceId);
        continue;
      }

      const adjustments = await getAdjustments(invoiceId);
      const paid = await sumPayments(invoiceId);
      const totals = await updateTotals(schoolId, invoice, paid, adjustments);

      await markProcessed(schoolId, invoiceId);

      if (process.env.EVENT_BUS_NAME) {
        const baseDetail =
          detail && Object.keys(detail).length ? detail : payload.detail || payload;
        const entries = [
          {
            EventBusName: process.env.EVENT_BUS_NAME,
            DetailType: 'invoicing.processed',
            Source: 'classpoint.billing',
            Detail: JSON.stringify({
              ...baseDetail,
              schoolId,
              invoiceId,
              originalDetailType: detailType || null
            })
          }
        ];

        // Emit messaging request for invoice issued/processed
        const shouldNotifyInvoice =
          detailType === 'invoice.generated' && detail?.reason !== 'SELECTION_UPDATE';
        if (shouldNotifyInvoice) {
          entries.push({
            EventBusName: process.env.EVENT_BUS_NAME,
            DetailType: 'messaging.requested',
            Source: 'classpoint.messaging',
            Detail: JSON.stringify({
              schoolId,
              invoiceId,
              studentId: invoice.studentId,
              amountDue: totals?.amountDue ?? invoice.amountDue,
              dueDate: invoice.dueAt,
              templateType: 'INVOICE_ISSUED',
              detailType: detailType || 'invoicing.processed'
            })
          });

          // Overdue notice if due date passed and still owing
          const dueAt = invoice.dueAt ? new Date(invoice.dueAt) : null;
          const currentDue = totals?.amountDue ?? invoice.amountDue ?? 0;
          if (dueAt && currentDue > 0 && Date.now() > dueAt.getTime()) {
            entries.push({
              EventBusName: process.env.EVENT_BUS_NAME,
              DetailType: 'messaging.requested',
              Source: 'classpoint.messaging',
              Detail: JSON.stringify({
                schoolId,
                invoiceId,
                studentId: invoice.studentId,
                amountDue: currentDue,
                dueDate: invoice.dueAt,
                templateType: 'OVERDUE_NOTICE',
                detailType: 'invoice.overdue'
              })
            });
          }
        }

        await eb.send(new PutEventsCommand({ Entries: entries }));
      }
    } catch (err) {
      console.error('Failed processing record', record.messageId, err);
      throw err;
    }
  }
  return {};
};
