const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLES = {
  invoices: process.env.INVOICES_TABLE,
  enrollments: process.env.ENROLLMENTS_TABLE
};

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
const SCHOOL_ID = process.env.SCHOOL_ID || '';
const MAX_UPDATES = Number.parseInt(process.env.MAX_UPDATES || '0', 10);

if (!TABLES.invoices || !TABLES.enrollments) {
  console.error('Missing INVOICES_TABLE or ENROLLMENTS_TABLE.');
  process.exit(1);
}

const loadEnrollmentById = async (schoolId, enrollmentId) => {
  if (!enrollmentId) return null;
  const res = await dynamo.send(
    new GetCommand({
      TableName: TABLES.enrollments,
      Key: { schoolId, id: enrollmentId }
    })
  );
  return res.Item ?? null;
};

const loadEnrollmentByStudentTerm = async (schoolId, studentId, termId) => {
  if (!studentId || !termId) return null;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.enrollments,
      IndexName: 'byStudentEnrollment',
      KeyConditionExpression: 'studentId = :sid AND termId = :tid',
      ExpressionAttributeValues: {
        ':sid': studentId,
        ':tid': termId,
        ':schoolId': schoolId
      },
      FilterExpression: 'schoolId = :schoolId'
    })
  );
  return (res.Items ?? [])[0] ?? null;
};

const updateInvoice = async (schoolId, invoiceId, classGroupId) => {
  if (DRY_RUN) {
    console.log(`[dry-run] update invoice ${invoiceId} -> classGroupId=${classGroupId}`);
    return;
  }
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.invoices,
      Key: { schoolId, id: invoiceId },
      UpdateExpression: 'SET classGroupId = :cg',
      ExpressionAttributeValues: { ':cg': classGroupId }
    })
  );
};

const buildScanParams = (startKey) => {
  const params = {
    TableName: TABLES.invoices,
    ProjectionExpression: 'schoolId, id, enrollmentId, studentId, termId, classGroupId',
    FilterExpression: 'attribute_not_exists(classGroupId) OR classGroupId = :empty',
    ExpressionAttributeValues: { ':empty': '' }
  };
  if (SCHOOL_ID) {
    params.FilterExpression = '(schoolId = :schoolId) AND (' + params.FilterExpression + ')';
    params.ExpressionAttributeValues[':schoolId'] = SCHOOL_ID;
  }
  if (startKey) {
    params.ExclusiveStartKey = startKey;
  }
  return params;
};

const run = async () => {
  let lastKey;
  let updated = 0;
  let scanned = 0;

  do {
    const res = await dynamo.send(new ScanCommand(buildScanParams(lastKey)));
    const items = res.Items || [];
    scanned += items.length;

    for (const invoice of items) {
      if (MAX_UPDATES && updated >= MAX_UPDATES) {
        console.log(`Reached MAX_UPDATES=${MAX_UPDATES}, stopping.`);
        return;
      }

      const enrollment =
        (await loadEnrollmentById(invoice.schoolId, invoice.enrollmentId)) ||
        (await loadEnrollmentByStudentTerm(invoice.schoolId, invoice.studentId, invoice.termId));
      if (!enrollment || !enrollment.classGroupId) {
        console.warn('No classGroupId for invoice', invoice.id);
        continue;
      }
      await updateInvoice(invoice.schoolId, invoice.id, enrollment.classGroupId);
      updated += 1;
    }

    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  console.log(`Scan complete. Scanned=${scanned}, Updated=${updated}, DryRun=${DRY_RUN}`);
};

run().catch((err) => {
  console.error('Backfill failed', err);
  process.exit(1);
});
