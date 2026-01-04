import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as path from 'path';

export interface ClasspointServicesStackProps extends StackProps {
  envName: string;
  eventBus: events.IEventBus;
  uploadsBucket: s3.IBucket;
  awsSdkLayer: lambda.ILayerVersion;
  userPoolId: string;
  tables: {
    users: dynamodb.ITable;
    invoices: dynamodb.ITable;
    invoiceLines: dynamodb.ITable;
    feeSchedules: dynamodb.ITable;
    feeScheduleLines: dynamodb.ITable;
    paymentTransactions: dynamodb.ITable;
    paymentIntents: dynamodb.ITable;
    feeAdjustments: dynamodb.ITable;
    installmentPlans: dynamodb.ITable;
    installments: dynamodb.ITable;
    students: dynamodb.ITable;
    enrollments: dynamodb.ITable;
    discountRules: dynamodb.ITable;
    feeItems: dynamodb.ITable;
    messageTemplates: dynamodb.ITable;
    messageCampaigns: dynamodb.ITable;
    messageRecipients: dynamodb.ITable;
    parents: dynamodb.ITable;
    studentParentLinks: dynamodb.ITable;
    providerConfigs: dynamodb.ITable;
    featureFlags: dynamodb.ITable;
    auditEvents: dynamodb.ITable;
    importJobs: dynamodb.ITable;
    classGroups: dynamodb.ITable;
    classYears: dynamodb.ITable;
    classArms: dynamodb.ITable;
    levels: dynamodb.ITable;
    academicSessions: dynamodb.ITable;
    terms: dynamodb.ITable;
    receipts: dynamodb.ITable;
    receiptCounters: dynamodb.ITable;
  };
}

