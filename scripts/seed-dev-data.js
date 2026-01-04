const { randomUUID } = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudFormationClient, ListStackResourcesCommand } = require('@aws-sdk/client-cloudformation');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const STACK_NAME = process.env.STACK_NAME || 'ClasspointStack-dev';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const cfn = new CloudFormationClient({ region: REGION });
const lambda = new LambdaClient({ region: REGION });

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

const findByIndex = async ({ tableName, indexName, keyName, keyValue }) => {
  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: `${keyName} = :v`,
      ExpressionAttributeValues: { ':v': keyValue },
      Limit: 1
    })
  );
  return res.Items && res.Items.length ? res.Items[0] : null;
};

const ensureItem = async ({ tableName, indexName, keyName, keyValue, buildItem }) => {
  const existing = await findByIndex({ tableName, indexName, keyName, keyValue });
  if (existing) return existing;
  const item = buildItem();
  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)'
    })
  );
  return item;
};

const invokeProvisioner = async ({ functionName, name, slug, primaryCity }) => {
  const payload = {
    arguments: {
      input: {
        name,
        slug,
        primaryCity: primaryCity || null
      }
    }
  };
  const res = await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(payload))
    })
  );
  if (res.FunctionError) {
    throw new Error(`Provisioner failed: ${Buffer.from(res.Payload || '').toString()}`);
  }
  const body = Buffer.from(res.Payload || '').toString() || '{}';
  return JSON.parse(body);
};

const buildDates = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const nextYear = year + 1;
  return {
    sessionName: `${year}/${nextYear}`,
    sessionStart: `${year}-09-01`,
    sessionEnd: `${nextYear}-07-15`,
    termName: 'Term 1',
    termStart: `${year}-09-01`,
    termEnd: `${year}-12-15`
  };
};

const run = async () => {
  const resources = await getStackResources();
  const schoolsTable = requireResource(resources, 'SchoolsTable', 'AWS::DynamoDB::Table');
  const academicSessionsTable = requireResource(
    resources,
    'AcademicSessionsTable',
    'AWS::DynamoDB::Table'
  );
  const termsTable = requireResource(resources, 'TermsTable', 'AWS::DynamoDB::Table');
  const levelsTable = requireResource(resources, 'LevelsTable', 'AWS::DynamoDB::Table');
  const classYearsTable = requireResource(resources, 'ClassYearsTable', 'AWS::DynamoDB::Table');
  const classArmsTable = requireResource(resources, 'ClassArmsTable', 'AWS::DynamoDB::Table');
  const classGroupsTable = requireResource(resources, 'ClassGroupsTable', 'AWS::DynamoDB::Table');
  const provisionerFn = requireResource(resources, 'SchoolProvisioner', 'AWS::Lambda::Function');

  const schoolName = process.env.SCHOOL_NAME || 'Demo School';
  const schoolSlug = process.env.SCHOOL_SLUG || 'demo-school';
  const primaryCity = process.env.SCHOOL_CITY || 'Lagos';

  let school = await findByIndex({
    tableName: schoolsTable,
    indexName: 'bySlug',
    keyName: 'slug',
    keyValue: schoolSlug
  });
  if (!school) {
    school = await invokeProvisioner({
      functionName: provisionerFn,
      name: schoolName,
      slug: schoolSlug,
      primaryCity
    });
  }

  const schoolId = school.schoolId || school.id;
  if (!schoolId) {
    throw new Error('Provisioner did not return a schoolId');
  }

  const dates = buildDates();
  const session = await ensureItem({
    tableName: academicSessionsTable,
    indexName: 'bySchoolSession',
    keyName: 'schoolId',
    keyValue: schoolId,
    buildItem: () => ({
      id: randomUUID(),
      schoolId,
      name: dates.sessionName,
      startDate: dates.sessionStart,
      endDate: dates.sessionEnd,
      status: 'ACTIVE'
    })
  });

  const term = await ensureItem({
    tableName: termsTable,
    indexName: 'bySession',
    keyName: 'sessionId',
    keyValue: session.id,
    buildItem: () => ({
      id: randomUUID(),
      schoolId,
      sessionId: session.id,
      name: dates.termName,
      startDate: dates.termStart,
      endDate: dates.termEnd,
      status: 'ACTIVE'
    })
  });

  const level = await ensureItem({
    tableName: levelsTable,
    indexName: 'bySchoolLevel',
    keyName: 'schoolId',
    keyValue: schoolId,
    buildItem: () => ({
      id: randomUUID(),
      schoolId,
      type: 'PRIMARY',
      name: 'Primary',
      sortOrder: '1'
    })
  });

  const classYear = await ensureItem({
    tableName: classYearsTable,
    indexName: 'bySchoolClassYear',
    keyName: 'schoolId',
    keyValue: schoolId,
    buildItem: () => ({
      id: randomUUID(),
      schoolId,
      levelId: level.id,
      name: 'Primary 1',
      sortOrder: '1'
    })
  });

  const classArm = await ensureItem({
    tableName: classArmsTable,
    indexName: 'bySchoolArm',
    keyName: 'schoolId',
    keyValue: schoolId,
    buildItem: () => ({
      id: randomUUID(),
      schoolId,
      name: 'A'
    })
  });

  const classGroup = await ensureItem({
    tableName: classGroupsTable,
    indexName: 'bySchoolClassGroup',
    keyName: 'schoolId',
    keyValue: schoolId,
    buildItem: () => ({
      id: randomUUID(),
      schoolId,
      classYearId: classYear.id,
      classArmId: classArm.id,
      displayName: 'Primary 1 A'
    })
  });

  console.log('Seed complete', {
    schoolId,
    sessionId: session.id,
    termId: term.id,
    levelId: level.id,
    classYearId: classYear.id,
    classArmId: classArm.id,
    classGroupId: classGroup.id
  });
};

run().catch((err) => {
  console.error('Seed failed', err);
  process.exitCode = 1;
});
