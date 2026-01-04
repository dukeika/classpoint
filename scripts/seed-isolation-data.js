const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudFormationClient, ListStackResourcesCommand } = require('@aws-sdk/client-cloudformation');

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const STACK_NAME = process.env.STACK_NAME || 'ClasspointStack-dev';
const SCHOOL_ID = process.env.SCHOOL_ID || 'sch_lagos_demo_001';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const cfn = new CloudFormationClient({ region: REGION });

const getStackResources = async () => {
  const resources = [];
  let nextToken;
  do {
    const res = await cfn.send(
      new ListStackResourcesCommand({
        StackName: STACK_NAME,
        NextToken: nextToken
      })
    );
    (res.StackResourceSummaries || []).forEach((item) => {
      resources.push({
        logicalId: item.LogicalResourceId,
        physicalId: item.PhysicalResourceId,
        resourceType: item.ResourceType
      });
    });
    nextToken = res.NextToken;
  } while (nextToken);
  return resources;
};

const requireResource = (resources, logicalPrefix, resourceType) => {
  const matches = resources.filter(
    (resource) =>
      (resource.logicalId === logicalPrefix || resource.logicalId.startsWith(logicalPrefix)) &&
      (!resourceType || resource.resourceType === resourceType)
  );
  if (matches.length === 0) {
    throw new Error(`Missing stack resource: ${logicalPrefix}`);
  }
  if (matches.length > 1) {
    throw new Error(`Multiple resources match prefix: ${logicalPrefix}`);
  }
  return matches[0].physicalId;
};

const ensureItem = async ({ tableName, key, item }) => {
  const existing = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: key
    })
  );
  if (existing.Item) return existing.Item;
  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)'
    })
  );
  return item;
};

const run = async () => {
  const resources = await getStackResources();
  const invoicesTable = requireResource(resources, 'InvoicesTable', 'AWS::DynamoDB::Table');
  const campaignsTable = requireResource(
    resources,
    'MessageCampaignsTable',
    'AWS::DynamoDB::Table'
  );
  const recipientsTable = requireResource(
    resources,
    'MessageRecipientsTable',
    'AWS::DynamoDB::Table'
  );

  const now = new Date().toISOString();
  const suffix = SCHOOL_ID.slice(-4);
  const invoiceId = `invoice-iso-${SCHOOL_ID}`;
  const invoiceNo = `INV-ISO-${suffix}`;
  const campaignId = `campaign-iso-${SCHOOL_ID}`;
  const recipientId = `recipient-iso-${SCHOOL_ID}`;

  const invoice = await ensureItem({
    tableName: invoicesTable,
    key: { schoolId: SCHOOL_ID, id: invoiceId },
    item: {
      schoolId: SCHOOL_ID,
      id: invoiceId,
      invoiceNo,
      studentId: `student-iso-${SCHOOL_ID}`,
      sessionId: `session-iso-${SCHOOL_ID}`,
      termId: `term-iso-${SCHOOL_ID}`,
      classGroupId: `class-iso-${SCHOOL_ID}`,
      status: 'ISSUED',
      requiredSubtotal: 1000,
      optionalSubtotal: 0,
      discountTotal: 0,
      penaltyTotal: 0,
      amountPaid: 0,
      amountDue: 1000,
      issuedAt: now,
      dueAt: now
    }
  });

  const campaign = await ensureItem({
    tableName: campaignsTable,
    key: { schoolId: SCHOOL_ID, id: campaignId },
    item: {
      schoolId: SCHOOL_ID,
      id: campaignId,
      name: 'Isolation Campaign',
      type: 'ANNOUNCEMENT',
      channel: 'SMS',
      createdByUserId: 'seed',
      status: 'DRAFT',
      scheduledAt: null,
      audienceJson: JSON.stringify({ mode: 'TEST' }),
      createdAt: now
    }
  });

  await ensureItem({
    tableName: recipientsTable,
    key: { schoolId: SCHOOL_ID, id: recipientId },
    item: {
      schoolId: SCHOOL_ID,
      id: recipientId,
      campaignId: campaignId,
      destination: '08000000000',
      status: 'PENDING',
      statusHistory: [],
      lastUpdatedAt: now
    }
  });

  console.log(
    JSON.stringify({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      campaignId: campaign.id
    })
  );
};

run().catch((err) => {
  console.error('Seed failed', err.message);
  process.exitCode = 1;
});