export class ClasspointServicesStack extends Stack {
  constructor(scope: Construct, id: string, props: ClasspointServicesStackProps) {
    super(scope, id, props);

    const { envName, eventBus, uploadsBucket, awsSdkLayer, tables, userPoolId } = props;
    const rootDomain = this.node.tryGetContext('rootDomain') as string | undefined;
    const hostedZoneId = this.node.tryGetContext('hostedZoneId') as string | undefined;
    Tags.of(this).add('environment', envName);

    const removalPolicy = envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;
    const enableStaticFrontend = (this.node.tryGetContext('frontendMode') ?? 'edge') === 'static';
    let logsBucket: s3.Bucket | undefined;
    let frontendBucket: s3.Bucket | undefined;
    let distribution: cloudfront.Distribution | undefined;
    let publicCanary: synthetics.Canary | undefined;

    if (enableStaticFrontend) {
      logsBucket = new s3.Bucket(this, 'CloudFrontLogs', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
        removalPolicy,
        autoDeleteObjects: envName !== 'prod',
        lifecycleRules: [
          {
            expiration: cdk.Duration.days(90),
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(7)
          }
        ]
      });
      logsBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AllowCloudFrontLogs',
          principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
          actions: ['s3:PutObject'],
          resources: [`${logsBucket.bucketArn}/*`],
          conditions: {
            StringEquals: {
              's3:x-amz-acl': 'bucket-owner-full-control'
            }
          }
        })
      );
      logsBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AllowCloudFrontLogsAclRead',
          principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
          actions: ['s3:GetBucketAcl'],
          resources: [logsBucket.bucketArn]
        })
      );

      frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        removalPolicy,
        autoDeleteObjects: envName !== 'prod',
        versioned: true,
        publicReadAccess: false
      });

      // Edge (CloudFront) with WAF.
      const enableWaf = true;
      const wafAcl = enableWaf
        ? new wafv2.CfnWebACL(this, 'WafAcl', {
            defaultAction: { allow: {} },
            scope: 'CLOUDFRONT',
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `classpoint-${envName}-waf`,
              sampledRequestsEnabled: true
            },
            rules:
              envName === 'prod'
                ? [
                    {
                      name: 'AWS-AWSManagedRulesCommonRuleSet',
                      priority: 1,
                      overrideAction: { none: {} },
                      statement: {
                        managedRuleGroupStatement: {
                          vendorName: 'AWS',
                          name: 'AWSManagedRulesCommonRuleSet'
                        }
                      },
                      visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: `waf-common-${envName}`,
                        sampledRequestsEnabled: true
                      }
                    },
                    {
                      name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
                      priority: 2,
                      overrideAction: { none: {} },
                      statement: {
                        managedRuleGroupStatement: {
                          vendorName: 'AWS',
                          name: 'AWSManagedRulesKnownBadInputsRuleSet'
                        }
                      },
                      visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: `waf-badinputs-${envName}`,
                        sampledRequestsEnabled: true
                      }
                    },
                    {
                      name: 'AWS-AWSManagedRulesAnonymousIpList',
                      priority: 3,
                      overrideAction: { none: {} },
                      statement: {
                        managedRuleGroupStatement: {
                          vendorName: 'AWS',
                          name: 'AWSManagedRulesAnonymousIpList'
                        }
                      },
                      visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: `waf-anonip-${envName}`,
                        sampledRequestsEnabled: true
                      }
                    }
                  ]
                : [
                    {
                      name: 'AWS-AWSManagedRulesCommonRuleSet',
                      priority: 1,
                      overrideAction: { none: {} },
                      statement: {
                        managedRuleGroupStatement: {
                          vendorName: 'AWS',
                          name: 'AWSManagedRulesCommonRuleSet'
                        }
                      },
                      visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: `waf-common-${envName}`,
                        sampledRequestsEnabled: true
                      }
                    }
                  ]
          })
        : undefined;

      const rewriteFunction = new cloudfront.Function(this, 'RewriteHtmlPaths', {
        code: cloudfront.FunctionCode.fromInline(`
  function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri === '/') {
      request.uri = '/index.html';
      return request;
    }

    if (uri.endsWith('/')) {
      request.uri = uri.slice(0, -1) + '.html';
      return request;
    }

    if (uri.indexOf('.') === -1) {
      request.uri = uri + '.html';
    }

    return request;
  }
        `)
      });

      const securityHeaders = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            contentSecurityPolicy:
              "default-src 'self'; base-uri 'self'; form-action 'self' https://auth.classpoint.ng; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https://auth.classpoint.ng https://cognito-idp.us-east-1.amazonaws.com https://v7j6fbfsgzadvgqcovkbebi45u.appsync-api.us-east-1.amazonaws.com https://bon7az6mbi.execute-api.us-east-1.amazonaws.com",
            override: true
          },
          contentTypeOptions: { override: true },
          frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
          referrerPolicy: {
            referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER,
            override: true
          },
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.days(365),
            includeSubdomains: true,
            preload: true,
            override: true
          },
          xssProtection: { protection: true, modeBlock: true, override: true }
        }
      });

      const htmlCachePolicy = new cloudfront.CachePolicy(this, 'HtmlCachePolicy', {
        minTtl: cdk.Duration.seconds(0),
        defaultTtl: cdk.Duration.minutes(5),
        maxTtl: cdk.Duration.hours(1),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true
      });

      const staticCachePolicy = new cloudfront.CachePolicy(this, 'StaticCachePolicy', {
        minTtl: cdk.Duration.days(1),
        defaultTtl: cdk.Duration.days(30),
        maxTtl: cdk.Duration.days(365),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true
      });

      const origin = origins.S3BucketOrigin.withOriginAccessIdentity(frontendBucket);

      const hostedZone =
        rootDomain && hostedZoneId
          ? route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
              hostedZoneId,
              zoneName: rootDomain
            })
          : undefined;

      const certificate =
        rootDomain && hostedZone
          ? new acm.DnsValidatedCertificate(this, 'CloudFrontCertificate', {
              domainName: `app.${rootDomain}`,
              subjectAlternativeNames: [`*.${rootDomain}`],
              hostedZone,
              region: 'us-east-1'
            })
          : undefined;
      const domainNames = certificate ? [`app.${rootDomain}`, `*.${rootDomain}`] : undefined;

      distribution = new cloudfront.Distribution(this, 'CloudFront', {
        defaultBehavior: {
          origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: htmlCachePolicy,
          responseHeadersPolicy: securityHeaders,
          functionAssociations: [
            {
              function: rewriteFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
            }
          ]
        },
        defaultRootObject: 'index.html',
        webAclId: wafAcl?.attrArn,
        enableLogging: true,
        logBucket: logsBucket,
        logFilePrefix: `${envName}/cloudfront/`,
        domainNames,
        certificate
      });

      distribution.addBehavior('/_next/*', origin, {
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: securityHeaders
      });

      if (hostedZone && rootDomain) {
        const target = route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution));
        new route53.ARecord(this, 'AppDomainAlias', {
          zone: hostedZone,
          recordName: 'app',
          target
        });
        new route53.ARecord(this, 'WildcardDomainAlias', {
          zone: hostedZone,
          recordName: '*',
          target
        });
      }

      distribution.addBehavior('/_next/static/*', origin, {
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: staticCachePolicy,
        responseHeadersPolicy: securityHeaders
      });

      const publicUrl = `https://${distribution.domainName}/`;

      publicCanary = new synthetics.Canary(this, 'PublicHomeCanary', {
        canaryName: `classpoint-${envName}-public`,
        schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
        runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_6_2,
        test: synthetics.Test.custom({
          handler: 'index.handler',
          code: synthetics.Code.fromInline(`
  const synthetics = require('Synthetics');
  const log = require('SyntheticsLogger');

  const url = '${publicUrl}';

  const loadPage = async () => {
    const page = await synthetics.getPage();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = response ? response.status() : 0;
    if (status < 200 || status >= 400) {
      throw new Error('Unexpected status code: ' + status);
    }
    await page.close();
  };

  exports.handler = async () => {
    log.info('Checking ' + url);
    await loadPage();
  };
          `)
        })
      });
      }

    const makeQueue = (id: string, dlqName: string, visibilitySeconds = 300) => {
      const deadLetterQueue = new sqs.Queue(this, dlqName, {
        retentionPeriod: cdk.Duration.days(14),
        encryption: sqs.QueueEncryption.KMS_MANAGED
      });
      const queue = new sqs.Queue(this, id, {
        visibilityTimeout: cdk.Duration.seconds(visibilitySeconds),
        deadLetterQueue: {
          maxReceiveCount: 3,
          queue: deadLetterQueue
        },
        encryption: sqs.QueueEncryption.KMS_MANAGED
      });
      return { queue, deadLetterQueue };
    };

    const invoicingQueues = makeQueue('InvoicingQueue', 'InvoicingDLQ', 300);
    const messagingQueues = makeQueue('MessagingQueue', 'MessagingDLQ', 120);
    const importQueues = makeQueue('ImportQueue', 'ImportDLQ', 300);
    const receiptsQueues = makeQueue('ReceiptsQueue', 'ReceiptsDLQ', 120);

    // EventBridge rules to route domain events to queues (extend as needed)
    new events.Rule(this, 'PaymentConfirmedRule', {
      eventBus,
      eventPattern: {
        source: ['classpoint.payments'],
        detailType: ['payment.confirmed']
      },
      targets: [new eventTargets.SqsQueue(messagingQueues.queue)]
    });

    new events.Rule(this, 'PaymentConfirmedInvoicingRule', {
      eventBus,
      eventPattern: {
        source: ['classpoint.payments'],
        detailType: ['payment.confirmed']
      },
      targets: [new eventTargets.SqsQueue(invoicingQueues.queue)]
    });

    new events.Rule(this, 'PaymentConfirmedReceiptsRule', {
      eventBus,
      eventPattern: {
        source: ['classpoint.payments'],
        detailType: ['payment.confirmed']
      },
      targets: [new eventTargets.SqsQueue(receiptsQueues.queue)]
    });

    new events.Rule(this, 'InvoiceGeneratedRule', {
      eventBus,
      eventPattern: {
        source: ['classpoint.billing'],
        detailType: ['invoice.generated']
      },
      targets: [new eventTargets.SqsQueue(invoicingQueues.queue)]
    });

    new events.Rule(this, 'MessagingRequestedRule', {
      eventBus,
      eventPattern: {
        source: ['classpoint.messaging'],
        detailType: ['messaging.requested']
      },
      targets: [new eventTargets.SqsQueue(messagingQueues.queue)]
    });

    new events.Rule(this, 'ResultReadyRule', {
      eventBus,
      eventPattern: {
        source: ['classpoint.academics'],
        detailType: ['result.ready']
      },
      targets: [new eventTargets.SqsQueue(messagingQueues.queue)]
    });

    new events.Rule(this, 'AnnouncementPublishedRule', {
      eventBus,
      eventPattern: {
        source: ['classpoint.cms'],
        detailType: ['announcement.published']
      },
      targets: [new eventTargets.SqsQueue(messagingQueues.queue)]
    });


    const makeWorker = (
      id: string,
      entry: string,
      queue: sqs.Queue,
      visibilitySeconds = 300,
      extraEnv: Record<string, string> = {}
    ) => {
      const fn = new lambda.Function(this, id, {
        runtime: lambda.Runtime.NODEJS_18_X,
        layers: [awsSdkLayer],
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'services', 'workers', entry)),
        timeout: cdk.Duration.seconds(visibilitySeconds),
        memorySize: 512,
        environment: {
          EVENT_BUS_NAME: eventBus.eventBusName,
          ...extraEnv
        }
      });
      fn.addEventSource(
        new lambdaEventSources.SqsEventSource(queue, {
          batchSize: 5
        })
      );
      eventBus.grantPutEventsTo(fn);
      return fn;
    };

    const invoicingWorker = makeWorker(
      'InvoicingWorker',
      'invoicing',
      invoicingQueues.queue,
      300,
      {
        INVOICES_TABLE: tables.invoices.tableName,
        INVOICE_LINES_TABLE: tables.invoiceLines.tableName,
        FEE_SCHEDULES_TABLE: tables.feeSchedules.tableName,
        FEE_SCHEDULE_LINES_TABLE: tables.feeScheduleLines.tableName,
        PAYMENT_TRANSACTIONS_TABLE: tables.paymentTransactions.tableName,
        PAYMENT_INTENTS_TABLE: tables.paymentIntents.tableName,
        FEE_ADJUSTMENTS_TABLE: tables.feeAdjustments.tableName,
        INSTALLMENT_PLANS_TABLE: tables.installmentPlans.tableName,
        INSTALLMENTS_TABLE: tables.installments.tableName,
        STUDENTS_TABLE: tables.students.tableName,
        ENROLLMENTS_TABLE: tables.enrollments.tableName,
        DISCOUNT_RULES_TABLE: tables.discountRules.tableName,
        FEE_ITEMS_TABLE: tables.feeItems.tableName
      }
    );

    new events.Rule(this, 'InvoiceOverdueSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      targets: [
        new eventTargets.LambdaFunction(invoicingWorker, {
          event: events.RuleTargetInput.fromObject({
            detailType: 'invoice.overdue.scan',
            source: 'classpoint.billing'
          })
        })
      ]
    });

    const importWorker = makeWorker(
      'ImportWorker',
      'imports',
      importQueues.queue,
      300,
      {
        STUDENTS_TABLE: tables.students.tableName,
        PARENTS_TABLE: tables.parents.tableName,
        STUDENT_PARENT_LINKS_TABLE: tables.studentParentLinks.tableName,
        ENROLLMENTS_TABLE: tables.enrollments.tableName,
        CLASS_GROUPS_TABLE: tables.classGroups.tableName,
        CLASS_YEARS_TABLE: tables.classYears.tableName,
        CLASS_ARMS_TABLE: tables.classArms.tableName,
        LEVELS_TABLE: tables.levels.tableName,
        SESSIONS_TABLE: tables.academicSessions.tableName,
        TERMS_TABLE: tables.terms.tableName,
        AUDIT_EVENTS_TABLE: tables.auditEvents.tableName,
        UPLOADS_BUCKET: uploadsBucket.bucketName
      }
    );

    const receiptsWorker = makeWorker(
      'ReceiptsWorker',
      'receipts',
      receiptsQueues.queue,
      120,
      {
        RECEIPTS_TABLE: tables.receipts.tableName
      }
    );

    const paymentWebhookSecretName = `classpoint/${envName}/payments/webhook`;

    const paymentWebhook = new lambda.Function(this, 'PaymentWebhookHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'services', 'workers', 'payment-webhook')),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName,
        PAYMENT_WEBHOOK_SECRET_NAME: paymentWebhookSecretName,
        PAYMENT_TRANSACTIONS_TABLE: tables.paymentTransactions.tableName,
        INVOICES_TABLE: tables.invoices.tableName,
        RECEIPT_COUNTERS_TABLE: tables.receiptCounters.tableName,
        AUDIT_EVENTS_TABLE: tables.auditEvents.tableName
      }
    });
    eventBus.grantPutEventsTo(paymentWebhook);
    tables.paymentTransactions.grantReadWriteData(paymentWebhook);
    tables.invoices.grantReadWriteData(paymentWebhook);
    tables.receiptCounters.grantReadWriteData(paymentWebhook);
    tables.auditEvents.grantReadWriteData(paymentWebhook);

    // Messaging delivery webhook (Twilio signature verification)
    const messagingWebhook = new lambda.Function(this, 'MessagingWebhookHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'services', 'workers', 'messaging-webhook')),
      timeout: cdk.Duration.seconds(5),
      memorySize: 256,
      environment: {
        MESSAGE_RECIPIENTS_TABLE: tables.messageRecipients.tableName,
        TWILIO_SECRET_NAME: `classpoint/${envName}/providers/twilio`,
        WEBHOOK_BASE_URL: ''
      }
    });
    tables.messageRecipients.grantReadWriteData(messagingWebhook);
    const adminUserProvisioner = new lambda.Function(this, 'AdminUserProvisioner', {
      runtime: lambda.Runtime.NODEJS_18_X,
      layers: [awsSdkLayer],
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', 'services', 'workers', 'admin-user-provision')
      ),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        USER_POOL_ID: userPoolId,
        USERS_TABLE: tables.users.tableName
      }
    });
    adminUserProvisioner.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:GetUser',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminSetUserPassword',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminListGroupsForUser'
        ],
        resources: [`arn:${this.partition}:cognito-idp:${this.region}:${this.account}:userpool/${userPoolId}`]
      })
    );
    tables.users.grantReadWriteData(adminUserProvisioner);
    paymentWebhook.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:classpoint/${envName}/payments/webhook*`
        ]
      })
    );
    messagingWebhook.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:classpoint/${envName}/providers/*`
        ]
      })
    );

    // API Gateway endpoint for payment webhooks (signature validation handled in Lambda)
    const paymentApi = new apigw.RestApi(this, 'WebhookApi', {
      restApiName: `classpoint-payments-${envName}`,
      deployOptions: {
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true
      }
    });
    const paymentsRes = paymentApi.root.addResource('payments');
    const paymentWebhookRes = paymentsRes.addResource('webhook');
    paymentWebhookRes.addMethod('POST', new apigw.LambdaIntegration(paymentWebhook, { proxy: true }));

    const messagingRes = paymentApi.root.addResource('messaging');
    const deliveryRes = messagingRes.addResource('delivery');
    deliveryRes.addMethod('POST', new apigw.LambdaIntegration(messagingWebhook, { proxy: true }));

    const adminRes = paymentApi.root.addResource('admin');
    const usersRes = adminRes.addResource('users');
    usersRes.addMethod('POST', new apigw.LambdaIntegration(adminUserProvisioner, { proxy: true }));
    usersRes.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization']
    });
    const callbackUrl = `${paymentApi.url}messaging/delivery`;
    new cdk.CfnOutput(this, 'MessagingDeliveryCallbackUrl', {
      description: 'Delivery callback URL for messaging providers (Twilio StatusCallback)',
      value: callbackUrl
    });

    const messagingWorker = makeWorker(
      'MessagingWorker',
      'messaging',
      messagingQueues.queue,
      120,
      {
        MESSAGE_TEMPLATES_TABLE: tables.messageTemplates.tableName,
        MESSAGE_CAMPAIGNS_TABLE: tables.messageCampaigns.tableName,
        MESSAGE_RECIPIENTS_TABLE: tables.messageRecipients.tableName,
        PARENTS_TABLE: tables.parents.tableName,
        STUDENTS_TABLE: tables.students.tableName,
        STUDENT_PARENT_LINKS_TABLE: tables.studentParentLinks.tableName,
        ENROLLMENTS_TABLE: tables.enrollments.tableName,
        PROVIDER_CONFIGS_TABLE: tables.providerConfigs.tableName,
        FEATURE_FLAGS_TABLE: tables.featureFlags.tableName,
        INVOICES_TABLE: tables.invoices.tableName,
        PROVIDER_SECRET_PREFIX: `classpoint/${envName}/providers/`,
        DELIVERY_CALLBACK_URL: callbackUrl
      }
    );

    // IAM grants for workers
    const invoicingTables = [
      tables.invoices,
      tables.invoiceLines,
      tables.feeSchedules,
      tables.feeScheduleLines,
      tables.paymentTransactions,
      tables.paymentIntents,
      tables.feeAdjustments,
      tables.installmentPlans,
      tables.installments,
      tables.students,
      tables.enrollments,
      tables.discountRules,
      tables.feeItems
    ];
    invoicingTables.forEach((table) => table.grantReadWriteData(invoicingWorker));

    const messagingTables = [
      tables.messageTemplates,
      tables.messageCampaigns,
      tables.messageRecipients,
      tables.parents,
      tables.students,
      tables.studentParentLinks,
      tables.enrollments,
      tables.providerConfigs,
      tables.featureFlags,
      tables.invoices
    ];
    messagingTables.forEach((table) => table.grantReadWriteData(messagingWorker));
    messagingWorker.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:classpoint/${envName}/providers/*`,
          `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:classpoint-${envName}-*`
        ]
      })
    );
    // Messaging worker does not touch S3 yet; grant only when attachments/media are implemented.

    const importTables = [
      tables.importJobs,
      tables.students,
      tables.parents,
      tables.studentParentLinks,
      tables.enrollments,
      tables.classGroups,
      tables.classYears,
      tables.classArms,
      tables.levels,
      tables.academicSessions,
      tables.terms
    ];
    importTables.forEach((table) => table.grantReadWriteData(importWorker));
    tables.auditEvents.grantReadWriteData(importWorker);

    uploadsBucket.grantReadWrite(importWorker);

    new events.Rule(this, 'ImportRequestedRule', {
      eventBus,
      eventPattern: {
        source: ['classpoint.imports'],
        detailType: ['import.requested']
      },
      targets: [new eventTargets.LambdaFunction(importWorker)]
    });
    tables.receipts.grantReadWriteData(receiptsWorker);

    const alarmsTopic = new sns.Topic(this, 'InfraAlarmsTopic', {
      displayName: `classpoint-${envName}-alarms`
    });

    let cloudfront5xx: cloudwatch.Alarm | undefined;
    let cloudfront4xx: cloudwatch.Alarm | undefined;
    if (distribution) {
      cloudfront5xx = new cloudwatch.Alarm(this, 'CloudFront5xxAlarm', {
        alarmDescription: `CloudFront 5xx error rate high (${envName})`,
        metric: distribution.metric5xxErrorRate(),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      });

      cloudfront4xx = new cloudwatch.Alarm(this, 'CloudFront4xxAlarm', {
        alarmDescription: `CloudFront 4xx error rate high (${envName})`,
        metric: distribution.metric4xxErrorRate(),
        threshold: 10,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      });
    }

    const apiGateway5xx = new cloudwatch.Alarm(this, 'WebhookApi5xxAlarm', {
      alarmDescription: `Webhook API 5xx errors (${envName})`,
      metric: paymentApi.metricServerError(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const apiGatewayLatency = new cloudwatch.Alarm(this, 'WebhookApiLatencyAlarm', {
      alarmDescription: `Webhook API latency high (${envName})`,
      metric: paymentApi.metricLatency({ statistic: 'Average' }),
      threshold: 2000,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const paymentWebhookErrors = new cloudwatch.Alarm(this, 'PaymentWebhookErrorsAlarm', {
      alarmDescription: `Payment webhook Lambda errors (${envName})`,
      metric: paymentWebhook.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const messagingWebhookErrors = new cloudwatch.Alarm(this, 'MessagingWebhookErrorsAlarm', {
      alarmDescription: `Messaging webhook Lambda errors (${envName})`,
      metric: messagingWebhook.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const messagingWorkerErrors = new cloudwatch.Alarm(this, 'MessagingWorkerErrorsAlarm', {
      alarmDescription: `Messaging worker errors (${envName})`,
      metric: messagingWorker.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const invoicingWorkerErrors = new cloudwatch.Alarm(this, 'InvoicingWorkerErrorsAlarm', {
      alarmDescription: `Invoicing worker errors (${envName})`,
      metric: invoicingWorker.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const importWorkerErrors = new cloudwatch.Alarm(this, 'ImportWorkerErrorsAlarm', {
      alarmDescription: `Import worker errors (${envName})`,
      metric: importWorker.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const receiptsWorkerErrors = new cloudwatch.Alarm(this, 'ReceiptsWorkerErrorsAlarm', {
      alarmDescription: `Receipts worker errors (${envName})`,
      metric: receiptsWorker.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const messagingQueueAge = new cloudwatch.Alarm(this, 'MessagingQueueAgeAlarm', {
      alarmDescription: `Messaging queue oldest age high (${envName})`,
      metric: messagingQueues.queue.metricApproximateAgeOfOldestMessage(),
      threshold: 900,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const messagingQueueDepth = new cloudwatch.Alarm(this, 'MessagingQueueDepthAlarm', {
      alarmDescription: `Messaging queue depth high (${envName})`,
      metric: messagingQueues.queue.metricApproximateNumberOfMessagesVisible(),
      threshold: 200,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const importQueueAge = new cloudwatch.Alarm(this, 'ImportQueueAgeAlarm', {
      alarmDescription: `Import queue oldest age high (${envName})`,
      metric: importQueues.queue.metricApproximateAgeOfOldestMessage(),
      threshold: 900,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const importQueueDepth = new cloudwatch.Alarm(this, 'ImportQueueDepthAlarm', {
      alarmDescription: `Import queue depth high (${envName})`,
      metric: importQueues.queue.metricApproximateNumberOfMessagesVisible(),
      threshold: 200,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const invoicingQueueAge = new cloudwatch.Alarm(this, 'InvoicingQueueAgeAlarm', {
      alarmDescription: `Invoicing queue oldest age high (${envName})`,
      metric: invoicingQueues.queue.metricApproximateAgeOfOldestMessage(),
      threshold: 900,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const invoicingQueueDepth = new cloudwatch.Alarm(this, 'InvoicingQueueDepthAlarm', {
      alarmDescription: `Invoicing queue depth high (${envName})`,
      metric: invoicingQueues.queue.metricApproximateNumberOfMessagesVisible(),
      threshold: 200,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const receiptsQueueAge = new cloudwatch.Alarm(this, 'ReceiptsQueueAgeAlarm', {
      alarmDescription: `Receipts queue oldest age high (${envName})`,
      metric: receiptsQueues.queue.metricApproximateAgeOfOldestMessage(),
      threshold: 900,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const receiptsQueueDepth = new cloudwatch.Alarm(this, 'ReceiptsQueueDepthAlarm', {
      alarmDescription: `Receipts queue depth high (${envName})`,
      metric: receiptsQueues.queue.metricApproximateNumberOfMessagesVisible(),
      threshold: 200,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const messagingDlqDepth = new cloudwatch.Alarm(this, 'MessagingDlqDepthAlarm', {
      alarmDescription: `Messaging DLQ has messages (${envName})`,
      metric: messagingQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const importDlqDepth = new cloudwatch.Alarm(this, 'ImportDlqDepthAlarm', {
      alarmDescription: `Import DLQ has messages (${envName})`,
      metric: importQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const invoicingDlqDepth = new cloudwatch.Alarm(this, 'InvoicingDlqDepthAlarm', {
      alarmDescription: `Invoicing DLQ has messages (${envName})`,
      metric: invoicingQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const receiptsDlqDepth = new cloudwatch.Alarm(this, 'ReceiptsDlqDepthAlarm', {
      alarmDescription: `Receipts DLQ has messages (${envName})`,
      metric: receiptsQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    let publicCanaryAlarm: cloudwatch.Alarm | undefined;
    if (publicCanary) {
      publicCanaryAlarm = new cloudwatch.Alarm(this, 'PublicCanaryAlarm', {
        alarmDescription: `Public homepage canary failures (${envName})`,
        metric: publicCanary.metricSuccessPercent(),
        threshold: 90,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING
      });
    }

    const alarmAction = new cloudwatchActions.SnsAction(alarmsTopic);
    [
      cloudfront5xx,
      cloudfront4xx,
      apiGateway5xx,
      apiGatewayLatency,
      paymentWebhookErrors,
      messagingWebhookErrors,
      messagingWorkerErrors,
      invoicingWorkerErrors,
      importWorkerErrors,
      messagingDlqDepth,
      importDlqDepth,
      invoicingDlqDepth,
      receiptsDlqDepth,
      publicCanaryAlarm
    ]
      .filter((alarm): alarm is cloudwatch.Alarm => Boolean(alarm))
      .forEach((alarm) => alarm.addAlarmAction(alarmAction));

    const dashboard = new cloudwatch.Dashboard(this, 'OpsDashboard', {
      dashboardName: `classpoint-${envName}-ops`
    });
    if (distribution) {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'CloudFront Errors',
          left: [distribution.metric5xxErrorRate(), distribution.metric4xxErrorRate()]
        })
      );
    }
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Webhook API',
        left: [paymentApi.metricServerError(), paymentApi.metricLatency({ statistic: 'Average' })]
      }),
      new cloudwatch.GraphWidget({
        title: 'Webhook Lambda Errors',
        left: [paymentWebhook.metricErrors(), messagingWebhook.metricErrors()]
      }),
      new cloudwatch.GraphWidget({
        title: 'Worker Errors',
        left: [
          invoicingWorker.metricErrors(),
          messagingWorker.metricErrors(),
          importWorker.metricErrors(),
          receiptsWorker.metricErrors()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Queue Depth',
        left: [
          messagingQueues.queue.metricApproximateNumberOfMessagesVisible(),
          importQueues.queue.metricApproximateNumberOfMessagesVisible(),
          invoicingQueues.queue.metricApproximateNumberOfMessagesVisible(),
          receiptsQueues.queue.metricApproximateNumberOfMessagesVisible()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Queue Age',
        left: [
          messagingQueues.queue.metricApproximateAgeOfOldestMessage(),
          importQueues.queue.metricApproximateAgeOfOldestMessage(),
          invoicingQueues.queue.metricApproximateAgeOfOldestMessage(),
          receiptsQueues.queue.metricApproximateAgeOfOldestMessage()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'DLQ Depth',
        left: [
          messagingQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
          importQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
          invoicingQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
          receiptsQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible()
        ]
      })
    );
    if (publicCanary) {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Public Homepage Canary',
          left: [publicCanary.metricSuccessPercent()]
        })
      );
    }

    if (distribution) {
      new cdk.CfnOutput(this, 'CloudFrontDomain', {
        value: distribution.domainName,
        description: 'CloudFront distribution domain (attach DNS when ready)'
      });

      if (rootDomain) {
        new cdk.CfnOutput(this, 'AppDomainName', {
          value: `app.${rootDomain}`,
          description: 'App subdomain routed to CloudFront'
        });
        new cdk.CfnOutput(this, 'WildcardDomainName', {
          value: `*.${rootDomain}`,
          description: 'Wildcard subdomain routed to CloudFront'
        });
      }
    }

    if (logsBucket) {
      new cdk.CfnOutput(this, 'CloudFrontLogsBucketName', {
        value: logsBucket.bucketName,
        description: 'CloudFront access logs bucket'
      });
    }

    if (frontendBucket) {
      new cdk.CfnOutput(this, 'FrontendBucketName', {
        value: frontendBucket.bucketName,
        description: 'Static frontend assets bucket'
      });
    }

    new cdk.CfnOutput(this, 'InvoicingQueueUrl', {
      value: invoicingQueues.queue.queueUrl,
      description: 'SQS queue for invoicing jobs'
    });

    new cdk.CfnOutput(this, 'MessagingQueueUrl', {
      value: messagingQueues.queue.queueUrl,
      description: 'SQS queue for messaging jobs'
    });

    new cdk.CfnOutput(this, 'ImportQueueUrl', {
      value: importQueues.queue.queueUrl,
      description: 'SQS queue for import jobs'
    });

    new cdk.CfnOutput(this, 'InfraAlarmsTopicArn', {
      value: alarmsTopic.topicArn,
      description: 'SNS topic for infra alarms'
    });

    new cdk.CfnOutput(this, 'OpsDashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch dashboard for infra/ops'
    });

    if (publicCanary) {
      new cdk.CfnOutput(this, 'PublicCanaryName', {
        value: publicCanary.canaryName,
        description: 'Synthetics canary for public homepage'
      });
    }
  }
}
