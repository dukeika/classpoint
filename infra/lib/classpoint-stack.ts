import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import { ProjectionType } from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { MappingTemplate } from 'aws-cdk-lib/aws-appsync';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ClasspointStackProps extends StackProps {
  envName: string;
}

export class ClasspointStack extends Stack {
  public readonly apiId: string;
  public readonly apiKey: string;
  public readonly graphqlUrl: string;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly eventBus: events.EventBus;
  public readonly uploadsBucket: s3.Bucket;
  public readonly awsSdkLayer: lambda.LayerVersion;
  public readonly tables: {
    users: dynamodb.Table;
    invoices: dynamodb.Table;
    invoiceLines: dynamodb.Table;
    feeSchedules: dynamodb.Table;
    feeScheduleLines: dynamodb.Table;
    paymentTransactions: dynamodb.Table;
    paymentIntents: dynamodb.Table;
    feeAdjustments: dynamodb.Table;
    installmentPlans: dynamodb.Table;
    installments: dynamodb.Table;
    students: dynamodb.Table;
    enrollments: dynamodb.Table;
    discountRules: dynamodb.Table;
    feeItems: dynamodb.Table;
    messageTemplates: dynamodb.Table;
    messageCampaigns: dynamodb.Table;
    messageRecipients: dynamodb.Table;
    parents: dynamodb.Table;
    studentParentLinks: dynamodb.Table;
    providerConfigs: dynamodb.Table;
    featureFlags: dynamodb.Table;
    auditEvents: dynamodb.Table;
    importJobs: dynamodb.Table;
    classGroups: dynamodb.Table;
    classYears: dynamodb.Table;
    classArms: dynamodb.Table;
    levels: dynamodb.Table;
    academicSessions: dynamodb.Table;
    terms: dynamodb.Table;
    receipts: dynamodb.Table;
    receiptCounters: dynamodb.Table;
  };

