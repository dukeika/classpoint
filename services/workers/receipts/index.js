const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLES = {
  receipts: process.env.RECEIPTS_TABLE
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
  return detail;
};

exports.handler = async (event) => {
  console.log('Receipts worker received', JSON.stringify(event));
  if (!TABLES.receipts) return {};

  for (const record of event.Records ?? []) {
    try {
      const payload = JSON.parse(record.body);
      const detail = parseEventPayload(payload);
      const schoolId = detail.schoolId || payload.schoolId;
      const receiptNo = detail.receiptNo || payload.receiptNo;
      if (!schoolId || !receiptNo) {
        console.warn('Missing schoolId or receiptNo, skipping');
        continue;
      }

      const item = {
        schoolId,
        id: receiptNo,
        receiptNo,
        invoiceId: detail.invoiceId || payload.invoiceId || null,
        paymentReference: detail.reference || payload.reference || null,
        amount: detail.amount || payload.amount || 0,
        currency: detail.currency || payload.currency || 'NGN',
        receiptUrl: detail.receiptUrl || payload.receiptUrl || null,
        receiptBucket: detail.receiptBucket || payload.receiptBucket || null,
        receiptKey: detail.receiptKey || payload.receiptKey || null,
        paidAt: detail.paidAt || null,
        createdAt: new Date().toISOString()
      };

      try {
        await dynamo.send(
          new PutCommand({
            TableName: TABLES.receipts,
            Item: item,
            ConditionExpression: 'attribute_not_exists(id)'
          })
        );
      } catch (err) {
        if (err.name !== 'ConditionalCheckFailedException') {
          throw err;
        }
        console.log('Receipt already exists', receiptNo);
      }
    } catch (err) {
      console.error('Failed processing receipt record', record.messageId, err);
      throw err;
    }
  }
  return {};
};