  constructor(scope: Construct, id: string, props: ClasspointStackProps) {
    super(scope, id, props);

    const { envName } = props;

    // Tag for environment scoping
    Tags.of(this).add('environment', envName);

    const removalPolicy = envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const autoDeleteObjects = envName === 'prod' ? false : true;

    // KMS keys for data and assets (separate keys to enable least-privilege grants).
    const dataKey = new kms.Key(this, 'DataKey', {
      alias: `alias/classpoint-${envName}-data`,
      enableKeyRotation: true
    });

    const assetsKey = new kms.Key(this, 'AssetsKey', {
      alias: `alias/classpoint-${envName}-assets`,
      enableKeyRotation: true
    });

    // S3 bucket for uploads/proofs/receipts (critical path with versioning).
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: undefined, // allow CDK to name; can be customized per env if needed
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: assetsKey,
      enforceSSL: true,
      versioned: true,
      removalPolicy,
      autoDeleteObjects,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000
        }
      ]
    });

    // EventBridge bus for async events
    const eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: `classpoint-${envName}`
    });

    const awsSdkLayer = new lambda.LayerVersion(this, 'AwsSdkLayer', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', 'services', 'layers', 'aws-sdk')
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'AWS SDK v3 dependencies for worker lambdas'
    });

    const rootDomain = this.node.tryGetContext('rootDomain') as string | undefined;
    const baseDomain = rootDomain ?? 'classpoint.ng';
    const tenantCallbackUrls = (this.node.tryGetContext('tenantCallbackUrls') as string | undefined)
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
    const tenantLogoutUrls = (this.node.tryGetContext('tenantLogoutUrls') as string | undefined)
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

    // Cognito User Pool with groups and custom schoolId attribute in tokens.
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
        phone: true,
        username: false
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        phoneNumber: { required: false, mutable: true }
      },
      customAttributes: {
        schoolId: new cognito.StringAttribute({ mutable: true })
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: true, otp: true },
      removalPolicy
    });

    const appGroups = ['APP_ADMIN', 'SCHOOL_ADMIN', 'BURSAR', 'TEACHER', 'PARENT'];
    appGroups.forEach((group) => {
      new cognito.CfnUserPoolGroup(this, `Group-${group}`, {
        groupName: group,
        userPoolId: userPool.userPoolId
      });
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      preventUserExistenceErrors: true,
      generateSecret: false,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE
        ],
        callbackUrls: [`https://app.${baseDomain}/auth/callback`, ...tenantCallbackUrls],
        logoutUrls: [`https://app.${baseDomain}/`, ...tenantLogoutUrls]
      }
    });

    // AppSync API (real schema file in services/api).
    const api = new appsync.GraphqlApi(this, 'GraphqlApi', {
      name: `classpoint-${envName}`,
      definition: appsync.Definition.fromFile(
        path.join(__dirname, '..', '..', 'services', 'api', 'schema.appsync.graphql')
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool }
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY
          }
        ]
      },
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ERROR,
        retention: logs.RetentionDays.ONE_MONTH
      }
    });
    const publicApiKey = new appsync.CfnApiKey(this, 'PublicApiKey', {
      apiId: api.apiId,
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180
    });
    const apiName = `classpoint-${envName}`;
    const appsyncFunctionNamePrefix = `classpoint_${envName}`.replace(/[^A-Za-z0-9_]/g, '_');

    // DynamoDB tables with core access patterns
    type GsiDef = {
      indexName: string;
      partitionKey: string;
      sortKey?: string;
      projection?: ProjectionType;
      partitionKeyType?: dynamodb.AttributeType;
      sortKeyType?: dynamodb.AttributeType;
    };
    const createTable = (
      id: string,
      partitionKey: string,
      sortKey?: string,
      gsiDefs: GsiDef[] = []
    ) => {
      const table = new dynamodb.Table(this, id, {
        partitionKey: { name: partitionKey, type: dynamodb.AttributeType.STRING },
        sortKey: sortKey ? { name: sortKey, type: dynamodb.AttributeType.STRING } : undefined,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: dataKey,
        pointInTimeRecovery: true,
        removalPolicy
      });

      gsiDefs.forEach((gsi) => {
        table.addGlobalSecondaryIndex({
          indexName: gsi.indexName,
          partitionKey: {
            name: gsi.partitionKey,
            type: gsi.partitionKeyType ?? dynamodb.AttributeType.STRING
          },
          sortKey: gsi.sortKey
            ? { name: gsi.sortKey, type: gsi.sortKeyType ?? dynamodb.AttributeType.STRING }
            : undefined,
          projectionType: gsi.projection ?? ProjectionType.ALL
        });
      });
      return table;
    };

    const addDynamoDataSource = (id: string, table: dynamodb.Table) =>
      api.addDynamoDbDataSource(id, table);

    const schoolsTable = createTable('SchoolsTable', 'schoolId', 'id', [
      { indexName: 'bySlug', partitionKey: 'slug' }
    ]);

    const schoolDomainsTable = createTable('SchoolDomainsTable', 'schoolId', 'id', [
      { indexName: 'bySchool', partitionKey: 'schoolId', sortKey: 'hostname' },
      { indexName: 'byHostname', partitionKey: 'hostname' }
    ]);

    const usersTable = createTable('UsersTable', 'schoolId', 'id', [
      { indexName: 'bySchoolUsers', partitionKey: 'schoolId', sortKey: 'userType' },
      { indexName: 'byEmail', partitionKey: 'schoolId', sortKey: 'email' },
      { indexName: 'byPhone', partitionKey: 'schoolId', sortKey: 'phone' }
    ]);

    const rolesTable = createTable('RolesTable', 'schoolId', 'id', [
      { indexName: 'bySchoolRoles', partitionKey: 'schoolId', sortKey: 'name' }
    ]);

    const permissionsTable = createTable('PermissionsTable', 'id'); // global list, no tenant sort key

    const rolePermissionsTable = createTable('RolePermissionsTable', 'schoolId', 'id', [
      { indexName: 'byRole', partitionKey: 'roleId', sortKey: 'permissionCode' }
    ]);

    const userRolesTable = createTable('UserRolesTable', 'schoolId', 'id', [
      { indexName: 'byUser', partitionKey: 'userId', sortKey: 'roleId' }
    ]);

    const auditEventsTable = createTable('AuditEventsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolAudit', partitionKey: 'schoolId', sortKey: 'createdAt' },
      { indexName: 'byEntity', partitionKey: 'entityId', sortKey: 'createdAt' }
    ]);

    const schoolProfilesTable = createTable('SchoolProfilesTable', 'schoolId', 'id', [
      { indexName: 'bySchoolProfile', partitionKey: 'schoolId' }
    ]);

    const schoolHomePageSectionsTable = createTable('SchoolHomePageSectionsTable', 'schoolId', 'id', [
      {
        indexName: 'bySchoolSections',
        partitionKey: 'schoolId',
        sortKey: 'sortOrder',
        sortKeyType: dynamodb.AttributeType.NUMBER
      }
    ]);

    const announcementsTable = createTable('AnnouncementsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolAnnouncements', partitionKey: 'schoolId', sortKey: 'publishedAt' }
    ]);

    const calendarEventsTable = createTable('CalendarEventsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolEvents', partitionKey: 'schoolId', sortKey: 'startAt' }
    ]);

    const academicSessionsTable = createTable('AcademicSessionsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolSession', partitionKey: 'schoolId', sortKey: 'startDate' }
    ]);

    const termsTable = createTable('TermsTable', 'schoolId', 'id', [
      { indexName: 'bySession', partitionKey: 'sessionId', sortKey: 'startDate' }
    ]);

    const levelsTable = createTable('LevelsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolLevel', partitionKey: 'schoolId', sortKey: 'sortOrder' }
    ]);

    const classYearsTable = createTable('ClassYearsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolClassYear', partitionKey: 'schoolId', sortKey: 'sortOrder' }
    ]);

    const classArmsTable = createTable('ClassArmsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolArm', partitionKey: 'schoolId', sortKey: 'name' }
    ]);

    const classGroupsTable = createTable('ClassGroupsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolClassGroup', partitionKey: 'schoolId', sortKey: 'displayName' }
    ]);

    const subjectsTable = createTable('SubjectsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolSubject', partitionKey: 'schoolId', sortKey: 'name' }
    ]);

    const classSubjectsTable = createTable('ClassSubjectsTable', 'schoolId', 'id', [
      { indexName: 'byClassYear', partitionKey: 'classYearId', sortKey: 'subjectId' }
    ]);

    const studentsTable = createTable('StudentsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolStudents', partitionKey: 'schoolId', sortKey: 'admissionNo' }
    ]);

    const parentsTable = createTable('ParentsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolParents', partitionKey: 'schoolId', sortKey: 'primaryPhone' },
      { indexName: 'bySchoolParentEmail', partitionKey: 'schoolId', sortKey: 'email' }
    ]);

    const studentParentLinksTable = createTable('StudentParentLinksTable', 'schoolId', 'id', [
      { indexName: 'byStudent', partitionKey: 'studentId', sortKey: 'parentId' },
      { indexName: 'byParent', partitionKey: 'parentId', sortKey: 'studentId' }
    ]);

    const enrollmentsTable = createTable('EnrollmentsTable', 'schoolId', 'id', [
      { indexName: 'byStudentEnrollment', partitionKey: 'studentId', sortKey: 'termId' },
      { indexName: 'byTermEnrollment', partitionKey: 'termId', sortKey: 'classGroupId' }
    ]);

    const importJobsTable = createTable('ImportJobsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolImportJob', partitionKey: 'schoolId', sortKey: 'createdAt' }
    ]);

    const feeItemsTable = createTable('FeeItemsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolFeeItem', partitionKey: 'schoolId', sortKey: 'name' }
    ]);

    const feeSchedulesTable = createTable('FeeSchedulesTable', 'schoolId', 'id', [
      { indexName: 'byTermFeeSchedule', partitionKey: 'termId', sortKey: 'classYearId' }
    ]);

    const feeScheduleLinesTable = createTable('FeeScheduleLinesTable', 'schoolId', 'id', [
      { indexName: 'bySchedule', partitionKey: 'feeScheduleId', sortKey: 'sortOrder' }
    ]);

    const discountRulesTable = createTable('DiscountRulesTable', 'schoolId', 'id', [
      { indexName: 'bySchoolDiscount', partitionKey: 'schoolId', sortKey: 'type' }
    ]);

    const invoicesTable = createTable('InvoicesTable', 'schoolId', 'id', [
      { indexName: 'bySchoolInvoiceNo', partitionKey: 'schoolId', sortKey: 'invoiceNo' },
      { indexName: 'byStudentInvoice', partitionKey: 'studentId', sortKey: 'termId' },
      { indexName: 'byTermClassGroup', partitionKey: 'termId', sortKey: 'classGroupId' }
    ]);

    const invoiceLinesTable = createTable('InvoiceLinesTable', 'schoolId', 'id', [
      { indexName: 'byInvoice', partitionKey: 'invoiceId', sortKey: 'sortOrder' }
    ]);

    const paymentIntentsTable = createTable('PaymentIntentsTable', 'schoolId', 'id', [
      { indexName: 'byInvoiceIntent', partitionKey: 'invoiceId', sortKey: 'createdAt' }
    ]);

    const paymentTransactionsTable = createTable('PaymentTransactionsTable', 'schoolId', 'id', [
      { indexName: 'byInvoicePayment', partitionKey: 'invoiceId', sortKey: 'paidAt' },
      { indexName: 'byReference', partitionKey: 'reference' }
    ]);

    const receiptsTable = createTable('ReceiptsTable', 'schoolId', 'id', [
      { indexName: 'byInvoiceReceipt', partitionKey: 'invoiceId', sortKey: 'createdAt' }
    ]);

    const paymentAllocationsTable = createTable('PaymentAllocationsTable', 'schoolId', 'id', [
      { indexName: 'byPaymentTxnAlloc', partitionKey: 'paymentTxnId', sortKey: 'invoiceId' }
    ]);

    const receiptCountersTable = createTable('ReceiptCountersTable', 'schoolId', 'id');

    const manualPaymentProofsTable = createTable('ManualPaymentProofsTable', 'schoolId', 'id', [
      { indexName: 'byPaymentTxn', partitionKey: 'paymentTxnId', sortKey: 'createdAt' }
    ]);

    const feeAdjustmentsTable = createTable('FeeAdjustmentsTable', 'schoolId', 'id', [
      { indexName: 'byInvoiceAdjustment', partitionKey: 'invoiceId', sortKey: 'createdAt' }
    ]);

    const installmentPlansTable = createTable('InstallmentPlansTable', 'schoolId', 'id', [
      { indexName: 'byInvoiceInstallment', partitionKey: 'invoiceId', sortKey: 'createdAt' }
    ]);

    const installmentsTable = createTable('InstallmentsTable', 'schoolId', 'id', [
      { indexName: 'byInstallmentPlan', partitionKey: 'installmentPlanId', sortKey: 'sequenceNo' }
    ]);

    const messageTemplatesTable = createTable('MessageTemplatesTable', 'schoolId', 'id', [
      { indexName: 'bySchoolTemplate', partitionKey: 'schoolId', sortKey: 'type' }
    ]);

    const messageCampaignsTable = createTable('MessageCampaignsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolCampaign', partitionKey: 'schoolId', sortKey: 'createdAt' }
    ]);

    const messageRecipientsTable = createTable('MessageRecipientsTable', 'schoolId', 'id', [
      { indexName: 'byCampaign', partitionKey: 'campaignId', sortKey: 'destination' },
      { indexName: 'byProviderMessage', partitionKey: 'providerMessageId' },
      { indexName: 'byInvoiceRecipient', partitionKey: 'invoiceId', sortKey: 'destination' }
    ]);

    const supportTicketsTable = createTable('SupportTicketsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolSupport', partitionKey: 'schoolId', sortKey: 'createdAt' },
      { indexName: 'byParentSupport', partitionKey: 'parentId', sortKey: 'createdAt' }
    ]);

    const supportTicketMessagesTable = createTable('SupportTicketMessagesTable', 'schoolId', 'id', [
      { indexName: 'byTicket', partitionKey: 'ticketId', sortKey: 'createdAt' }
    ]);

    const attendanceSessionsTable = createTable('AttendanceSessionsTable', 'schoolId', 'id', [
      { indexName: 'byClassDay', partitionKey: 'classGroupId', sortKey: 'date' }
    ]);

    const attendanceEntriesTable = createTable('AttendanceEntriesTable', 'schoolId', 'id', [
      { indexName: 'byAttendanceSession', partitionKey: 'attendanceSessionId', sortKey: 'studentId' }
    ]);

    const assessmentPoliciesTable = createTable('AssessmentPoliciesTable', 'schoolId', 'id', [
      { indexName: 'bySchoolPolicy', partitionKey: 'schoolId', sortKey: 'name' }
    ]);

    const assessmentsTable = createTable('AssessmentsTable', 'schoolId', 'id', [
      { indexName: 'byClassSubjectTerm', partitionKey: 'classGroupId', sortKey: 'subjectId' }
    ]);

    const scoreEntriesTable = createTable('ScoreEntriesTable', 'schoolId', 'id', [
      { indexName: 'byAssessment', partitionKey: 'assessmentId', sortKey: 'studentId' }
    ]);

    const reportCardsTable = createTable('ReportCardsTable', 'schoolId', 'id', [
      { indexName: 'byStudentTermReport', partitionKey: 'studentId', sortKey: 'termId' }
    ]);

    const resultReleasePoliciesTable = createTable('ResultReleasePoliciesTable', 'schoolId', 'id', [
      { indexName: 'bySchoolReleasePolicy', partitionKey: 'schoolId' }
    ]);

    const featureFlagsTable = createTable('FeatureFlagsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolFeature', partitionKey: 'schoolId', sortKey: 'code' }
    ]);

    const plansTable = createTable('PlansTable', 'id'); // platform catalog
    const addOnsTable = createTable('AddOnsTable', 'id'); // platform catalog

    const schoolSubscriptionsTable = createTable('SchoolSubscriptionsTable', 'schoolId', 'id', [
      { indexName: 'bySchool', partitionKey: 'schoolId', sortKey: 'startAt' },
      { indexName: 'byPlan', partitionKey: 'planId', sortKey: 'startAt' }
    ]);

    const schoolSubscriptionAddOnsTable = createTable('SchoolSubscriptionAddOnsTable', 'schoolId', 'id', [
      { indexName: 'bySubscription', partitionKey: 'subscriptionId', sortKey: 'effectiveAt' },
      { indexName: 'byAddOn', partitionKey: 'addOnId', sortKey: 'effectiveAt' }
    ]);

    const providerConfigsTable = createTable('ProviderConfigsTable', 'schoolId', 'id', [
      { indexName: 'bySchoolProvider', partitionKey: 'schoolId', sortKey: 'type' }
    ]);

    this.apiId = api.apiId;
    this.apiKey = publicApiKey.attrApiKey || '';
    this.graphqlUrl = api.graphqlUrl;
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
    this.eventBus = eventBus;
    this.uploadsBucket = uploadsBucket;
    this.awsSdkLayer = awsSdkLayer;
    this.tables = {
      users: usersTable,
      invoices: invoicesTable,
      invoiceLines: invoiceLinesTable,
      feeSchedules: feeSchedulesTable,
      feeScheduleLines: feeScheduleLinesTable,
      paymentTransactions: paymentTransactionsTable,
      paymentIntents: paymentIntentsTable,
      feeAdjustments: feeAdjustmentsTable,
      installmentPlans: installmentPlansTable,
      installments: installmentsTable,
      students: studentsTable,
      enrollments: enrollmentsTable,
      discountRules: discountRulesTable,
      feeItems: feeItemsTable,
      messageTemplates: messageTemplatesTable,
      messageCampaigns: messageCampaignsTable,
      messageRecipients: messageRecipientsTable,
      parents: parentsTable,
      studentParentLinks: studentParentLinksTable,
      providerConfigs: providerConfigsTable,
      featureFlags: featureFlagsTable,
      auditEvents: auditEventsTable,
      importJobs: importJobsTable,
      classGroups: classGroupsTable,
      classYears: classYearsTable,
      classArms: classArmsTable,
      levels: levelsTable,
      academicSessions: academicSessionsTable,
      terms: termsTable,
      receipts: receiptsTable,
      receiptCounters: receiptCountersTable
    };

    // Data sources (prep for resolvers)
    const eventPublisherFn = new lambda.Function(this, 'AppEventsPublisher', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const eb = new EventBridgeClient({});
exports.handler = async (event) => {
  const args = event && event.arguments ? event.arguments : event;
  const { detailType, source, detail } = args || {};
  if (!detailType || !source || !detail) {
    throw new Error('detailType, source, and detail are required');
  }
  await eb.send(new PutEventsCommand({
    Entries: [{
      EventBusName: process.env.EVENT_BUS_NAME,
      DetailType: detailType,
      Source: source,
      Detail: typeof detail === 'string' ? detail : JSON.stringify(detail)
    }]
  }));
  return true;
};`),
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256
    });
    const templateSeederFn = new lambda.Function(this, 'TemplateSeeder', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const templates = [
  {
    type: 'PAYMENT_RECEIPT',
    subject: 'Payment received',
    body: 'Hi {{parentName}}, we received {{amount}} {{currency}}. Receipt: {{receiptNo}}. Paid at {{paidAt}}.',
    variablesJson: ['parentName', 'amount', 'currency', 'receiptNo', 'paidAt']
  },
  {
    type: 'INVOICE_ISSUED',
    subject: 'Invoice issued',
    body: 'Hi {{parentName}}, your invoice for {{studentName}} is ready. Amount due: {{amountDue}} by {{dueDate}}.',
    variablesJson: ['parentName', 'studentName', 'amountDue', 'dueDate']
  },
  {
    type: 'OVERDUE_NOTICE',
    subject: 'Payment overdue',
    body: 'Hi {{parentName}}, your invoice for {{studentName}} is overdue. Balance: {{amountDue}}.',
    variablesJson: ['parentName', 'studentName', 'amountDue']
  },
  {
    type: 'RESULT_READY',
    subject: 'Result ready',
    body: 'Hi {{parentName}}, {{studentName}}\'s result is ready.',
    variablesJson: ['parentName', 'studentName']
  },
  {
    type: 'ANNOUNCEMENT',
    subject: 'New announcement',
    body: 'Hi {{parentName}}, there is a new school announcement. Please check the portal.',
    variablesJson: ['parentName']
  },
  {
    type: 'STAFF_INVITE',
    subject: 'You are invited to join {{schoolName}}',
    body: 'Hi {{staffName}}, you have been invited to join {{schoolName}} on Classpoint. Temporary password: {{tempPassword}}. Sign in at {{loginUrl}}.',
    variablesJson: ['staffName', 'schoolName', 'tempPassword', 'loginUrl']
  }
];

const listExisting = async (schoolId) => {
  const res = await dynamo.send(new QueryCommand({
    TableName: process.env.MESSAGE_TEMPLATES_TABLE,
    IndexName: 'bySchoolTemplate',
    KeyConditionExpression: 'schoolId = :sid',
    ExpressionAttributeValues: { ':sid': schoolId }
  }));
  return res.Items || [];
};

exports.handler = async (event) => {
  const { schoolId, channel } = event.arguments || {};
  if (!schoolId) throw new Error('schoolId is required');
  const existing = await listExisting(schoolId);
  const existingTypes = new Set(existing.map((t) => t.type));
  let created = 0;
  for (const tmpl of templates) {
    if (existingTypes.has(tmpl.type)) continue;
    const now = new Date().toISOString();
    await dynamo.send(new PutCommand({
      TableName: process.env.MESSAGE_TEMPLATES_TABLE,
      Item: {
        schoolId,
        id: 'tmpl-' + Date.now() + '-' + Math.random().toString(16).slice(2, 6),
        type: tmpl.type,
        channel: (channel || 'WHATSAPP').toUpperCase(),
        subject: tmpl.subject,
        body: tmpl.body,
        variablesJson: tmpl.variablesJson,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    }));
    created += 1;
  }
  return created > 0;
};`),
      environment: {
        MESSAGE_TEMPLATES_TABLE: messageTemplatesTable.tableName
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256
    });
    const schoolProvisionerFn = new lambda.Function(this, 'SchoolProvisioner', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const requireInput = (value, label) => {
  if (!value || typeof value !== 'string') {
    throw new Error(label + ' is required');
  }
  return value.trim();
};

const normalizeSlug = (slug) => slug.toLowerCase();

const ensureSlugUnique = async (slug) => {
  const res = await dynamo.send(new QueryCommand({
    TableName: process.env.SCHOOLS_TABLE,
    IndexName: 'bySlug',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: { ':slug': slug }
  }));
  if ((res.Items || []).length > 0) {
    throw new Error('slug already exists');
  }
};

const ensureHostnameUnique = async (hostname) => {
  const res = await dynamo.send(new QueryCommand({
    TableName: process.env.SCHOOL_DOMAINS_TABLE,
    IndexName: 'byHostname',
    KeyConditionExpression: 'hostname = :h',
    ExpressionAttributeValues: { ':h': hostname }
  }));
  if ((res.Items || []).length > 0) {
    throw new Error('hostname already exists');
  }
};

const seedPermissions = async () => {
  const permissions = [
    { code: 'SCHOOL.MANAGE', description: 'Manage school settings' },
    { code: 'USERS.MANAGE', description: 'Manage users/roles' },
    { code: 'FEES.MANAGE', description: 'Manage fee items/schedules' },
    { code: 'INVOICES.MANAGE', description: 'Manage invoices' },
    { code: 'PAYMENTS.MANAGE', description: 'Manage payments' },
    { code: 'MESSAGING.MANAGE', description: 'Manage messaging/campaigns' },
    { code: 'ACADEMICS.MANAGE', description: 'Manage attendance/results' }
  ];
  for (const perm of permissions) {
    try {
      await dynamo.send(new PutCommand({
        TableName: process.env.PERMISSIONS_TABLE,
        Item: { id: perm.code, code: perm.code, description: perm.description },
        ConditionExpression: 'attribute_not_exists(id)'
      }));
    } catch (err) {
      if (err.name !== 'ConditionalCheckFailedException') throw err;
    }
  }
  return permissions.map((p) => p.code);
};

exports.handler = async (event) => {
  const input = event.arguments?.input || {};
  const name = requireInput(input.name, 'name');
  const slug = normalizeSlug(requireInput(input.slug, 'slug'));
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('slug must be lowercase alphanumeric with hyphens');
  }
  await ensureSlugUnique(slug);
  const rootDomain = process.env.ROOT_DOMAIN || 'classpoint.ng';
  const hostname = slug + '.' + rootDomain;
  await ensureHostnameUnique(hostname);

  const schoolId = randomUUID();
  const now = new Date().toISOString();
  const tenantKey = schoolId;

  await dynamo.send(new PutCommand({
    TableName: process.env.SCHOOLS_TABLE,
    Item: {
      schoolId,
      id: schoolId,
      tenantKey,
      name,
      slug,
      status: 'PROVISIONING',
      primaryCity: input.primaryCity || null,
      createdAt: now,
      updatedAt: now
    },
    ConditionExpression: 'attribute_not_exists(schoolId)'
  }));

  await dynamo.send(new PutCommand({
    TableName: process.env.SCHOOL_PROFILES_TABLE,
    Item: {
      schoolId,
      id: schoolId,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
      updatedAt: now
    }
  }));

  await dynamo.send(new PutCommand({
    TableName: process.env.SCHOOL_DOMAINS_TABLE,
    Item: {
      schoolId,
      id: 'domain-' + schoolId,
      type: 'SUBDOMAIN',
      hostname,
      verified: false,
      createdAt: now,
      updatedAt: now
    }
  }));

  if (process.env.SCHOOL_HOME_SECTIONS_TABLE) {
    const sections = [
      {
        type: 'HERO',
        sortOrder: 0,
        contentJson: JSON.stringify({
          headline: name,
          subheadline: 'Welcome to our school community.',
          ctaLabel: 'Login',
          ctaLink: '/'
        })
      },
      {
        type: 'ABOUT',
        sortOrder: 1,
        contentJson: JSON.stringify({
          title: 'About',
          body: 'We are committed to clear communication, structured learning, and transparency.'
        })
      },
      {
        type: 'ANNOUNCEMENTS',
        sortOrder: 2,
        contentJson: JSON.stringify({
          title: 'Announcements',
          description: 'Latest updates from the school.'
        })
      },
      {
        type: 'CALENDAR',
        sortOrder: 3,
        contentJson: JSON.stringify({
          title: 'Calendar',
          description: 'Upcoming school events and dates.'
        })
      }
    ];
    for (const section of sections) {
      await dynamo.send(new PutCommand({
        TableName: process.env.SCHOOL_HOME_SECTIONS_TABLE,
        Item: {
          schoolId,
          id: randomUUID(),
          type: section.type,
          contentJson: section.contentJson,
          sortOrder: section.sortOrder,
          isEnabled: true,
          createdAt: now,
          updatedAt: now
        }
      }));
    }
  }

  const permissionCodes = await seedPermissions();
  const roles = [
    { name: 'SCHOOL_ADMIN', perms: permissionCodes },
    { name: 'BURSAR', perms: ['FEES.MANAGE', 'INVOICES.MANAGE', 'PAYMENTS.MANAGE', 'MESSAGING.MANAGE'] },
    { name: 'TEACHER', perms: ['ACADEMICS.MANAGE'] },
    { name: 'PARENT', perms: [] }
  ];
  for (const role of roles) {
    const roleId = randomUUID();
    await dynamo.send(new PutCommand({
      TableName: process.env.ROLES_TABLE,
      Item: { schoolId, id: roleId, name: role.name, isSystemRole: true }
    }));
    for (const perm of role.perms) {
      await dynamo.send(new PutCommand({
        TableName: process.env.ROLE_PERMISSIONS_TABLE,
        Item: { schoolId, id: randomUUID(), roleId, permissionCode: perm }
      }));
    }
  }

  return {
    id: schoolId,
    schoolId,
    tenantKey,
    name,
    slug,
    status: 'PROVISIONING',
    primaryCity: input.primaryCity || null,
    createdAt: now,
    updatedAt: now
  };
};`),
      environment: {
        SCHOOLS_TABLE: schoolsTable.tableName,
        SCHOOL_DOMAINS_TABLE: schoolDomainsTable.tableName,
        SCHOOL_PROFILES_TABLE: schoolProfilesTable.tableName,
        SCHOOL_HOME_SECTIONS_TABLE: schoolHomePageSectionsTable.tableName,
        ROLES_TABLE: rolesTable.tableName,
        ROLE_PERMISSIONS_TABLE: rolePermissionsTable.tableName,
        PERMISSIONS_TABLE: permissionsTable.tableName,
        ROOT_DOMAIN: rootDomain || 'classpoint.ng'
      },
      timeout: cdk.Duration.seconds(20),
      memorySize: 256
    });
    const importUploadUrlFn = new lambda.Function(this, 'ImportUploadUrl', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = new S3Client({});

exports.handler = async (event) => {
  const input = event.arguments?.input || {};
  const schoolId = input.schoolId;
  const fileName = input.fileName || 'import.csv';
  if (!schoolId) throw new Error('schoolId is required');
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = 'imports/' + schoolId + '/' + Date.now() + '-' + safeName;
  const contentType = input.contentType || 'text/csv';
  const expiresIn = 900;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.UPLOADS_BUCKET,
    Key: key,
    ContentType: contentType
  }), { expiresIn });
  return { uploadUrl, bucket: process.env.UPLOADS_BUCKET, key, expiresIn };
};`),
      environment: {
        UPLOADS_BUCKET: uploadsBucket.bucketName
      },
      timeout: cdk.Duration.seconds(5),
      memorySize: 256
    });
    const manualProofUploadUrlFn = new lambda.Function(this, 'ManualProofUploadUrl', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = new S3Client({});

exports.handler = async (event) => {
  const input = event.arguments?.input || {};
  const schoolId = input.schoolId;
  const fileName = input.fileName || 'proof.jpg';
  if (!schoolId) throw new Error('schoolId is required');
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = 'proofs/' + schoolId + '/' + Date.now() + '-' + safeName;
  const contentType = input.contentType || 'image/jpeg';
  const expiresIn = 900;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.UPLOADS_BUCKET,
    Key: key,
    ContentType: contentType
  }), { expiresIn });
  return { uploadUrl, bucket: process.env.UPLOADS_BUCKET, key, expiresIn };
};`),
      environment: {
        UPLOADS_BUCKET: uploadsBucket.bucketName
      },
      timeout: cdk.Duration.seconds(5),
      memorySize: 256
    });

    const receiptUploadUrlFn = new lambda.Function(this, 'ReceiptUploadUrl', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = new S3Client({});

exports.handler = async (event) => {
  const input = event.arguments?.input || {};
  const schoolId = input.schoolId;
  const receiptNo = input.receiptNo;
  if (!schoolId || !receiptNo) throw new Error('schoolId and receiptNo are required');
  const fileName = input.fileName || (receiptNo + '.pdf');
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = 'receipts/' + schoolId + '/' + receiptNo + '/' + safeName;
  const contentType = input.contentType || 'application/pdf';
  const expiresIn = 900;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.UPLOADS_BUCKET,
    Key: key,
    ContentType: contentType
  }), { expiresIn });
  return { uploadUrl, bucket: process.env.UPLOADS_BUCKET, key, expiresIn };
};`),
      environment: {
        UPLOADS_BUCKET: uploadsBucket.bucketName
      },
      timeout: cdk.Duration.seconds(5),
      memorySize: 256
    });
    this.apiId = api.apiId;

    const receiptDownloadUrlFn = new lambda.Function(this, 'ReceiptDownloadUrl', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = new S3Client({});
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async (event) => {
  const input = event.arguments?.input || {};
  const schoolId = input.schoolId;
  const receiptNo = input.receiptNo;
  if (!schoolId || !receiptNo) throw new Error('schoolId and receiptNo are required');
  const res = await dynamo.send(new GetCommand({
    TableName: process.env.RECEIPTS_TABLE,
    Key: { schoolId, id: receiptNo }
  }));
  const receipt = res.Item;
  if (!receipt || !receipt.receiptKey) {
    throw new Error('Receipt PDF not available');
  }
  const bucket = receipt.receiptBucket || process.env.UPLOADS_BUCKET;
  const key = receipt.receiptKey;
  if (!bucket || !key) {
    throw new Error('Receipt storage not configured');
  }
  const expiresIn = 900;
  const downloadUrl = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: bucket,
    Key: key
  }), { expiresIn });
  return { downloadUrl, bucket, key, expiresIn };
};`),
      environment: {
        UPLOADS_BUCKET: uploadsBucket.bucketName,
        RECEIPTS_TABLE: receiptsTable.tableName
      },
      timeout: cdk.Duration.seconds(5),
      memorySize: 256
    });
    receiptsTable.grantReadData(receiptDownloadUrlFn);
    uploadsBucket.grantRead(receiptDownloadUrlFn);

    const importErrorDownloadUrlFn = new lambda.Function(this, 'ImportErrorDownloadUrl', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = new S3Client({});

  exports.handler = async (event) => {
    const input = event.arguments?.input || event.input || event || {};
    const schoolId = input.schoolId;
    const key = input.key;
  if (!schoolId || !key) throw new Error('schoolId and key are required');
  if (!key.startsWith('imports/' + schoolId + '/')) {
    throw new Error('Invalid import key');
  }
  const bucket = process.env.UPLOADS_BUCKET;
  if (!bucket) throw new Error('Uploads bucket not configured');
  const expiresIn = 900;
  const downloadUrl = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: bucket,
    Key: key
  }), { expiresIn });
  return { downloadUrl, bucket, key, expiresIn };
};`),
      environment: {
        UPLOADS_BUCKET: uploadsBucket.bucketName
      },
      timeout: cdk.Duration.seconds(5),
      memorySize: 256
    });
    uploadsBucket.grantRead(importErrorDownloadUrlFn);

    const staffInviteFn = new lambda.Function(this, 'StaffInvite', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const cognito = new CognitoIdentityProviderClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const groupForUserType = (userType) => {
  if (!userType) return 'STAFF';
  const upper = userType.toUpperCase();
  if (upper === 'SCHOOL_ADMIN') return 'SCHOOL_ADMIN';
  if (upper === 'BURSAR') return 'BURSAR';
  if (upper === 'TEACHER') return 'TEACHER';
  return 'STAFF';
};

exports.handler = async (event) => {
  const input = event.arguments?.input || {};
  const schoolId = input.schoolId;
  const name = input.name;
  const email = input.email;
  const phone = input.phone;
  const userType = input.userType || 'STAFF';
  if (!schoolId || !name) throw new Error('schoolId and name are required');
  if (!email && !phone) throw new Error('email or phone is required');

  const userId = randomUUID();
  const username = email || phone;
  const tempPassword = input.tempPassword || ('Temp-' + Math.random().toString(36).slice(2, 8) + '#');

  await cognito.send(new AdminCreateUserCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: username,
    TemporaryPassword: tempPassword,
    UserAttributes: [
      { Name: 'email', Value: email || '' },
      { Name: 'email_verified', Value: email ? 'true' : 'false' },
      { Name: 'phone_number', Value: phone || '' },
      { Name: 'phone_number_verified', Value: phone ? 'true' : 'false' },
      { Name: 'custom:schoolId', Value: schoolId },
      { Name: 'name', Value: name }
    ].filter((attr) => attr.Value)
  }));

  const groupName = groupForUserType(userType);
  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: username,
    GroupName: groupName
  }));

  await dynamo.send(new PutCommand({
    TableName: process.env.USERS_TABLE,
    Item: {
      schoolId,
      id: userId,
      name,
      email: email || null,
      phone: phone || null,
      userType,
      status: 'INVITED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }));

  return {
    id: userId,
    schoolId,
    name,
    email,
    phone,
    userType,
    status: 'INVITED'
  };
};`),
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        USERS_TABLE: usersTable.tableName
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256
    });
    usersTable.grantReadWriteData(staffInviteFn);
    staffInviteFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminCreateUser', 'cognito-idp:AdminAddUserToGroup'],
        resources: [userPool.userPoolArn]
      })
    );

    const batchInvoiceGeneratorFn = new lambda.Function(this, 'BatchInvoiceGenerator', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(20),
      memorySize: 512,
      environment: {
        ENROLLMENTS_TABLE: enrollmentsTable.tableName,
        INVOICES_TABLE: invoicesTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName
      },
      code: lambda.Code.fromInline(`
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const eb = new EventBridgeClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const buildInvoiceNo = () => {
  return \`INV-\${Date.now()}-\${Math.random().toString(16).slice(2, 6)}\`;
};

const putEventsBatch = async (entries) => {
  if (!entries.length) return;
  await eb.send(new PutEventsCommand({ Entries: entries }));
};

const hasExistingInvoice = async (schoolId, studentId, termId, classGroupId, feeScheduleId) => {
  const res = await dynamo.send(new QueryCommand({
    TableName: process.env.INVOICES_TABLE,
    IndexName: 'byStudentInvoice',
    KeyConditionExpression: 'studentId = :sid and termId = :tid',
    ExpressionAttributeValues: {
      ':sid': studentId,
      ':tid': termId
    },
    Limit: 25
  }));
  const items = res.Items || [];
  return items.some((item) => {
    if (item.schoolId !== schoolId) return false;
    if (item.feeScheduleId !== feeScheduleId) return false;
    return (item.classGroupId || classGroupId) === classGroupId;
  });
};

exports.handler = async (event) => {
  const input = event.arguments?.input || {};
  const schoolId = input.schoolId;
  const termId = input.termId;
  const classGroupId = input.classGroupId;
  const feeScheduleId = input.feeScheduleId;
  const sessionId = input.sessionId;
  const dueAt = input.dueAt || null;
  const limit = input.limit ? Number(input.limit) : null;
  const skipDuplicates = input.skipDuplicates !== false;
  if (!schoolId || !termId || !classGroupId || !feeScheduleId) {
    throw new Error('schoolId, termId, classGroupId, and feeScheduleId are required');
  }

  let createdCount = 0;
  let skippedCount = 0;
  const invoiceIds = [];
  let lastKey;
  const pageSize = 50;
  let eventBatch = [];

  do {
    const res = await dynamo.send(new QueryCommand({
      TableName: process.env.ENROLLMENTS_TABLE,
      IndexName: 'byTermEnrollment',
      KeyConditionExpression: 'termId = :tid and classGroupId = :cg',
      ExpressionAttributeValues: {
        ':tid': termId,
        ':cg': classGroupId
      },
      ExclusiveStartKey: lastKey,
      Limit: pageSize
    }));

    const enrollments = res.Items || [];
    for (const enrollment of enrollments) {
      if (limit && createdCount >= limit) {
        lastKey = null;
        break;
      }
      const studentId = enrollment.studentId;
      if (!studentId) {
        continue;
      }
      if (skipDuplicates) {
        const exists = await hasExistingInvoice(
          schoolId,
          studentId,
          termId,
          classGroupId,
          feeScheduleId
        );
        if (exists) {
          skippedCount += 1;
          continue;
        }
      }
      const invoiceId = randomUUID();
      const invoiceNo = buildInvoiceNo();
      const now = new Date().toISOString();
      await dynamo.send(new PutCommand({
        TableName: process.env.INVOICES_TABLE,
        Item: {
          schoolId,
          id: invoiceId,
          invoiceNo,
          studentId,
          enrollmentId: enrollment.id || null,
          sessionId: enrollment.sessionId || sessionId || null,
          termId,
          classGroupId: enrollment.classGroupId || classGroupId,
          feeScheduleId,
          status: 'ISSUED',
          issuedAt: now,
          dueAt,
          requiredSubtotal: 0,
          optionalSubtotal: 0,
          discountTotal: 0,
          penaltyTotal: 0,
          amountPaid: 0,
          amountDue: 0
        }
      }));
      invoiceIds.push(invoiceId);
      createdCount += 1;

      eventBatch.push({
        EventBusName: process.env.EVENT_BUS_NAME,
        DetailType: 'invoice.generated',
        Source: 'classpoint.billing',
        Detail: JSON.stringify({ schoolId, invoiceId })
      });
      if (eventBatch.length === 10) {
        await putEventsBatch(eventBatch);
        eventBatch = [];
      }
    }

    lastKey = res.LastEvaluatedKey;
  } while (lastKey && (!limit || createdCount < limit));

  await putEventsBatch(eventBatch);

  return { createdCount, invoiceIds, skippedCount };
};`)
    });

    enrollmentsTable.grantReadData(batchInvoiceGeneratorFn);
    invoicesTable.grantWriteData(batchInvoiceGeneratorFn);
    eventBus.grantPutEventsTo(batchInvoiceGeneratorFn);

    const ds = {
      eventPublisher: api.addLambdaDataSource('EventPublisherDS', eventPublisherFn),
      templateSeeder: api.addLambdaDataSource('TemplateSeederDS', templateSeederFn),
      schoolProvisioner: api.addLambdaDataSource('SchoolProvisionerDS', schoolProvisionerFn),
      importUploader: api.addLambdaDataSource('ImportUploaderDS', importUploadUrlFn),
      manualProofUploader: api.addLambdaDataSource('ManualProofUploaderDS', manualProofUploadUrlFn),
      receiptUploader: api.addLambdaDataSource('ReceiptUploaderDS', receiptUploadUrlFn),
      receiptDownloader: api.addLambdaDataSource('ReceiptDownloaderDS', receiptDownloadUrlFn),
      importErrorDownloader: api.addLambdaDataSource('ImportErrorDownloaderDS', importErrorDownloadUrlFn),
      staffInviter: api.addLambdaDataSource('StaffInviterDS', staffInviteFn),
      batchInvoiceGenerator: api.addLambdaDataSource('BatchInvoiceGeneratorDS', batchInvoiceGeneratorFn),
      schools: addDynamoDataSource('SchoolsDS', schoolsTable),
      schoolDomains: addDynamoDataSource('SchoolDomainsDS', schoolDomainsTable),
      users: addDynamoDataSource('UsersDS', usersTable),
      roles: addDynamoDataSource('RolesDS', rolesTable),
      permissions: addDynamoDataSource('PermissionsDS', permissionsTable),
      rolePermissions: addDynamoDataSource('RolePermissionsDS', rolePermissionsTable),
      userRoles: addDynamoDataSource('UserRolesDS', userRolesTable),
      auditEvents: addDynamoDataSource('AuditEventsDS', auditEventsTable),
      schoolProfiles: addDynamoDataSource('SchoolProfilesDS', schoolProfilesTable),
      schoolHomePageSections: addDynamoDataSource('SchoolHomePageSectionsDS', schoolHomePageSectionsTable),
      announcements: addDynamoDataSource('AnnouncementsDS', announcementsTable),
      calendarEvents: addDynamoDataSource('CalendarEventsDS', calendarEventsTable),
      academicSessions: addDynamoDataSource('AcademicSessionsDS', academicSessionsTable),
      terms: addDynamoDataSource('TermsDS', termsTable),
      levels: addDynamoDataSource('LevelsDS', levelsTable),
      classYears: addDynamoDataSource('ClassYearsDS', classYearsTable),
      classArms: addDynamoDataSource('ClassArmsDS', classArmsTable),
      classGroups: addDynamoDataSource('ClassGroupsDS', classGroupsTable),
      subjects: addDynamoDataSource('SubjectsDS', subjectsTable),
      classSubjects: addDynamoDataSource('ClassSubjectsDS', classSubjectsTable),
      students: addDynamoDataSource('StudentsDS', studentsTable),
      parents: addDynamoDataSource('ParentsDS', parentsTable),
      studentParentLinks: addDynamoDataSource('StudentParentLinksDS', studentParentLinksTable),
      enrollments: addDynamoDataSource('EnrollmentsDS', enrollmentsTable),
      importJobs: addDynamoDataSource('ImportJobsDS', importJobsTable),
      feeItems: addDynamoDataSource('FeeItemsDS', feeItemsTable),
      feeSchedules: addDynamoDataSource('FeeSchedulesDS', feeSchedulesTable),
      feeScheduleLines: addDynamoDataSource('FeeScheduleLinesDS', feeScheduleLinesTable),
      discountRules: addDynamoDataSource('DiscountRulesDS', discountRulesTable),
      invoices: addDynamoDataSource('InvoicesDS', invoicesTable),
      invoiceLines: addDynamoDataSource('InvoiceLinesDS', invoiceLinesTable),
      paymentIntents: addDynamoDataSource('PaymentIntentsDS', paymentIntentsTable),
      paymentTransactions: addDynamoDataSource('PaymentTransactionsDS', paymentTransactionsTable),
      receipts: addDynamoDataSource('ReceiptsDS', receiptsTable),
      paymentAllocations: addDynamoDataSource('PaymentAllocationsDS', paymentAllocationsTable),
      receiptCounters: addDynamoDataSource('ReceiptCountersDS', receiptCountersTable),
      manualPaymentProofs: addDynamoDataSource('ManualPaymentProofsDS', manualPaymentProofsTable),
      feeAdjustments: addDynamoDataSource('FeeAdjustmentsDS', feeAdjustmentsTable),
      installmentPlans: addDynamoDataSource('InstallmentPlansDS', installmentPlansTable),
      installments: addDynamoDataSource('InstallmentsDS', installmentsTable),
      messageTemplates: addDynamoDataSource('MessageTemplatesDS', messageTemplatesTable),
      messageCampaigns: addDynamoDataSource('MessageCampaignsDS', messageCampaignsTable),
      messageRecipients: addDynamoDataSource('MessageRecipientsDS', messageRecipientsTable),
      supportTickets: addDynamoDataSource('SupportTicketsDS', supportTicketsTable),
      supportTicketMessages: addDynamoDataSource('SupportTicketMessagesDS', supportTicketMessagesTable),
      attendanceSessions: addDynamoDataSource('AttendanceSessionsDS', attendanceSessionsTable),
      attendanceEntries: addDynamoDataSource('AttendanceEntriesDS', attendanceEntriesTable),
      assessmentPolicies: addDynamoDataSource('AssessmentPoliciesDS', assessmentPoliciesTable),
      assessments: addDynamoDataSource('AssessmentsDS', assessmentsTable),
      scoreEntries: addDynamoDataSource('ScoreEntriesDS', scoreEntriesTable),
      reportCards: addDynamoDataSource('ReportCardsDS', reportCardsTable),
      resultReleasePolicies: addDynamoDataSource('ResultReleasePoliciesDS', resultReleasePoliciesTable),
      featureFlags: addDynamoDataSource('FeatureFlagsDS', featureFlagsTable),
      plans: addDynamoDataSource('PlansDS', plansTable),
      addOns: addDynamoDataSource('AddOnsDS', addOnsTable),
      schoolSubscriptions: addDynamoDataSource('SchoolSubscriptionsDS', schoolSubscriptionsTable),
      schoolSubscriptionAddOns: addDynamoDataSource('SchoolSubscriptionAddOnsDS', schoolSubscriptionAddOnsTable),
      providerConfigs: addDynamoDataSource('ProviderConfigsDS', providerConfigsTable)
    };
    const tenantGuard = `
  #if($ctx.info.parentTypeName == "Mutation")
    #if(!$ctx.identity || !$ctx.identity.claims)
      $util.unauthorized()
    #end
  #end
  #if($ctx.identity && $ctx.identity.claims)
    #set($tenantSchool = $ctx.identity.claims.get("custom:schoolId"))
    #if($tenantSchool && $ctx.args.schoolId && $tenantSchool != $ctx.args.schoolId)
      $util.unauthorized()
    #end
    #if($tenantSchool && $ctx.args.input && $ctx.args.input.schoolId && $tenantSchool != $ctx.args.input.schoolId)
      $util.unauthorized()
    #end
  #end
`;

    const adminGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN") && !$groups.contains("SCHOOL_ADMIN"))
    $util.unauthorized()
  #end
`;
    const appAdminGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN"))
    $util.unauthorized()
  #end
`;
    const billingGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN") && !$groups.contains("SCHOOL_ADMIN") && !$groups.contains("BURSAR"))
    $util.unauthorized()
  #end
`;
    const staffGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN") && !$groups.contains("SCHOOL_ADMIN") && !$groups.contains("BURSAR") && !$groups.contains("TEACHER"))
    $util.unauthorized()
  #end
`;
    const importsGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN") && !$groups.contains("SCHOOL_ADMIN"))
    $util.unauthorized()
  #end
`;

    // Allow publisher to put events
    eventBus.grantPutEventsTo(eventPublisherFn);
    messageTemplatesTable.grantWriteData(templateSeederFn);
    schoolsTable.grantReadWriteData(schoolProvisionerFn);
    schoolProfilesTable.grantReadWriteData(schoolProvisionerFn);
    schoolHomePageSectionsTable.grantReadWriteData(schoolProvisionerFn);
    schoolDomainsTable.grantReadWriteData(schoolProvisionerFn);
    rolesTable.grantReadWriteData(schoolProvisionerFn);
    rolePermissionsTable.grantReadWriteData(schoolProvisionerFn);
    permissionsTable.grantReadWriteData(schoolProvisionerFn);
    uploadsBucket.grantPut(importUploadUrlFn);
    uploadsBucket.grantPut(manualProofUploadUrlFn);

    // Basic health resolver for Query.ping
    const noneDs = api.addNoneDataSource('NoneDS');
    noneDs.createResolver('PingResolver', {
      typeName: 'Query',
      fieldName: 'ping',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + '{\"version\":\"2018-05-29\",\"payload\":{}}'),
      responseMappingTemplate: MappingTemplate.fromString('"ok"')
    });

    ds.eventPublisher.createResolver('PublishEventResolver', {
      typeName: 'Mutation',
      fieldName: 'publishEvent'
    });
    ds.eventPublisher.createResolver('EnqueueInvoicingJobResolver', {
      typeName: 'Mutation',
      fieldName: 'enqueueInvoicingJob'
    });
    ds.eventPublisher.createResolver('EnqueueMessagingJobResolver', {
      typeName: 'Mutation',
      fieldName: 'enqueueMessagingJob'
    });
    ds.eventPublisher.createResolver('SendDefaulterRemindersResolver', {
      typeName: 'Mutation',
      fieldName: 'sendDefaulterReminders',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "detailType": $util.toJson($ctx.args.input.detailType),
    "source": $util.toJson($ctx.args.input.source),
      "detail": $util.toJson({
        "schoolId": $ctx.args.input.schoolId,
        "termId": $ctx.args.input.termId,
        "classGroupId": $ctx.args.input.classGroupId,
        "invoiceIds": $ctx.args.input.invoiceIds,
        "templateType": $ctx.args.input.templateType,
        "detailType": $ctx.args.input.detailType,
        "source": $ctx.args.input.source,
        "retryOnFail": $util.defaultIfNull($ctx.args.input.retryOnFail, true)
      })
    }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });
    ds.eventPublisher.createResolver('EnqueueImportJobResolver', {
      typeName: 'Mutation',
      fieldName: 'enqueueImportJob'
    });
    ds.templateSeeder.createResolver('SeedDefaultMessageTemplatesResolver', {
      typeName: 'Mutation',
      fieldName: 'seedDefaultMessageTemplates'
    });
    ds.schoolProvisioner.createResolver('ProvisionSchoolResolver', {
      typeName: 'Mutation',
      fieldName: 'provisionSchool'
    });
    ds.schoolProfiles.createResolver('CreateSchoolProfile', {
      typeName: 'Mutation',
      fieldName: 'createSchoolProfile',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId)
  },
  "attributeValues": {
    "address": $util.dynamodb.toDynamoDBJson($ctx.args.input.address),
    "city": $util.dynamodb.toDynamoDBJson($ctx.args.input.city),
    "state": $util.dynamodb.toDynamoDBJson($ctx.args.input.state),
    "contactEmail": $util.dynamodb.toDynamoDBJson($ctx.args.input.contactEmail),
    "contactPhone": $util.dynamodb.toDynamoDBJson($ctx.args.input.contactPhone),
    "logoUrl": $util.dynamodb.toDynamoDBJson($ctx.args.input.logoUrl),
    "heroImageUrl": $util.dynamodb.toDynamoDBJson($ctx.args.input.heroImageUrl),
    "themeJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.themeJson),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  },
  "conditionExpression": "attribute_not_exists(id)"
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.schoolProfiles.createResolver('UpdateSchoolProfile', {
      typeName: 'Mutation',
      fieldName: 'updateSchoolProfile',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET address = :address, city = :city, #state = :state, contactEmail = :contactEmail, contactPhone = :contactPhone, logoUrl = :logoUrl, heroImageUrl = :heroImageUrl, themeJson = :themeJson, updatedAt = :updatedAt",
    "expressionNames": { "#state": "state" },
    "expressionValues": {
      ":address": $util.dynamodb.toDynamoDBJson($ctx.args.input.address),
      ":city": $util.dynamodb.toDynamoDBJson($ctx.args.input.city),
      ":state": $util.dynamodb.toDynamoDBJson($ctx.args.input.state),
      ":contactEmail": $util.dynamodb.toDynamoDBJson($ctx.args.input.contactEmail),
      ":contactPhone": $util.dynamodb.toDynamoDBJson($ctx.args.input.contactPhone),
      ":logoUrl": $util.dynamodb.toDynamoDBJson($ctx.args.input.logoUrl),
      ":heroImageUrl": $util.dynamodb.toDynamoDBJson($ctx.args.input.heroImageUrl),
      ":themeJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.themeJson),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.schoolHomePageSections.createResolver('CreateSchoolHomePageSection', {
      typeName: 'Mutation',
      fieldName: 'createSchoolHomePageSection',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "contentJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.contentJson),
    "sortOrder": $util.dynamodb.toDynamoDBJson($ctx.args.input.sortOrder.toString()),
    "isEnabled": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.isEnabled, true)),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.schoolHomePageSections.createResolver('UpdateSchoolHomePageSection', {
      typeName: 'Mutation',
      fieldName: 'updateSchoolHomePageSection',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #type = :type, contentJson = :contentJson, sortOrder = :sortOrder, isEnabled = :isEnabled, updatedAt = :updatedAt",
    "expressionNames": { "#type": "type" },
    "expressionValues": {
      ":type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
      ":contentJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.contentJson),
      ":sortOrder": $util.dynamodb.toDynamoDBJson($ctx.args.input.sortOrder.toString()),
      ":isEnabled": $util.dynamodb.toDynamoDBJson($ctx.args.input.isEnabled),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.schoolHomePageSections.createResolver('DeleteSchoolHomePageSection', {
      typeName: 'Mutation',
      fieldName: 'deleteSchoolHomePageSection',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });
    ds.importUploader.createResolver('CreateImportUploadUrlResolver', {
      typeName: 'Mutation',
      fieldName: 'createImportUploadUrl',
      requestMappingTemplate: MappingTemplate.fromString(importsGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "input": $util.toJson($ctx.args.input)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.importErrorDownloader.createResolver('CreateImportErrorDownloadUrlResolver', {
      typeName: 'Mutation',
      fieldName: 'createImportErrorDownloadUrl',
      requestMappingTemplate: MappingTemplate.fromString(importsGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "input": $util.toJson($ctx.args.input)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.manualProofUploader.createResolver('CreateManualPaymentProofUploadUrlResolver', {
      typeName: 'Mutation',
      fieldName: 'createManualPaymentProofUploadUrl'
    });
    ds.receiptUploader.createResolver('CreateReceiptUploadUrlResolver', {
      typeName: 'Mutation',
      fieldName: 'createReceiptUploadUrl',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "input": $util.toJson($ctx.args.input)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    const receiptDownloadFn = new appsync.AppsyncFunction(this, 'ReceiptDownloadFn', {
      name: `${appsyncFunctionNamePrefix}_receiptDownload`,
      api,
      dataSource: ds.receiptDownloader,
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "input": $util.toJson($ctx.args.input)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const auditReceiptDownloadFn = new appsync.AppsyncFunction(
      this,
      'AuditReceiptDownloadFn',
      {
        name: `${appsyncFunctionNamePrefix}_auditReceiptDownload`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.identity.sub, "system")),
      "action": $util.dynamodb.toDynamoDBJson("RECEIPT_DOWNLOADED"),
      "entityType": $util.dynamodb.toDynamoDBJson("Receipt"),
      "entityId": $util.dynamodb.toDynamoDBJson($ctx.args.input.receiptNo),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
      }
    );

    const createReceiptDownloadUrlResolver = new appsync.Resolver(this, 'CreateReceiptDownloadUrlResolver', {
      api,
      typeName: 'Mutation',
      fieldName: 'createReceiptDownloadUrl',
      pipelineConfig: [receiptDownloadFn, auditReceiptDownloadFn],
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });
    (createReceiptDownloadUrlResolver.node.defaultChild as appsync.CfnResolver).overrideLogicalId(
      'GraphqlApiCreateReceiptDownloadUrlResolver04F87885'
    );
    ds.supportTickets.createResolver('CreateSupportTicket', {
      typeName: 'Mutation',
      fieldName: 'createSupportTicket',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "parentId": $util.dynamodb.toDynamoDBJson($ctx.args.input.parentId),
    "studentId": $util.dynamodb.toDynamoDBJson($ctx.args.input.studentId),
    "subject": $util.dynamodb.toDynamoDBJson($ctx.args.input.subject),
    "category": $util.dynamodb.toDynamoDBJson($ctx.args.input.category),
    "detail": $util.dynamodb.toDynamoDBJson($ctx.args.input.detail),
    "status": $util.dynamodb.toDynamoDBJson("OPEN"),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.supportTickets.createResolver('UpdateSupportTicketStatus', {
      typeName: 'Mutation',
      fieldName: 'updateSupportTicketStatus',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #status = :status, updatedAt = :updatedAt",
    "expressionNames": {
      "#status": "status"
    },
    "expressionValues": {
      ":status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.supportTicketMessages.createResolver('CreateSupportTicketMessage', {
      typeName: 'Mutation',
      fieldName: 'createSupportTicketMessage',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "ticketId": $util.dynamodb.toDynamoDBJson($ctx.args.input.ticketId),
    "authorType": $util.dynamodb.toDynamoDBJson($ctx.args.input.authorType),
    "authorId": $util.dynamodb.toDynamoDBJson($ctx.args.input.authorId),
    "body": $util.dynamodb.toDynamoDBJson($ctx.args.input.body),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    const createImportJobFn = new appsync.AppsyncFunction(this, 'CreateImportJobFn', {
      name: `${appsyncFunctionNamePrefix}_createImportJob`,
      api,
      dataSource: ds.importJobs,
      requestMappingTemplate: MappingTemplate.fromString(importsGuard + `
#set($jobId = $util.autoId())
$util.qr($ctx.stash.put("jobId", $jobId))
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($jobId)
  },
  "attributeValues": {
    "bucket": $util.dynamodb.toDynamoDBJson($ctx.args.input.bucket),
    "key": $util.dynamodb.toDynamoDBJson($ctx.args.input.key),
    "status": $util.dynamodb.toDynamoDBJson("QUEUED"),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
      "processedLines": $util.dynamodb.toDynamoDBJson(0),
      "created": $util.dynamodb.toDynamoDBJson(0),
      "updated": $util.dynamodb.toDynamoDBJson(0),
      "skipped": $util.dynamodb.toDynamoDBJson(0),
    "errors": $util.dynamodb.toDynamoDBJson(0)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    const emitImportRequestedFn = new appsync.AppsyncFunction(this, 'EmitImportRequestedFn', {
      name: `${appsyncFunctionNamePrefix}_emitImportRequested`,
      api,
      dataSource: ds.eventPublisher,
      requestMappingTemplate: MappingTemplate.fromString(importsGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "detailType": "import.requested",
    "source": "classpoint.imports",
    "detail": {
      "schoolId": $util.toJson($ctx.args.input.schoolId),
      "bucket": $util.toJson($ctx.args.input.bucket),
      "key": $util.toJson($ctx.args.input.key),
      "statusTable": "${importJobsTable.tableName}",
      "statusId": $util.toJson($ctx.stash.jobId)
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });
    new appsync.Resolver(this, 'CreateImportJobResolver', {
      api,
      typeName: 'Mutation',
      fieldName: 'createImportJob',
      pipelineConfig: [createImportJobFn, emitImportRequestedFn],
      requestMappingTemplate: MappingTemplate.fromString(importsGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.academicSessions.createResolver('CreateAcademicSession', {
      typeName: 'Mutation',
      fieldName: 'createAcademicSession',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "startDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.startDate),
    "endDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.endDate),
    "status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.academicSessions.createResolver('UpdateAcademicSession', {
      typeName: 'Mutation',
      fieldName: 'updateAcademicSession',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "startDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.startDate),
    "endDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.endDate),
    "status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status)
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.academicSessions.createResolver('DeleteAcademicSession', {
      typeName: 'Mutation',
      fieldName: 'deleteAcademicSession',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });
    ds.terms.createResolver('CreateTerm', {
      typeName: 'Mutation',
      fieldName: 'createTerm',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "sessionId": $util.dynamodb.toDynamoDBJson($ctx.args.input.sessionId),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "startDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.startDate),
    "endDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.endDate),
    "status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.terms.createResolver('UpdateTerm', {
      typeName: 'Mutation',
      fieldName: 'updateTerm',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "sessionId": $util.dynamodb.toDynamoDBJson($ctx.args.input.sessionId),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "startDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.startDate),
    "endDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.endDate),
    "status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status)
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.terms.createResolver('DeleteTerm', {
      typeName: 'Mutation',
      fieldName: 'deleteTerm',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });
    ds.levels.createResolver('CreateLevel', {
      typeName: 'Mutation',
      fieldName: 'createLevel',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
#set($newId = $util.autoId())
$util.qr($ctx.stash.put("newId", $newId))
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($newId)
  },
  "attributeValues": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "sortOrder": $util.dynamodb.toDynamoDBJson($ctx.args.input.sortOrder.toString())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
#set($input = $ctx.args.input)
$util.toJson({
  "schoolId": $input.schoolId,
  "id": $ctx.stash.newId,
  "type": $input.type,
  "name": $input.name,
  "sortOrder": $input.sortOrder
})`)
    });
    ds.levels.createResolver('UpdateLevel', {
      typeName: 'Mutation',
      fieldName: 'updateLevel',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "sortOrder": $util.dynamodb.toDynamoDBJson($ctx.args.input.sortOrder.toString())
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.levels.createResolver('DeleteLevel', {
      typeName: 'Mutation',
      fieldName: 'deleteLevel',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });
    ds.classYears.createResolver('CreateClassYear', {
      typeName: 'Mutation',
      fieldName: 'createClassYear',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
#set($newId = $util.autoId())
$util.qr($ctx.stash.put("newId", $newId))
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($newId)
  },
  "attributeValues": {
    "levelId": $util.dynamodb.toDynamoDBJson($ctx.args.input.levelId),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "sortOrder": $util.dynamodb.toDynamoDBJson($ctx.args.input.sortOrder.toString())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
#set($input = $ctx.args.input)
$util.toJson({
  "schoolId": $input.schoolId,
  "id": $ctx.stash.newId,
  "levelId": $input.levelId,
  "name": $input.name,
  "sortOrder": $input.sortOrder
})`)
    });
    ds.classYears.createResolver('UpdateClassYear', {
      typeName: 'Mutation',
      fieldName: 'updateClassYear',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "levelId": $util.dynamodb.toDynamoDBJson($ctx.args.input.levelId),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "sortOrder": $util.dynamodb.toDynamoDBJson($ctx.args.input.sortOrder.toString())
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.classYears.createResolver('DeleteClassYear', {
      typeName: 'Mutation',
      fieldName: 'deleteClassYear',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });
    ds.classArms.createResolver('CreateClassArm', {
      typeName: 'Mutation',
      fieldName: 'createClassArm',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
#set($newId = $util.autoId())
$util.qr($ctx.stash.put("newId", $newId))
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($newId)
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
#set($input = $ctx.args.input)
$util.toJson({
  "schoolId": $input.schoolId,
  "id": $ctx.stash.newId,
  "name": $input.name
})`)
    });
    ds.classArms.createResolver('UpdateClassArm', {
      typeName: 'Mutation',
      fieldName: 'updateClassArm',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name)
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.classArms.createResolver('DeleteClassArm', {
      typeName: 'Mutation',
      fieldName: 'deleteClassArm',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });
    ds.classGroups.createResolver('CreateClassGroup', {
      typeName: 'Mutation',
      fieldName: 'createClassGroup',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
#set($newId = $util.autoId())
$util.qr($ctx.stash.put("newId", $newId))
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($newId)
  },
  "attributeValues": {
    "classYearId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classYearId),
    "classArmId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classArmId),
    "displayName": $util.dynamodb.toDynamoDBJson($ctx.args.input.displayName),
    "classTeacherUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classTeacherUserId)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
#set($input = $ctx.args.input)
$util.toJson({
  "schoolId": $input.schoolId,
  "id": $ctx.stash.newId,
  "classYearId": $input.classYearId,
  "classArmId": $input.classArmId,
  "displayName": $input.displayName,
  "classTeacherUserId": $input.classTeacherUserId
})`)
    });
    ds.classGroups.createResolver('UpdateClassGroup', {
      typeName: 'Mutation',
      fieldName: 'updateClassGroup',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "classYearId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classYearId),
    "classArmId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classArmId),
    "displayName": $util.dynamodb.toDynamoDBJson($ctx.args.input.displayName),
    "classTeacherUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classTeacherUserId)
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.classGroups.createResolver('DeleteClassGroup', {
      typeName: 'Mutation',
      fieldName: 'deleteClassGroup',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
  {
    "version": "2018-05-29",
    "operation": "DeleteItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    const createRoleFn = new appsync.AppsyncFunction(this, 'CreateRoleFn', {
      name: `${appsyncFunctionNamePrefix}_createRole`,
      api,
      dataSource: ds.roles,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  #set($roleId = $util.autoId())
  $util.qr($ctx.stash.put("roleId", $roleId))
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($roleId)
    },
    "attributeValues": {
      "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
      "isSystemRole": $util.dynamodb.toDynamoDBJson(false)
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const updateRoleFn = new appsync.AppsyncFunction(this, 'UpdateRoleFn', {
      name: `${appsyncFunctionNamePrefix}_updateRole`,
      api,
      dataSource: ds.roles,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  {
    "version": "2018-05-29",
    "operation": "UpdateItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
    },
    "update": {
      "expression": "SET #name = :name",
      "expressionNames": { "#name": "name" },
      "expressionValues": {
        ":name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name)
      }
    },
    "condition": {
      "expression": "attribute_exists(#id)",
      "expressionNames": { "#id": "id" }
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const deleteRoleFn = new appsync.AppsyncFunction(this, 'DeleteRoleFn', {
      name: `${appsyncFunctionNamePrefix}_deleteRole`,
      api,
      dataSource: ds.roles,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  {
    "version": "2018-05-29",
    "operation": "DeleteItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
    },
    "condition": {
      "expression": "attribute_exists(#id) AND (attribute_not_exists(isSystemRole) OR isSystemRole = :false)",
      "expressionNames": { "#id": "id" },
      "expressionValues": {
        ":false": $util.dynamodb.toDynamoDBJson(false)
      }
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const auditRoleEventFn = (id: string, action: string) =>
      new appsync.AppsyncFunction(this, id, {
        name: `${appsyncFunctionNamePrefix}_${id}`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  #if($ctx.prev.result)
    #set($payload = $ctx.prev.result)
  #else
    #set($payload = {
      "id": $ctx.args.input.id,
      "schoolId": $ctx.args.input.schoolId,
      "name": $ctx.args.input.name,
      "isSystemRole": false
    })
  #end
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.${action === 'ROLE_CREATED' ? 'createdByUserId' : action === 'ROLE_UPDATED' ? 'updatedByUserId' : 'deletedByUserId'}),
      "action": $util.dynamodb.toDynamoDBJson("${action}"),
      "entityType": $util.dynamodb.toDynamoDBJson("Role"),
      "entityId": $util.dynamodb.toDynamoDBJson($payload.id),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson($payload)),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
      });

    const auditRoleCreatedFn = auditRoleEventFn('AuditRoleCreatedFn', 'ROLE_CREATED');
    const auditRoleUpdatedFn = auditRoleEventFn('AuditRoleUpdatedFn', 'ROLE_UPDATED');
    const auditRoleDeletedFn = auditRoleEventFn('AuditRoleDeletedFn', 'ROLE_DELETED');

    api.createResolver('CreateRoleResolver', {
      typeName: 'Mutation',
      fieldName: 'createRole',
      pipelineConfig: [createRoleFn, auditRoleCreatedFn],
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });

    api.createResolver('UpdateRoleResolver', {
      typeName: 'Mutation',
      fieldName: 'updateRole',
      pipelineConfig: [updateRoleFn, auditRoleUpdatedFn],
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });

    api.createResolver('DeleteRoleResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteRole',
      pipelineConfig: [deleteRoleFn, auditRoleDeletedFn],
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    const findUserRoleFn = new appsync.AppsyncFunction(this, 'FindUserRoleFn', {
      name: `${appsyncFunctionNamePrefix}_findUserRole`,
      api,
      dataSource: ds.userRoles,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  {
    "version": "2018-05-29",
    "operation": "Query",
    "index": "byUser",
    "query": {
      "expression": "userId = :uid AND roleId = :rid",
      "expressionValues": {
        ":uid": $util.dynamodb.toDynamoDBJson($ctx.args.input.userId),
        ":rid": $util.dynamodb.toDynamoDBJson($ctx.args.input.roleId)
      }
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString(`
  #if($ctx.result.items.size() > 0)
    $util.toJson($ctx.result.items[0])
  #else
    $util.toJson(null)
  #end
  `)
    });

    const createUserRoleFn = new appsync.AppsyncFunction(this, 'CreateUserRoleFn', {
      name: `${appsyncFunctionNamePrefix}_createUserRole`,
      api,
      dataSource: ds.userRoles,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  #if($ctx.prev.result)
    $util.error("User already has this role", "Conflict")
  #end
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "userId": $util.dynamodb.toDynamoDBJson($ctx.args.input.userId),
      "roleId": $util.dynamodb.toDynamoDBJson($ctx.args.input.roleId)
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const deleteUserRoleFn = new appsync.AppsyncFunction(this, 'DeleteUserRoleFn', {
      name: `${appsyncFunctionNamePrefix}_deleteUserRole`,
      api,
      dataSource: ds.userRoles,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  #if(!$ctx.prev.result)
    $util.error("User role not found", "NotFound")
  #end
  {
    "version": "2018-05-29",
    "operation": "DeleteItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($ctx.prev.result.id)
    },
    "returnValues": "ALL_OLD"
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const auditUserRoleAssignedFn = new appsync.AppsyncFunction(
      this,
      'AuditUserRoleAssignedFn',
      {
        name: `${appsyncFunctionNamePrefix}_auditUserRoleAssigned`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.assignedByUserId),
      "action": $util.dynamodb.toDynamoDBJson("USER_ROLE_ASSIGNED"),
      "entityType": $util.dynamodb.toDynamoDBJson("UserRole"),
      "entityId": $util.dynamodb.toDynamoDBJson($ctx.prev.result.id),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson($ctx.prev.result)),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
      }
    );

    const auditUserRoleRemovedFn = new appsync.AppsyncFunction(
      this,
      'AuditUserRoleRemovedFn',
      {
        name: `${appsyncFunctionNamePrefix}_auditUserRoleRemoved`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.removedByUserId),
      "action": $util.dynamodb.toDynamoDBJson("USER_ROLE_REMOVED"),
      "entityType": $util.dynamodb.toDynamoDBJson("UserRole"),
      "entityId": $util.dynamodb.toDynamoDBJson($ctx.prev.result.id),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson($ctx.prev.result)),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
      }
    );

    api.createResolver('AssignUserRoleResolver', {
      typeName: 'Mutation',
      fieldName: 'assignUserRole',
      pipelineConfig: [findUserRoleFn, createUserRoleFn, auditUserRoleAssignedFn],
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });

    api.createResolver('RemoveUserRoleResolver', {
      typeName: 'Mutation',
      fieldName: 'removeUserRole',
      pipelineConfig: [findUserRoleFn, deleteUserRoleFn, auditUserRoleRemovedFn],
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    const findRolePermissionFn = new appsync.AppsyncFunction(this, 'FindRolePermissionFn', {
      name: `${appsyncFunctionNamePrefix}_findRolePermission`,
      api,
      dataSource: ds.rolePermissions,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  {
    "version": "2018-05-29",
    "operation": "Query",
    "index": "byRole",
    "query": {
      "expression": "roleId = :rid AND permissionCode = :pc",
      "expressionValues": {
        ":rid": $util.dynamodb.toDynamoDBJson($ctx.args.input.roleId),
        ":pc": $util.dynamodb.toDynamoDBJson($ctx.args.input.permissionCode)
      }
      }
    }`),
      responseMappingTemplate: MappingTemplate.fromString(`
  #if($ctx.result.items.size() > 0)
    #set($item = $ctx.result.items[0])
    $util.qr($ctx.stash.put("rolePermission", $item))
    $util.toJson($item)
  #else
    $util.toJson(null)
  #end
  `)
    });

    const createRolePermissionFn = new appsync.AppsyncFunction(this, 'CreateRolePermissionFn', {
      name: `${appsyncFunctionNamePrefix}_createRolePermission`,
      api,
      dataSource: ds.rolePermissions,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  #if($ctx.prev.result)
    $util.error("Role permission already exists", "Conflict")
  #end
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "roleId": $util.dynamodb.toDynamoDBJson($ctx.args.input.roleId),
      "permissionCode": $util.dynamodb.toDynamoDBJson($ctx.args.input.permissionCode)
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const deleteRolePermissionFn = new appsync.AppsyncFunction(this, 'DeleteRolePermissionFn', {
      name: `${appsyncFunctionNamePrefix}_deleteRolePermission`,
      api,
      dataSource: ds.rolePermissions,
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  #if(!$ctx.prev.result)
    $util.error("Role permission not found", "NotFound")
  #end
  {
    "version": "2018-05-29",
    "operation": "DeleteItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($ctx.prev.result.id)
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const auditRolePermissionAssignedFn = new appsync.AppsyncFunction(
      this,
      'AuditRolePermissionAssignedFn',
      {
        name: `${appsyncFunctionNamePrefix}_auditRolePermissionAssigned`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.assignedByUserId),
      "action": $util.dynamodb.toDynamoDBJson("ROLE_PERMISSION_ASSIGNED"),
      "entityType": $util.dynamodb.toDynamoDBJson("RolePermission"),
      "entityId": $util.dynamodb.toDynamoDBJson($ctx.prev.result.id),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson($ctx.prev.result)),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
      }
    );

    const auditRolePermissionRemovedFn = new appsync.AppsyncFunction(
      this,
      'AuditRolePermissionRemovedFn',
      {
        name: `${appsyncFunctionNamePrefix}_auditRolePermissionRemoved`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  #set($removed = $ctx.stash.rolePermission)
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.removedByUserId),
      "action": $util.dynamodb.toDynamoDBJson("ROLE_PERMISSION_REMOVED"),
      "entityType": $util.dynamodb.toDynamoDBJson("RolePermission"),
      "entityId": $util.dynamodb.toDynamoDBJson($removed.id),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson($removed)),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
      }
    );

    api.createResolver('AssignRolePermissionResolver', {
      typeName: 'Mutation',
      fieldName: 'assignRolePermission',
      pipelineConfig: [findRolePermissionFn, createRolePermissionFn, auditRolePermissionAssignedFn],
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });

    api.createResolver('RemoveRolePermissionResolver', {
      typeName: 'Mutation',
      fieldName: 'removeRolePermission',
      pipelineConfig: [findRolePermissionFn, deleteRolePermissionFn, auditRolePermissionRemovedFn],
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    const createFeeAdjustmentFn = new appsync.AppsyncFunction(this, 'CreateFeeAdjustmentFn', {
      name: `${appsyncFunctionNamePrefix}_createFeeAdjustment`,
      api,
      dataSource: ds.feeAdjustments,
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
  #set($adjustmentId = $util.autoId())
  $util.qr($ctx.stash.put("adjustmentId", $adjustmentId))
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($adjustmentId)
    },
    "attributeValues": {
      "invoiceId": $util.dynamodb.toDynamoDBJson($ctx.args.input.invoiceId),
      "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
      "amount": $util.dynamodb.toDynamoDBJson($ctx.args.input.amount),
      "reason": $util.dynamodb.toDynamoDBJson($ctx.args.input.reason),
      "createdByUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.createdByUserId),
      "approvedByUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.approvedByUserId),
      "approvedAt": $util.dynamodb.toDynamoDBJson($ctx.args.input.approvedAt),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const createFeeAdjustmentAuditFn = new appsync.AppsyncFunction(
      this,
      'CreateFeeAdjustmentAuditFn',
      {
        name: `${appsyncFunctionNamePrefix}_createFeeAdjustmentAudit`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
  #set($auditId = $util.autoId())
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($auditId)
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.createdByUserId),
      "action": $util.dynamodb.toDynamoDBJson("FEE_ADJUSTMENT_CREATED"),
      "entityType": $util.dynamodb.toDynamoDBJson("FeeAdjustment"),
      "entityId": $util.dynamodb.toDynamoDBJson($ctx.prev.result.id),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson($ctx.prev.result)),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
      }
    );

    api.createResolver('CreateFeeAdjustment', {
      typeName: 'Mutation',
      fieldName: 'createFeeAdjustment',
      pipelineConfig: [createFeeAdjustmentFn, createFeeAdjustmentAuditFn],
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });

    ds.feeItems.createResolver('CreateFeeItem', {
      typeName: 'Mutation',
      fieldName: 'createFeeItem',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
    "category": $util.dynamodb.toDynamoDBJson($ctx.args.input.category),
    "isOptional": $util.dynamodb.toDynamoDBJson($ctx.args.input.isOptional),
    "isActive": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.isActive, true))
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.feeItems.createResolver('UpdateFeeItem', {
      typeName: 'Mutation',
      fieldName: 'updateFeeItem',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
    "category": $util.dynamodb.toDynamoDBJson($ctx.args.input.category),
    "isOptional": $util.dynamodb.toDynamoDBJson($ctx.args.input.isOptional),
    "isActive": $util.dynamodb.toDynamoDBJson($ctx.args.input.isActive)
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.feeItems.createResolver('DeleteFeeItem', {
      typeName: 'Mutation',
      fieldName: 'deleteFeeItem',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    ds.users.createResolver('CreateUserResolver', {
      typeName: 'Mutation',
      fieldName: 'createUser',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "email": $util.dynamodb.toDynamoDBJson($ctx.args.input.email),
    "phone": $util.dynamodb.toDynamoDBJson($ctx.args.input.phone),
    "userType": $util.dynamodb.toDynamoDBJson($ctx.args.input.userType),
    "status": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.status, "INVITED")),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.staffInviter.createResolver('InviteStaffUserResolver', {
      typeName: 'Mutation',
      fieldName: 'inviteStaffUser',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "input": $util.toJson($ctx.args.input)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.resultReleasePolicies.createResolver('CreateResultReleasePolicy', {
      typeName: 'Mutation',
      fieldName: 'createResultReleasePolicy',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "isEnabled": $util.dynamodb.toDynamoDBJson($ctx.args.input.isEnabled),
    "minimumPaymentPercent": $util.dynamodb.toDynamoDBJson($ctx.args.input.minimumPaymentPercent),
    "messageToParent": $util.dynamodb.toDynamoDBJson($ctx.args.input.messageToParent),
    "appliesTo": $util.dynamodb.toDynamoDBJson($ctx.args.input.appliesTo),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.resultReleasePolicies.createResolver('UpdateResultReleasePolicy', {
      typeName: 'Mutation',
      fieldName: 'updateResultReleasePolicy',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #enabled = :enabled, #minimum = :minimum, #message = :message, #appliesTo = :appliesTo, #updatedAt = :updatedAt",
    "expressionNames": {
      "#enabled": "isEnabled",
      "#minimum": "minimumPaymentPercent",
      "#message": "messageToParent",
      "#appliesTo": "appliesTo",
      "#updatedAt": "updatedAt"
    },
    "expressionValues": {
      ":enabled": $util.dynamodb.toDynamoDBJson($ctx.args.input.isEnabled),
      ":minimum": $util.dynamodb.toDynamoDBJson($ctx.args.input.minimumPaymentPercent),
      ":message": $util.dynamodb.toDynamoDBJson($ctx.args.input.messageToParent),
      ":appliesTo": $util.dynamodb.toDynamoDBJson($ctx.args.input.appliesTo),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.resultReleasePolicies.createResolver('DeleteResultReleasePolicy', {
      typeName: 'Mutation',
      fieldName: 'deleteResultReleasePolicy',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    ds.feeSchedules.createResolver('CreateFeeSchedule', {
      typeName: 'Mutation',
      fieldName: 'createFeeSchedule',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "sessionId": $util.dynamodb.toDynamoDBJson($ctx.args.input.sessionId),
    "termId": $util.dynamodb.toDynamoDBJson($ctx.args.input.termId),
    "classYearId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classYearId),
    "classGroupId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classGroupId),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "currency": $util.dynamodb.toDynamoDBJson($ctx.args.input.currency),
    "isActive": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.isActive, true)),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.feeSchedules.createResolver('UpdateFeeSchedule', {
      typeName: 'Mutation',
      fieldName: 'updateFeeSchedule',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "sessionId": $util.dynamodb.toDynamoDBJson($ctx.args.input.sessionId),
    "termId": $util.dynamodb.toDynamoDBJson($ctx.args.input.termId),
    "classYearId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classYearId),
    "classGroupId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classGroupId),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "currency": $util.dynamodb.toDynamoDBJson($ctx.args.input.currency),
    "isActive": $util.dynamodb.toDynamoDBJson($ctx.args.input.isActive),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.feeSchedules.createResolver('DeleteFeeSchedule', {
      typeName: 'Mutation',
      fieldName: 'deleteFeeSchedule',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    ds.feeScheduleLines.createResolver('CreateFeeScheduleLine', {
      typeName: 'Mutation',
      fieldName: 'createFeeScheduleLine',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "feeScheduleId": $util.dynamodb.toDynamoDBJson($ctx.args.input.feeScheduleId),
    "feeItemId": $util.dynamodb.toDynamoDBJson($ctx.args.input.feeItemId),
    "amount": $util.dynamodb.toDynamoDBJson($ctx.args.input.amount),
    "isOptionalOverride": $util.dynamodb.toDynamoDBJson($ctx.args.input.isOptionalOverride),
    "dueDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.dueDate),
    "sortOrder": $util.dynamodb.toDynamoDBJson($ctx.args.input.sortOrder.toString())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.feeScheduleLines.createResolver('UpdateFeeScheduleLine', {
      typeName: 'Mutation',
      fieldName: 'updateFeeScheduleLine',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "feeScheduleId": $util.dynamodb.toDynamoDBJson($ctx.args.input.feeScheduleId),
    "feeItemId": $util.dynamodb.toDynamoDBJson($ctx.args.input.feeItemId),
    "amount": $util.dynamodb.toDynamoDBJson($ctx.args.input.amount),
    "isOptionalOverride": $util.dynamodb.toDynamoDBJson($ctx.args.input.isOptionalOverride),
    "dueDate": $util.dynamodb.toDynamoDBJson($ctx.args.input.dueDate),
    "sortOrder": $util.dynamodb.toDynamoDBJson($ctx.args.input.sortOrder.toString())
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    ds.feeScheduleLines.createResolver('DeleteFeeScheduleLine', {
      typeName: 'Mutation',
      fieldName: 'deleteFeeScheduleLine',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    const hydrateInvoiceClassGroupFn = new appsync.AppsyncFunction(this, 'HydrateInvoiceClassGroupFn', {
      name: `${appsyncFunctionNamePrefix}_hydrateInvoiceClassGroup`,
      api,
      dataSource: ds.enrollments,
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byStudentEnrollment",
  "query": {
    "expression": "studentId = :sid and termId = :tid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.input.studentId),
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.input.termId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": 1
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
#set($classGroupId = $ctx.args.input.classGroupId)
#if(!$classGroupId && $ctx.result.items.size() > 0)
  #set($classGroupId = $ctx.result.items[0].classGroupId)
#end
$util.qr($ctx.stash.put("classGroupId", $classGroupId))
$util.toJson($ctx.result)
`)
    });

    const createInvoiceFn = new appsync.AppsyncFunction(this, 'CreateInvoiceFn', {
      name: `${appsyncFunctionNamePrefix}_createInvoice`,
      api,
      dataSource: ds.invoices,
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
#set($invoiceId = $util.autoId())
#set($invoiceNo = "INV-" + $util.time.nowEpochMilliSeconds())
$util.qr($ctx.stash.put("invoiceId", $invoiceId))
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($invoiceId)
  },
  "attributeValues": {
    "invoiceNo": $util.dynamodb.toDynamoDBJson($invoiceNo),
    "studentId": $util.dynamodb.toDynamoDBJson($ctx.args.input.studentId),
    "enrollmentId": $util.dynamodb.toDynamoDBJson($ctx.args.input.enrollmentId),
    "sessionId": $util.dynamodb.toDynamoDBJson($ctx.args.input.sessionId),
    "termId": $util.dynamodb.toDynamoDBJson($ctx.args.input.termId),
    "classGroupId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.classGroupId, $ctx.stash.classGroupId)),
    "feeScheduleId": $util.dynamodb.toDynamoDBJson($ctx.args.input.feeScheduleId),
    "status": $util.dynamodb.toDynamoDBJson("ISSUED"),
    "issuedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "dueAt": $util.dynamodb.toDynamoDBJson($ctx.args.input.dueAt),
    "requiredSubtotal": $util.dynamodb.toDynamoDBJson(0),
    "optionalSubtotal": $util.dynamodb.toDynamoDBJson(0),
    "discountTotal": $util.dynamodb.toDynamoDBJson(0),
    "penaltyTotal": $util.dynamodb.toDynamoDBJson(0),
    "amountPaid": $util.dynamodb.toDynamoDBJson(0),
    "amountDue": $util.dynamodb.toDynamoDBJson(0)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });
    const emitInvoiceJobFn = new appsync.AppsyncFunction(this, 'EmitInvoiceJobFn', {
      name: `${appsyncFunctionNamePrefix}_emitInvoiceJob`,
      api,
      dataSource: ds.eventPublisher,
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "detailType": "invoice.generated",
    "source": "classpoint.billing",
    "detail": {
      "schoolId": $util.toJson($ctx.args.input.schoolId),
      "invoiceId": $util.toJson($ctx.stash.invoiceId)
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });
    new appsync.Resolver(this, 'CreateInvoiceResolver', {
      api,
      typeName: 'Mutation',
      fieldName: 'createInvoice',
      pipelineConfig: [hydrateInvoiceClassGroupFn, createInvoiceFn, emitInvoiceJobFn],
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });
    ds.batchInvoiceGenerator.createResolver('GenerateClassInvoicesResolver', {
      typeName: 'Mutation',
      fieldName: 'generateClassInvoices',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "input": $util.toJson($ctx.args.input)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const invoiceItemSelectorFn = new lambda.Function(this, 'InvoiceItemSelector', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        INVOICES_TABLE: invoicesTable.tableName,
        INVOICE_LINES_TABLE: invoiceLinesTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName
      },
      code: lambda.Code.fromInline(`
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const eb = new EventBridgeClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const loadInvoice = async (schoolId, invoiceId) => {
  const res = await dynamo.send(new GetCommand({
    TableName: process.env.INVOICES_TABLE,
    Key: { schoolId, id: invoiceId }
  }));
  return res.Item || null;
};

exports.handler = async (event) => {
  const input = event.arguments?.input || {};
  const { schoolId, invoiceId, selectedLineIds } = input;
  if (!schoolId || !invoiceId) throw new Error('schoolId and invoiceId are required');
  const ids = new Set(selectedLineIds || []);
  const res = await dynamo.send(new QueryCommand({
    TableName: process.env.INVOICE_LINES_TABLE,
    IndexName: 'byInvoice',
    KeyConditionExpression: 'invoiceId = :iid',
    ExpressionAttributeValues: { ':iid': invoiceId }
  }));
  const lines = res.Items || [];
  const invoice = await loadInvoice(schoolId, invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  for (const line of lines) {
    if (!line.isOptional) continue;
    const isSelected = ids.has(line.id);
    if (line.isSelected === isSelected) continue;
    await dynamo.send(new UpdateCommand({
      TableName: process.env.INVOICE_LINES_TABLE,
      Key: { schoolId, id: line.id },
      UpdateExpression: 'SET isSelected = :sel',
      ExpressionAttributeValues: { ':sel': isSelected }
    }));
    line.isSelected = isSelected;
  }
  const optionalSubtotal = lines
    .filter((line) => line.isOptional === true && line.isSelected !== false)
    .reduce((sum, line) => sum + (line.amount || 0), 0);
  const requiredSubtotal = invoice.requiredSubtotal || 0;
  const discountTotal = invoice.discountTotal || 0;
  const penaltyTotal = invoice.penaltyTotal || 0;
  const amountPaid = invoice.amountPaid || 0;
  const amountDue = Math.max(
    requiredSubtotal + optionalSubtotal - discountTotal + penaltyTotal - amountPaid,
    0
  );
  const now = new Date().toISOString();
  await dynamo.send(new UpdateCommand({
    TableName: process.env.INVOICES_TABLE,
    Key: { schoolId, id: invoiceId },
    UpdateExpression: 'SET optionalSubtotal = :opt, amountDue = :due, lastProcessedAt = :now',
    ExpressionAttributeValues: { ':opt': optionalSubtotal, ':due': amountDue, ':now': now }
  }));
  invoice.optionalSubtotal = optionalSubtotal;
  invoice.amountDue = amountDue;
  invoice.lastProcessedAt = now;
  if (process.env.EVENT_BUS_NAME) {
    await eb.send(new PutEventsCommand({
      Entries: [{
        EventBusName: process.env.EVENT_BUS_NAME,
        DetailType: 'invoice.generated',
        Source: 'classpoint.billing',
        Detail: JSON.stringify({ schoolId, invoiceId, reason: 'SELECTION_UPDATE' })
      }]
    }));
  }
  return invoice;
};`)
    });
    invoiceLinesTable.grantReadWriteData(invoiceItemSelectorFn);
    invoicesTable.grantReadWriteData(invoiceItemSelectorFn);
    eventBus.grantPutEventsTo(invoiceItemSelectorFn);
    api.addLambdaDataSource('InvoiceItemSelectorDS', invoiceItemSelectorFn).createResolver(
      'SelectInvoiceOptionalItemsResolver',
      {
        typeName: 'Mutation',
        fieldName: 'selectInvoiceOptionalItems'
      }
    );

    const getInvoiceForPaymentIntentFn = new appsync.AppsyncFunction(
      this,
      'GetInvoiceForPaymentIntentFn',
      {
        name: `${appsyncFunctionNamePrefix}_getInvoiceForPaymentIntent`,
        api,
        dataSource: ds.invoices,
        requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
  {
    "version": "2018-05-29",
    "operation": "GetItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.invoiceId)
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
      }
    );

    const createPaymentIntentFn = new appsync.AppsyncFunction(
      this,
      'CreatePaymentIntentFn',
      {
        name: `${appsyncFunctionNamePrefix}_createPaymentIntent`,
        api,
        dataSource: ds.paymentIntents,
        requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
  #set($invoice = $ctx.prev.result)
  #if(!$invoice)
    $util.error("Invoice not found", "NotFound")
  #end
  #set($paid = $util.defaultIfNull($invoice.amountPaid, 0))
  #set($requiredSubtotal = $util.defaultIfNull($invoice.requiredSubtotal, 0))
  #set($minFirstPercent = $util.defaultIfNull($invoice.minFirstPercent, 30))
  #set($minFirstAmount = $util.defaultIfNull($invoice.minFirstAmount, 0))
  #if($minFirstAmount == 0 && $requiredSubtotal > 0)
    #set($minFirstAmount = $requiredSubtotal * $minFirstPercent / 100)
  #end
  #if($minFirstAmount > 0 && ($paid + $ctx.args.input.amount) < $minFirstAmount)
    $util.error("Minimum first payment required", "MinFirstPayment")
  #end
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "invoiceId": $util.dynamodb.toDynamoDBJson($ctx.args.input.invoiceId),
      "payerParentId": $util.dynamodb.toDynamoDBJson($ctx.args.input.payerParentId),
      "provider": $util.dynamodb.toDynamoDBJson($ctx.args.input.provider),
      "amount": $util.dynamodb.toDynamoDBJson($ctx.args.input.amount),
      "currency": $util.dynamodb.toDynamoDBJson($ctx.args.input.currency),
      "status": $util.dynamodb.toDynamoDBJson("INITIATED"),
      "externalReference": $util.dynamodb.toDynamoDBJson($ctx.args.input.externalReference),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
      }
    );

    api.createResolver('CreatePaymentIntent', {
      typeName: 'Mutation',
      fieldName: 'createPaymentIntent',
      pipelineConfig: [getInvoiceForPaymentIntentFn, createPaymentIntentFn],
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });

    const createManualPaymentTxnFn = new appsync.AppsyncFunction(this, 'CreateManualPaymentTxnFn', {
      name: `${appsyncFunctionNamePrefix}_createManualPaymentTxn`,
      api,
      dataSource: ds.paymentTransactions,
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
#set($txnId = $util.autoId())
$util.qr($ctx.stash.put("txnId", $txnId))
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($txnId)
  },
  "attributeValues": {
    "invoiceId": $util.dynamodb.toDynamoDBJson($ctx.args.input.invoiceId),
    "method": $util.dynamodb.toDynamoDBJson("MANUAL"),
    "amount": $util.dynamodb.toDynamoDBJson($ctx.args.input.amount),
    "currency": $util.dynamodb.toDynamoDBJson($ctx.args.input.currency),
    "status": $util.dynamodb.toDynamoDBJson("PENDING"),
    "paidAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "reference": $util.dynamodb.toDynamoDBJson("manual-" + $txnId)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const createManualPaymentProofFn = new appsync.AppsyncFunction(this, 'CreateManualPaymentProofFn', {
      name: `${appsyncFunctionNamePrefix}_createManualPaymentProof`,
      api,
      dataSource: ds.manualPaymentProofs,
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "paymentTxnId": $util.dynamodb.toDynamoDBJson($ctx.stash.txnId),
    "fileUrl": $util.dynamodb.toDynamoDBJson($ctx.args.input.fileUrl),
    "submittedByParentId": $util.dynamodb.toDynamoDBJson($ctx.args.input.submittedByParentId),
    "status": $util.dynamodb.toDynamoDBJson("SUBMITTED"),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const auditManualPaymentSubmitFn = new appsync.AppsyncFunction(
      this,
      'AuditManualPaymentSubmitFn',
      {
        name: `${appsyncFunctionNamePrefix}_auditManualPaymentSubmit`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
  #set($actor = $util.defaultIfNull($ctx.args.input.submittedByParentId, "system"))
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($actor),
      "action": $util.dynamodb.toDynamoDBJson("MANUAL_PAYMENT_SUBMITTED"),
      "entityType": $util.dynamodb.toDynamoDBJson("PaymentTransaction"),
      "entityId": $util.dynamodb.toDynamoDBJson($ctx.stash.txnId),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson({
        "paymentTxnId": $ctx.stash.txnId,
        "proofId": $ctx.prev.result.id,
        "invoiceId": $ctx.args.input.invoiceId,
        "amount": $ctx.args.input.amount,
        "currency": $ctx.args.input.currency
      })),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
      }
    );

    new appsync.Resolver(this, 'SubmitManualPaymentProofResolver', {
      api,
      typeName: 'Mutation',
      fieldName: 'submitManualPaymentProof',
      pipelineConfig: [createManualPaymentTxnFn, createManualPaymentProofFn, auditManualPaymentSubmitFn],
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });

    const reviewManualPaymentProofFn = new appsync.AppsyncFunction(this, 'ReviewManualPaymentProofFn', {
      name: `${appsyncFunctionNamePrefix}_reviewManualPaymentProof`,
      api,
      dataSource: ds.manualPaymentProofs,
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.proofId)
  },
  "update": {
    "expression": "SET #status = :s, reviewedByUserId = :rid, reviewedAt = :now, notes = :notes",
    "expressionNames": { "#status": "status" },
    "expressionValues": {
      ":s": $util.dynamodb.toDynamoDBJson($ctx.args.input.status),
      ":rid": $util.dynamodb.toDynamoDBJson($ctx.args.input.reviewerUserId),
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
      ":notes": $util.dynamodb.toDynamoDBJson($ctx.args.input.notes)
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
$util.qr($ctx.stash.put("paymentTxnId", $ctx.result.paymentTxnId))
$util.toJson($ctx.result)
`)
    });

    const incrementReceiptSeqFn = new appsync.AppsyncFunction(this, 'IncrementReceiptSeqFn', {
      name: `${appsyncFunctionNamePrefix}_incrementReceiptSeq`,
      api,
      dataSource: ds.receiptCounters,
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
#if($ctx.args.input.status != "APPROVED")
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson("receipt")
  }
}
#else
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson("receipt")
  },
  "update": {
    "expression": "SET lastSeq = if_not_exists(lastSeq, :zero) + :inc, updatedAt = :now",
    "expressionValues": {
      ":zero": $util.dynamodb.toDynamoDBJson(0),
      ":inc": $util.dynamodb.toDynamoDBJson(1),
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  },
  "returnValues": "UPDATED_NEW"
}
#end`),
      responseMappingTemplate: MappingTemplate.fromString(`
$util.qr($ctx.stash.put("receiptSeq", $ctx.result.lastSeq))
$util.toJson($ctx.result)
`)
    });

    const attachReceiptUrlFn = new appsync.AppsyncFunction(this, 'AttachReceiptUrlFn', {
      name: `${appsyncFunctionNamePrefix}_attachReceiptUrl`,
      api,
      dataSource: ds.receipts,
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.receiptNo)
  },
  "update": {
    "expression": "SET receiptUrl = :url, receiptBucket = :bucket, receiptKey = :key, updatedAt = :now",
    "expressionValues": {
      ":url": $util.dynamodb.toDynamoDBJson($ctx.args.input.receiptUrl),
      ":bucket": $util.dynamodb.toDynamoDBJson($ctx.args.input.receiptBucket),
      ":key": $util.dynamodb.toDynamoDBJson($ctx.args.input.receiptKey),
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  },
  "condition": {
    "expression": "attribute_exists(id)"
  },
  "returnValues": "ALL_NEW"
}
`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const auditReceiptAttachmentFn = new appsync.AppsyncFunction(
      this,
      'AuditReceiptAttachmentFn',
      {
        name: `${appsyncFunctionNamePrefix}_auditReceiptAttachment`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
  #set($actor = $util.defaultIfNull($ctx.identity.sub, "system"))
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($actor),
      "action": $util.dynamodb.toDynamoDBJson("RECEIPT_ATTACHED"),
      "entityType": $util.dynamodb.toDynamoDBJson("Receipt"),
      "entityId": $util.dynamodb.toDynamoDBJson($ctx.args.input.receiptNo),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson({
        "receiptNo": $ctx.args.input.receiptNo,
        "receiptKey": $ctx.args.input.receiptKey,
        "receiptBucket": $ctx.args.input.receiptBucket
      })),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
      }
    );

    const updatePaymentTxnStatusFn = new appsync.AppsyncFunction(this, 'UpdatePaymentTxnStatusFn', {
      name: `${appsyncFunctionNamePrefix}_updatePaymentTxnStatus`,
      api,
      dataSource: ds.paymentTransactions,
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
#set($approved = $ctx.args.input.status == "APPROVED")
#set($updateExp = "SET #status = :s")
#set($exprValues = {})
$util.qr($exprValues.put(":s", $util.dynamodb.toDynamoDBJson($ctx.args.input.status == "APPROVED" ? "CONFIRMED" : "REVERSED")))
#if($approved)
  #set($updateExp = $updateExp + ", receiptNo = if_not_exists(receiptNo, :rno)")
  $util.qr($exprValues.put(":rno", $util.dynamodb.toDynamoDBJson("RCPT-" + $ctx.stash.receiptSeq)))
#end
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.stash.paymentTxnId)
  },
  "update": {
    "expression": "$updateExp",
    "expressionNames": { "#status": "status" },
    "expressionValues": $util.toJson($exprValues)
  },
  "returnValues": "ALL_NEW"
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    const auditManualPaymentReviewFn = new appsync.AppsyncFunction(
      this,
      'AuditManualPaymentReviewFn',
      {
        name: `${appsyncFunctionNamePrefix}_auditManualPaymentReview`,
        api,
        dataSource: ds.auditEvents,
        requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
  #set($approved = $ctx.args.input.status == "APPROVED")
  #set($action = $approved ? "MANUAL_PAYMENT_APPROVED" : "MANUAL_PAYMENT_REJECTED")
  {
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
      "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
      "id": $util.dynamodb.toDynamoDBJson($util.autoId())
    },
    "attributeValues": {
      "actorUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.reviewerUserId),
      "action": $util.dynamodb.toDynamoDBJson($action),
      "entityType": $util.dynamodb.toDynamoDBJson("PaymentTransaction"),
      "entityId": $util.dynamodb.toDynamoDBJson($ctx.prev.result.id),
      "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson({
        "paymentTxnId": $ctx.prev.result.id,
        "proofId": $ctx.args.input.proofId,
        "status": $ctx.prev.result.status,
        "receiptNo": $ctx.prev.result.receiptNo,
        "reviewerUserId": $ctx.args.input.reviewerUserId,
        "notes": $ctx.args.input.notes
      })),
      "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
      }
    );

    const emitManualPaymentEventFn = new appsync.AppsyncFunction(this, 'EmitManualPaymentEventFn', {
      name: `${appsyncFunctionNamePrefix}_emitManualPaymentEvent`,
      api,
      dataSource: ds.eventPublisher,
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "detailType": "payment.confirmed",
    "source": "classpoint.payments",
    "detail": {
      "schoolId": $util.toJson($ctx.args.input.schoolId),
      "invoiceId": $util.toJson($ctx.prev.result.invoiceId),
      "amount": $util.toJson($ctx.prev.result.amount),
      "currency": $util.toJson($ctx.prev.result.currency),
      "paidAt": $util.toJson($ctx.prev.result.paidAt),
      "reference": $util.toJson($ctx.prev.result.reference),
      "receiptNo": $util.toJson($ctx.prev.result.receiptNo),
      "provider": "manual"
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    new appsync.Resolver(this, 'AttachReceiptUrlResolver', {
      api,
      typeName: 'Mutation',
      fieldName: 'attachReceiptUrl',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)'),
      pipelineConfig: [attachReceiptUrlFn, auditReceiptAttachmentFn]
    });

    new appsync.Resolver(this, 'ReviewManualPaymentProofResolver', {
      api,
      typeName: 'Mutation',
      fieldName: 'reviewManualPaymentProof',
      pipelineConfig: [
        reviewManualPaymentProofFn,
        incrementReceiptSeqFn,
        updatePaymentTxnStatusFn,
        auditManualPaymentReviewFn,
        emitManualPaymentEventFn
      ],
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + '{}'),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });
    // Result/announcement emitters removed temporarily to stay under AppSync resource cap.

    // Query resolvers (GSIs)
    ds.schools.createResolver('SchoolBySlug', {
      typeName: 'Query',
      fieldName: 'schoolBySlug',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySlug",
  "query": {
    "expression": "slug = :slug",
    "expressionValues": {
      ":slug": $util.dynamodb.toDynamoDBJson($ctx.args.slug)
    }
  },
  "limit": 1
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
#if($ctx.result.items.size() == 0)
  null
#else
  $util.toJson($ctx.result.items[0])
#end`)
    });

    ds.schoolDomains.createResolver('DomainsBySchool', {
      typeName: 'Query',
      fieldName: 'domainsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchool",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.academicSessions.createResolver('SessionsBySchool', {
      typeName: 'Query',
      fieldName: 'sessionsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(staffGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolSession",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.terms.createResolver('TermsBySession', {
      typeName: 'Query',
      fieldName: 'termsBySession',
      requestMappingTemplate: MappingTemplate.fromString(staffGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySession",
  "query": {
    "expression": "sessionId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.sessionId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 20)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.levels.createResolver('LevelsBySchool', {
      typeName: 'Query',
      fieldName: 'levelsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(staffGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolLevel",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.classYears.createResolver('ClassYearsBySchool', {
      typeName: 'Query',
      fieldName: 'classYearsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(staffGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolClassYear",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.classArms.createResolver('ClassArmsBySchool', {
      typeName: 'Query',
      fieldName: 'classArmsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(staffGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolArm",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.classGroups.createResolver('ClassGroupsBySchool', {
      typeName: 'Query',
      fieldName: 'classGroupsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(staffGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolClassGroup",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.users.createResolver('UsersBySchool', {
      typeName: 'Query',
      fieldName: 'usersBySchool',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
  {
    "version": "2018-05-29",
    "operation": "Query",
    "index": "bySchoolUsers",
    "query": {
      "expression": "schoolId = :sid and userType = :ut",
      "expressionValues": {
        ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
        ":ut": $util.dynamodb.toDynamoDBJson($ctx.args.userType)
      }
    },
    "limit": $util.defaultIfNull($ctx.args.limit, 50)
  }`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.roles.createResolver('RolesBySchool', {
      typeName: 'Query',
      fieldName: 'rolesBySchool',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolRoles",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.schoolProfiles.createResolver('SchoolProfileBySchool', {
      typeName: 'Query',
      fieldName: 'schoolProfileBySchool',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolProfile",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 5)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.schoolHomePageSections.createResolver('HomeSectionsBySchool', {
      typeName: 'Query',
      fieldName: 'homeSectionsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolSections",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 25)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.rolePermissions.createResolver('RolePermissionsByRole', {
      typeName: 'Query',
      fieldName: 'rolePermissionsByRole',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byRole",
  "query": {
    "expression": "roleId = :rid",
    "expressionValues": {
      ":rid": $util.dynamodb.toDynamoDBJson($ctx.args.roleId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.userRoles.createResolver('UserRolesByUser', {
      typeName: 'Query',
      fieldName: 'userRolesByUser',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byUser",
  "query": {
    "expression": "userId = :uid",
    "expressionValues": {
      ":uid": $util.dynamodb.toDynamoDBJson($ctx.args.userId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.auditEvents.createResolver('AuditBySchool', {
      typeName: 'Query',
      fieldName: 'auditBySchool',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
#set($filterExp = "")
#set($exprNames = {})
#set($exprValues = {})
#if($ctx.args.action)
  #set($filterExp = ($filterExp == "" ? "" : $filterExp + " AND ") + "contains(#action, :action)")
  $util.qr($exprNames.put("#action", "action"))
  $util.qr($exprValues.put(":action", $util.dynamodb.toDynamoDBJson($ctx.args.action)))
#end
#if($ctx.args.entityType)
  #set($filterExp = ($filterExp == "" ? "" : $filterExp + " AND ") + "contains(#entityType, :entityType)")
  $util.qr($exprNames.put("#entityType", "entityType"))
  $util.qr($exprValues.put(":entityType", $util.dynamodb.toDynamoDBJson($ctx.args.entityType)))
#end
#if($ctx.args.actorUserId)
  #set($filterExp = ($filterExp == "" ? "" : $filterExp + " AND ") + "contains(#actorUserId, :actorUserId)")
  $util.qr($exprNames.put("#actorUserId", "actorUserId"))
  $util.qr($exprValues.put(":actorUserId", $util.dynamodb.toDynamoDBJson($ctx.args.actorUserId)))
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolAudit",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "scanIndexForward": false,
#if($filterExp != "")
  "filter": {
    "expression": "$filterExp",
    "expressionNames": $util.toJson($exprNames),
    "expressionValues": $util.toJson($exprValues)
  },
#end
#if($ctx.args.nextToken)
  "nextToken": $util.toJson($ctx.args.nextToken),
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
$util.toJson({
  "items": $ctx.result.items,
  "nextToken": $ctx.result.nextToken
})`)
    });

    ds.feeSchedules.createResolver('FeeSchedulesByTerm', {
      typeName: 'Query',
      fieldName: 'feeSchedulesByTerm',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byTermFeeSchedule",
  "query": {
    "expression": "termId = :tid and classYearId = :cyid",
    "expressionValues": {
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.termId),
      ":cyid": $util.dynamodb.toDynamoDBJson($ctx.args.classYearId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.feeScheduleLines.createResolver('FeeScheduleLinesBySchedule', {
      typeName: 'Query',
      fieldName: 'feeScheduleLinesBySchedule',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
#set($schoolId = $util.defaultIfNull($tenantSchool, ""))
#if(!$schoolId)
  #set($schoolId = "noop")
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($schoolId)
    }
  },
  "filter": {
    "expression": "feeScheduleId = :fid",
    "expressionValues": {
      ":fid": $util.dynamodb.toDynamoDBJson($ctx.args.feeScheduleId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.invoices.createResolver('InvoicesByStudent', {
      typeName: 'Query',
      fieldName: 'invoicesByStudent',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byStudentInvoice",
  "query": {
    "expression": "studentId = :sid and termId = :tid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.studentId),
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.termId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 20)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.invoices.createResolver('InvoicesByTermClassGroup', {
      typeName: 'Query',
      fieldName: 'invoicesByTermClassGroup',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byTermClassGroup",
  "query": {
    "expression": "termId = :tid and classGroupId = :cg",
    "expressionValues": {
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.termId),
      ":cg": $util.dynamodb.toDynamoDBJson($ctx.args.classGroupId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.invoices.createResolver('InvoiceByNumber', {
      typeName: 'Query',
      fieldName: 'invoiceByNumber',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolInvoiceNo",
  "query": {
    "expression": "schoolId = :sid and invoiceNo = :inv",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
      ":inv": $util.dynamodb.toDynamoDBJson($ctx.args.invoiceNo)
    }
  },
  "limit": 1
}`),
      responseMappingTemplate: MappingTemplate.fromString(`
#if($ctx.result.items.size() == 0)
  null
#else
  $util.toJson($ctx.result.items[0])
#end`)
    });

    ds.invoices.createResolver('InvoiceById', {
      typeName: 'Query',
      fieldName: 'invoiceById',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.invoices.createResolver('DefaultersByClass', {
      typeName: 'Query',
      fieldName: 'defaultersByClass',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
#set($minDays = $util.defaultIfNull($ctx.args.minDaysOverdue, 0))
#set($cutoffEpoch = $util.time.nowEpochMilliSeconds() - ($minDays * 86400000))
#set($dueCutoff = $util.time.epochMilliSecondsToISO8601($cutoffEpoch))
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byTermClassGroup",
  "query": {
    "expression": "termId = :tid AND classGroupId = :cg",
    "expressionValues": {
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.termId),
      ":cg": $util.dynamodb.toDynamoDBJson($ctx.args.classGroupId)
    }
  },
#set($filterExpression = "amountDue >= :minDue AND dueAt <= :dueCutoff")
#set($filterValues = {
  ":minDue": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.minAmountDue, 0)),
  ":dueCutoff": $util.dynamodb.toDynamoDBJson($dueCutoff)
})
#if($tenantSchool)
  #set($filterExpression = "schoolId = :tsid AND " + $filterExpression)
  $util.qr($filterValues.put(":tsid", $util.dynamodb.toDynamoDBJson($tenantSchool)))
#end
  "filter": {
    "expression": "$filterExpression",
    "expressionValues": $util.toJson($filterValues)
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.paymentIntents.createResolver('PaymentIntentsByInvoice', {
      typeName: 'Query',
      fieldName: 'paymentIntentsByInvoice',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byInvoiceIntent",
  "query": {
    "expression": "invoiceId = :iid",
    "expressionValues": {
      ":iid": $util.dynamodb.toDynamoDBJson($ctx.args.invoiceId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 20)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.paymentTransactions.createResolver('PaymentsByInvoice', {
      typeName: 'Query',
      fieldName: 'paymentsByInvoice',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byInvoicePayment",
  "query": {
    "expression": "invoiceId = :iid",
    "expressionValues": {
      ":iid": $util.dynamodb.toDynamoDBJson($ctx.args.invoiceId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.paymentTransactions.createResolver('PaymentsBySchool', {
      typeName: 'Query',
      fieldName: 'paymentsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.receipts.createResolver('ReceiptsByInvoice', {
      typeName: 'Query',
      fieldName: 'receiptsByInvoice',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byInvoiceReceipt",
  "query": {
    "expression": "invoiceId = :iid",
    "expressionValues": {
      ":iid": $util.dynamodb.toDynamoDBJson($ctx.args.invoiceId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 20)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.receipts.createResolver('ReceiptByNumber', {
      typeName: 'Query',
      fieldName: 'receiptByNumber',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.receiptNo)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.announcements.createResolver('AnnouncementsBySchool', {
      typeName: 'Query',
      fieldName: 'announcementsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolAnnouncements",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.calendarEvents.createResolver('EventsBySchool', {
      typeName: 'Query',
      fieldName: 'eventsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolEvents",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.students.createResolver('StudentsBySchool', {
      typeName: 'Query',
      fieldName: 'studentsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(staffGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolStudents",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.importJobs.createResolver('ImportJobsBySchool', {
      typeName: 'Query',
      fieldName: 'importJobsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(importsGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolImportJob",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.parents.createResolver('ParentsBySchool', {
      typeName: 'Query',
      fieldName: 'parentsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(staffGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolParents",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.receipts.createResolver('ReceiptsBySchool', {
      typeName: 'Query',
      fieldName: 'receiptsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.supportTickets.createResolver('SupportTicketsByParent', {
      typeName: 'Query',
      fieldName: 'supportTicketsByParent',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byParentSupport",
  "query": {
    "expression": "parentId = :pid",
    "expressionValues": {
      ":pid": $util.dynamodb.toDynamoDBJson($ctx.args.parentId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.manualPaymentProofs.createResolver('ManualPaymentProofsBySchool', {
      typeName: 'Query',
      fieldName: 'manualPaymentProofsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.manualPaymentProofs.createResolver('ProofsByPayment', {
      typeName: 'Query',
      fieldName: 'proofsByPayment',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byPaymentTxn",
  "query": {
    "expression": "paymentTxnId = :pid",
    "expressionValues": {
      ":pid": $util.dynamodb.toDynamoDBJson($ctx.args.paymentTxnId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.supportTickets.createResolver('SupportTicketsBySchool', {
      typeName: 'Query',
      fieldName: 'supportTicketsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(adminGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolSupport",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.supportTickets.createResolver('SupportTicketById', {
      typeName: 'Query',
      fieldName: 'supportTicketById',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.supportTicketMessages.createResolver('SupportTicketMessagesByTicket', {
      typeName: 'Query',
      fieldName: 'supportTicketMessagesByTicket',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byTicket",
  "query": {
    "expression": "ticketId = :tid",
    "expressionValues": {
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.ticketId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.studentParentLinks.createResolver('ParentsByStudent', {
      typeName: 'Query',
      fieldName: 'parentsByStudent',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byStudent",
  "query": {
    "expression": "studentId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.studentId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.studentParentLinks.createResolver('StudentsByParent', {
      typeName: 'Query',
      fieldName: 'studentsByParent',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byParent",
  "query": {
    "expression": "parentId = :pid",
    "expressionValues": {
      ":pid": $util.dynamodb.toDynamoDBJson($ctx.args.parentId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.invoiceLines.createResolver('InvoiceLinesByInvoice', {
      typeName: 'Query',
      fieldName: 'invoiceLinesByInvoice',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byInvoice",
  "query": {
    "expression": "invoiceId = :iid",
    "expressionValues": {
      ":iid": $util.dynamodb.toDynamoDBJson($ctx.args.invoiceId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.invoiceLines.createResolver('InvoiceLinesResolver', {
      typeName: 'Invoice',
      fieldName: 'lines',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byInvoice",
  "query": {
    "expression": "invoiceId = :iid",
    "expressionValues": {
      ":iid": $util.dynamodb.toDynamoDBJson($ctx.source.id)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": 200
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.paymentTransactions.createResolver('InvoicePaymentsResolver', {
      typeName: 'Invoice',
      fieldName: 'payments',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byInvoicePayment",
  "query": {
    "expression": "invoiceId = :iid",
    "expressionValues": {
      ":iid": $util.dynamodb.toDynamoDBJson($ctx.source.id)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": 50
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.feeAdjustments.createResolver('InvoiceAdjustmentsResolver', {
      typeName: 'Invoice',
      fieldName: 'adjustments',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byInvoiceAdjustment",
  "query": {
    "expression": "invoiceId = :iid",
    "expressionValues": {
      ":iid": $util.dynamodb.toDynamoDBJson($ctx.source.id)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": 50
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.enrollments.createResolver('EnrollmentsByStudent', {
      typeName: 'Query',
      fieldName: 'enrollmentsByStudent',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byStudentEnrollment",
  "query": {
    "expression": "studentId = :stid",
    "expressionValues": {
      ":stid": $util.dynamodb.toDynamoDBJson($ctx.args.studentId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.feeItems.createResolver('FeeItemsBySchool', {
      typeName: 'Query',
      fieldName: 'feeItemsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(billingGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolFeeItem",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.messageTemplates.createResolver('TemplatesBySchool', {
      typeName: 'Query',
      fieldName: 'templatesBySchool',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolTemplate",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.messageTemplates.createResolver('CreateMessageTemplate', {
      typeName: 'Mutation',
      fieldName: 'createMessageTemplate',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "channel": $util.dynamodb.toDynamoDBJson($ctx.args.input.channel),
    "subject": $util.dynamodb.toDynamoDBJson($ctx.args.input.subject),
    "body": $util.dynamodb.toDynamoDBJson($ctx.args.input.body),
    "variablesJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.variablesJson),
    "isActive": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.isActive, true)),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  },
  "condition": {
    "expression": "attribute_not_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.messageTemplates.createResolver('UpdateMessageTemplate', {
      typeName: 'Mutation',
      fieldName: 'updateMessageTemplate',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #type = if_not_exists(#type, :type0), #channel = if_not_exists(#channel, :channel0), #subject = if_not_exists(#subject, :subject0), #body = if_not_exists(#body, :body0), #vars = if_not_exists(#vars, :vars0), #active = if_not_exists(#active, :active0), #updatedAt = :now",
    "expressionNames": {
      "#type": "type",
      "#channel": "channel",
      "#subject": "subject",
      "#body": "body",
      "#vars": "variablesJson",
      "#active": "isActive",
      "#updatedAt": "updatedAt"
    },
    "expressionValues": {
      ":type0": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
      ":channel0": $util.dynamodb.toDynamoDBJson($ctx.args.input.channel),
      ":subject0": $util.dynamodb.toDynamoDBJson($ctx.args.input.subject),
      ":body0": $util.dynamodb.toDynamoDBJson($ctx.args.input.body),
      ":vars0": $util.dynamodb.toDynamoDBJson($ctx.args.input.variablesJson),
      ":active0": $util.dynamodb.toDynamoDBJson($ctx.args.input.isActive),
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.messageTemplates.createResolver('DeleteMessageTemplate', {
      typeName: 'Mutation',
      fieldName: 'deleteMessageTemplate',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson(true)')
    });

    ds.messageCampaigns.createResolver('CampaignsBySchool', {
      typeName: 'Query',
      fieldName: 'campaignsBySchool',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolCampaign",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.messageCampaigns.createResolver('CreateMessageCampaign', {
      typeName: 'Mutation',
      fieldName: 'createMessageCampaign',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "channel": $util.dynamodb.toDynamoDBJson($ctx.args.input.channel),
    "templateId": $util.dynamodb.toDynamoDBJson($ctx.args.input.templateId),
    "createdByUserId": $util.dynamodb.toDynamoDBJson($ctx.args.input.createdByUserId),
    "status": $util.dynamodb.toDynamoDBJson("DRAFT"),
    "scheduledAt": $util.dynamodb.toDynamoDBJson($ctx.args.input.scheduledAt),
    "audienceJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.audienceJson),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  },
  "condition": {
    "expression": "attribute_not_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.messageCampaigns.createResolver('UpdateMessageCampaignStatus', {
      typeName: 'Mutation',
      fieldName: 'updateMessageCampaignStatus',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  },
  "update": {
    "expression": "SET #status = :s, #scheduledAt = if_not_exists(#scheduledAt, :sched)",
    "expressionNames": {
      "#status": "status",
      "#scheduledAt": "scheduledAt"
    },
    "expressionValues": {
      ":s": $util.dynamodb.toDynamoDBJson($ctx.args.status),
      ":sched": $util.dynamodb.toDynamoDBJson($ctx.args.scheduledAt)
    }
  }
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
    });

    ds.messageRecipients.createResolver('RecipientsByCampaign', {
      typeName: 'Query',
      fieldName: 'recipientsByCampaign',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byCampaign",
  "query": {
    "expression": "campaignId = :cid",
    "expressionValues": {
      ":cid": $util.dynamodb.toDynamoDBJson($ctx.args.campaignId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });
    ds.enrollments.createResolver('EnrollmentsByTermClassGroup', {
      typeName: 'Query',
      fieldName: 'enrollmentsByTermClassGroup',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byTermEnrollment",
  "query": {
    "expression": "termId = :tid and classGroupId = :cid",
    "expressionValues": {
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.termId),
      ":cid": $util.dynamodb.toDynamoDBJson($ctx.args.classGroupId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.messageRecipients.createResolver('RecipientsByInvoice', {
      typeName: 'Query',
      fieldName: 'recipientsByInvoice',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byInvoiceRecipient",
  "query": {
    "expression": "invoiceId = :iid",
    "expressionValues": {
      ":iid": $util.dynamodb.toDynamoDBJson($ctx.args.invoiceId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    ds.resultReleasePolicies.createResolver('ReleasePolicyBySchool', {
      typeName: 'Query',
      fieldName: 'releasePolicyBySchool',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolReleasePolicy",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 1)
}`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result.items)')
    });

    const resultReleasePolicyFn = new appsync.AppsyncFunction(this, 'ResultReleasePolicyFn', {
      name: `${appsyncFunctionNamePrefix}_resultReleasePolicy`,
      api,
      dataSource: ds.resultReleasePolicies,
      requestMappingTemplate: MappingTemplate.fromString(`
#set($schoolId = $ctx.stash.tenantSchool)
#if(!$schoolId)
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson("noop"),
    "id": $util.dynamodb.toDynamoDBJson("noop")
  }
}
#else
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolReleasePolicy",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($schoolId)
    }
  },
  "limit": 1
}
#end
`),
      responseMappingTemplate: MappingTemplate.fromString(`
#set($policy = "")
#if($ctx.result.items && $ctx.result.items.size() > 0)
  #set($policy = $ctx.result.items[0])
#elseif($ctx.result)
  #set($policy = $ctx.result)
#end
$util.qr($ctx.stash.put("resultPolicy", $policy))
$util.toJson($ctx.result)
`)
    });

    const resultReleaseInvoicesFn = new appsync.AppsyncFunction(this, 'ResultReleaseInvoicesFn', {
      name: `${appsyncFunctionNamePrefix}_resultReleaseInvoices`,
      api,
      dataSource: ds.invoices,
      requestMappingTemplate: MappingTemplate.fromString(`
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byStudentInvoice",
  "query": {
    "expression": "studentId = :sid and termId = :tid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.studentId),
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.termId)
    }
  },
#if($ctx.stash.tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($ctx.stash.tenantSchool)
    }
  },
#end
  "limit": 50
}
`),
      responseMappingTemplate: MappingTemplate.fromString(`
$util.qr($ctx.stash.put("gateInvoices", $ctx.result.items))
$util.toJson($ctx.result)
`)
    });

    const resultReleaseGateFn = new appsync.AppsyncFunction(this, 'ResultReleaseGateFn', {
      name: `${appsyncFunctionNamePrefix}_resultReleaseGate`,
      api,
      dataSource: noneDs,
      requestMappingTemplate: MappingTemplate.fromString(`
#set($allowed = true)
#set($policy = $ctx.stash.resultPolicy)
#set($tenantSchool = $ctx.stash.tenantSchool)
#if(!$tenantSchool)
  $util.qr($ctx.stash.put("resultAllowed", true))
  $util.qr($ctx.stash.put("resultGate", {
    "enabled": false,
    "message": "Results are locked until the minimum fee payment is met."
  }))
  {}
#else
  #set($invoices = $util.defaultIfNull($ctx.stash.gateInvoices, []))
  #set($enabled = false)
  #if($policy && $policy.isEnabled)
    #set($enabled = true)
  #end
  #set($required = 0)
  #set($paid = 0)
  #foreach($inv in $invoices)
    #set($required = $required + $util.defaultIfNull($inv.requiredSubtotal, 0))
    #set($paid = $paid + $util.defaultIfNull($inv.amountPaid, 0))
  #end
  #set($minPercent = 0)
  #if($enabled)
    #set($minPercent = $util.defaultIfNull($policy.minimumPaymentPercent, 0))
  #end
  #set($percent = 0)
  #if($required > 0)
    #set($percent = ($paid * 100.0) / $required)
  #end
  #if($enabled && $required > 0 && $percent < $minPercent)
    #set($allowed = false)
  #end
  #set($message = "Results are locked until the minimum fee payment is met.")
  #if($policy && $policy.messageToParent)
    #set($message = $policy.messageToParent)
  #end
  $util.qr($ctx.stash.put("resultAllowed", $allowed))
  $util.qr($ctx.stash.put("resultGate", {
    "enabled": $enabled,
    "requiredSubtotal": $required,
    "amountPaid": $paid,
    "percentPaid": $percent,
    "minimumPercent": $minPercent,
    "message": $message
  }))
  {}
#end
`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson({})')
    });

    const auditResultReleaseFn = new appsync.AppsyncFunction(this, 'AuditResultReleaseFn', {
      name: `${appsyncFunctionNamePrefix}_auditResultRelease`,
      api,
      dataSource: ds.auditEvents,
      requestMappingTemplate: MappingTemplate.fromString(`
#set($schoolId = $util.defaultIfNull($ctx.stash.tenantSchool, "noop"))
#if($ctx.stash.resultAllowed)
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($schoolId),
    "id": $util.dynamodb.toDynamoDBJson("noop")
  }
}
#else
#set($gate = $ctx.stash.resultGate)
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "actorUserId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.identity.sub, "system")),
    "action": $util.dynamodb.toDynamoDBJson("RESULT_VIEW_BLOCKED"),
    "entityType": $util.dynamodb.toDynamoDBJson("ReportCard"),
    "entityId": $util.dynamodb.toDynamoDBJson($ctx.args.studentId),
    "afterJson": $util.dynamodb.toDynamoDBJson($util.toJson({
      "studentId": $ctx.args.studentId,
      "termId": $ctx.args.termId,
      "amountPaid": $gate.amountPaid,
      "requiredSubtotal": $gate.requiredSubtotal,
      "percentPaid": $gate.percentPaid,
      "minimumPercent": $gate.minimumPercent,
      "message": $gate.message
    })),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}
#end
`),
      responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.prev.result)')
    });

    const reportCardsByStudentTermFn = new appsync.AppsyncFunction(
      this,
      'ReportCardsByStudentTermFn',
      {
        name: `${appsyncFunctionNamePrefix}_reportCardsByStudentTerm`,
        api,
        dataSource: ds.reportCards,
        requestMappingTemplate: MappingTemplate.fromString(`
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byStudentTermReport",
  "query": {
    "expression": "studentId = :sid and termId = :tid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.studentId),
      ":tid": $util.dynamodb.toDynamoDBJson($ctx.args.termId)
    }
  },
#if($ctx.stash.tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($ctx.stash.tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 10)
}`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($ctx.result)')
      }
    );

    const reportCardsByStudentTermResolver = new appsync.Resolver(this, 'ReportCardsByStudentTerm', {
      api,
      typeName: 'Query',
      fieldName: 'reportCardsByStudentTerm',
      requestMappingTemplate: MappingTemplate.fromString(tenantGuard + `
#set($tenantSchool = "")
#if($ctx.identity && $ctx.identity.claims)
  #set($tenantSchool = $ctx.identity.claims.get("custom:schoolId"))
#end
$util.qr($ctx.stash.put("tenantSchool", $tenantSchool))
{}
`),
      responseMappingTemplate: MappingTemplate.fromString(`
#if(!$ctx.stash.resultAllowed)
  $util.error($ctx.stash.resultGate.message, "RESULTS_BLOCKED")
#end
$util.toJson($ctx.prev.result.items)
`),
      pipelineConfig: [
        resultReleasePolicyFn,
        resultReleaseInvoicesFn,
        resultReleaseGateFn,
        auditResultReleaseFn,
        reportCardsByStudentTermFn
      ]
    });
    (reportCardsByStudentTermResolver.node.defaultChild as appsync.CfnResolver).overrideLogicalId(
      'GraphqlApiReportCardsByStudentTerm7AC94582'
    );

    // Keep references for future wiring to avoid unused warnings.
    void uploadsBucket;
    void userPoolClient;
    void api;
    void schoolsTable;
    void schoolDomainsTable;
    void usersTable;
    void rolesTable;
    void permissionsTable;
    void rolePermissionsTable;
    void userRolesTable;
    void auditEventsTable;
    void schoolProfilesTable;
    void schoolHomePageSectionsTable;
    void announcementsTable;
    void calendarEventsTable;
    void academicSessionsTable;
    void termsTable;
    void levelsTable;
    void classYearsTable;
    void classArmsTable;
    void classGroupsTable;
    void subjectsTable;
    void classSubjectsTable;
    void studentsTable;
    void parentsTable;
    void studentParentLinksTable;
    void enrollmentsTable;
    void feeItemsTable;
    void feeSchedulesTable;
    void feeScheduleLinesTable;
    void discountRulesTable;
    void invoicesTable;
    void invoiceLinesTable;
    void paymentIntentsTable;
    void paymentTransactionsTable;
    void receiptsTable;
    void paymentAllocationsTable;
    void receiptCountersTable;
    void manualPaymentProofsTable;
    void feeAdjustmentsTable;
    void installmentPlansTable;
    void installmentsTable;
    void messageTemplatesTable;
    void messageCampaignsTable;
    void messageRecipientsTable;
    void supportTicketsTable;
    void supportTicketMessagesTable;
    void attendanceSessionsTable;
    void attendanceEntriesTable;
    void assessmentPoliciesTable;
    void assessmentsTable;
    void scoreEntriesTable;
    void reportCardsTable;
    void resultReleasePoliciesTable;
    void featureFlagsTable;
    void plansTable;
    void addOnsTable;
    void schoolSubscriptionsTable;
    void schoolSubscriptionAddOnsTable;
    void providerConfigsTable;
    void dataKey;
    void assetsKey;
    void ds;
    void noneDs;

    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
      description: 'Bucket for uploads/proofs/receipts'
    });

    new cdk.CfnOutput(this, 'InvoicesTableName', {
      value: invoicesTable.tableName,
      description: 'Invoices table name'
    });

    new cdk.CfnOutput(this, 'EnrollmentsTableName', {
      value: enrollmentsTable.tableName,
      description: 'Enrollments table name'
    });

    new cdk.CfnOutput(this, 'GraphqlApiUrl', {
      value: api.graphqlUrl,
      description: 'AppSync GraphQL endpoint'
    });
    new cdk.CfnOutput(this, 'GraphqlPublicApiKey', {
      value: publicApiKey.attrApiKey || 'pending',
      description: 'AppSync API key for public reads (landing pages)'
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'AwsRegion', {
      value: this.region,
      description: 'AWS region for app configuration'
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge bus for domain events'
    });
    // Pipeline: publish announcement -> update publishedAt -> emit event
    // Announcement/result publish pipelines removed temporarily to stay under AppSync resource cap.
  }
}

