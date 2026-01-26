import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as fs from 'fs';
import * as path from 'path';

export interface ClasspointWebStackProps extends StackProps {
  envName: string;
  apiId: string;
  apiKey: string;
  graphqlUrl: string;
  userPoolId: string;
  userPoolClientId: string;
}

export class ClasspointWebStack extends Stack {
  constructor(scope: Construct, id: string, props: ClasspointWebStackProps) {
    super(scope, id, props);

    const { envName, apiId, apiKey, graphqlUrl, userPoolId, userPoolClientId } = props;
    Tags.of(this).add('environment', envName);

    const rootDomain = this.node.tryGetContext('rootDomain') as string | undefined;
    const hostedZoneId = this.node.tryGetContext('hostedZoneId') as string | undefined;
    const cognitoClientId =
      (this.node.tryGetContext('cognitoClientId') as string | undefined) ?? userPoolClientId;
    const cognitoUserPoolId =
      (this.node.tryGetContext('cognitoUserPoolId') as string | undefined) ?? userPoolId;
    const cognitoDomain =
      (this.node.tryGetContext('cognitoDomain') as string | undefined) ||
      (rootDomain ? `https://auth.${rootDomain}` : undefined);
    const paymentsWebhookUrl = this.node.tryGetContext('paymentsWebhookUrl') as string | undefined;
    const paystackSchoolWebhookUrl =
      (this.node.tryGetContext('paystackSchoolWebhookUrl') as string | undefined) || paymentsWebhookUrl;
    const paystackClasspointWebhookUrl = this.node.tryGetContext('paystackClasspointWebhookUrl') as string | undefined;
    const classpointPaystackEnv =
      (this.node.tryGetContext('classpointPaystackEnv') as string | undefined) ||
      process.env.CLASSPOINT_PAYSTACK_ENV ||
      '';
    const classpointPaystackPublicKeyTest =
      (this.node.tryGetContext('classpointPaystackPublicKeyTest') as string | undefined) ||
      process.env.CLASSPOINT_PAYSTACK_PUBLIC_KEY_TEST ||
      '';
    const classpointPaystackSecretKeyTest =
      (this.node.tryGetContext('classpointPaystackSecretKeyTest') as string | undefined) ||
      process.env.CLASSPOINT_PAYSTACK_SECRET_KEY_TEST ||
      '';
    const classpointPaystackPublicKeyLive =
      (this.node.tryGetContext('classpointPaystackPublicKeyLive') as string | undefined) ||
      process.env.CLASSPOINT_PAYSTACK_PUBLIC_KEY_LIVE ||
      '';
    const classpointPaystackSecretKeyLive =
      (this.node.tryGetContext('classpointPaystackSecretKeyLive') as string | undefined) ||
      process.env.CLASSPOINT_PAYSTACK_SECRET_KEY_LIVE ||
      '';

    const removalPolicy = envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const autoDeleteObjects = envName !== 'prod';

    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy,
      autoDeleteObjects,
      versioned: true
    });

    const tagCacheTable = new dynamodb.Table(this, 'TagCacheTable', {
      partitionKey: { name: 'tag', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'path', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });
    tagCacheTable.addGlobalSecondaryIndex({
      indexName: 'revalidate',
      partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'revalidatedAt', type: dynamodb.AttributeType.NUMBER }
    });

    const revalidationDlq = new sqs.Queue(this, 'RevalidationDlq', {
      retentionPeriod: cdk.Duration.days(7)
    });
    const revalidationQueue = new sqs.Queue(this, 'RevalidationQueue', {
      visibilityTimeout: cdk.Duration.minutes(1),
      deadLetterQueue: {
        queue: revalidationDlq,
        maxReceiveCount: 5
      }
    });

    const openNextDir = path.join(__dirname, '..', '..', 'apps', 'web', '.open-next');
    const buildIdPath = path.join(openNextDir, 'buildId');
    const buildId = (() => {
      try {
        return fs.readFileSync(buildIdPath, 'utf8').trim();
      } catch {
        return '';
      }
    })();
    const cachePrefix = buildId ? `_cache/${buildId}` : '_cache';
    const serverFunction = new lambda.Function(this, 'ServerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(openNextDir, 'server-functions', 'default')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        APPSYNC_URL: graphqlUrl || `https://${apiId}.appsync-api.${this.region}.amazonaws.com/graphql`,
        APPSYNC_API_KEY: apiKey,
        NEXT_PUBLIC_ROOT_DOMAIN: rootDomain ?? 'classpoint.ng',
        ROOT_DOMAIN: rootDomain ?? 'classpoint.ng',
        COGNITO_REGION: this.region,
        COGNITO_USER_POOL_ID: cognitoUserPoolId ?? '',
        COGNITO_CLIENT_ID: cognitoClientId ?? '',
        NEXT_PUBLIC_COGNITO_CLIENT_ID: cognitoClientId ?? '',
        ...(paymentsWebhookUrl ? { NEXT_PUBLIC_PAYMENTS_WEBHOOK_URL: paymentsWebhookUrl } : {}),
        ...(paystackSchoolWebhookUrl
          ? { NEXT_PUBLIC_PAYSTACK_SCHOOL_WEBHOOK_URL: paystackSchoolWebhookUrl }
          : {}),
        ...(paystackClasspointWebhookUrl
          ? { NEXT_PUBLIC_PAYSTACK_CLASSPOINT_WEBHOOK_URL: paystackClasspointWebhookUrl }
          : {}),
        ...(classpointPaystackEnv ? { CLASSPOINT_PAYSTACK_ENV: classpointPaystackEnv } : {}),
        ...(classpointPaystackPublicKeyTest
          ? { CLASSPOINT_PAYSTACK_PUBLIC_KEY_TEST: classpointPaystackPublicKeyTest }
          : {}),
        ...(classpointPaystackSecretKeyTest
          ? { CLASSPOINT_PAYSTACK_SECRET_KEY_TEST: classpointPaystackSecretKeyTest }
          : {}),
        ...(classpointPaystackPublicKeyLive
          ? { CLASSPOINT_PAYSTACK_PUBLIC_KEY_LIVE: classpointPaystackPublicKeyLive }
          : {}),
        ...(classpointPaystackSecretKeyLive
          ? { CLASSPOINT_PAYSTACK_SECRET_KEY_LIVE: classpointPaystackSecretKeyLive }
          : {}),
        ...(cognitoDomain ? { COGNITO_DOMAIN: cognitoDomain } : {}),
        CACHE_BUCKET_NAME: assetsBucket.bucketName,
        CACHE_BUCKET_REGION: this.region,
        CACHE_BUCKET_KEY_PREFIX: cachePrefix,
        CACHE_DYNAMO_TABLE: tagCacheTable.tableName,
        REVALIDATION_QUEUE_URL: revalidationQueue.queueUrl,
        REVALIDATION_QUEUE_REGION: this.region,
        BUCKET_NAME: assetsBucket.bucketName,
        BUCKET_KEY_PREFIX: '_assets'
      }
    });

    assetsBucket.grantReadWrite(serverFunction);
    tagCacheTable.grantReadWriteData(serverFunction);
    revalidationQueue.grantSendMessages(serverFunction);

    const imageOptimizerFunction = new lambda.Function(this, 'ImageOptimizerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(openNextDir, 'image-optimization-function')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        BUCKET_NAME: assetsBucket.bucketName,
        BUCKET_KEY_PREFIX: '_assets'
      }
    });
    assetsBucket.grantRead(imageOptimizerFunction);

    const revalidationFunction = new lambda.Function(this, 'RevalidationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(openNextDir, 'revalidation-function')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
      }
    });
    revalidationFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(revalidationQueue, {
        batchSize: 10,
        reportBatchItemFailures: true
      })
    );

    const serverUrl = serverFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });
    const imageUrl = imageOptimizerFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });

    const serverOriginDomain = cdk.Fn.select(2, cdk.Fn.split('/', serverUrl.url));
    const imageOriginDomain = cdk.Fn.select(2, cdk.Fn.split('/', imageUrl.url));
    const serverOrigin = new origins.HttpOrigin(serverOriginDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY
    });
    const imageOrigin = new origins.HttpOrigin(imageOriginDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY
    });
    const s3Origin = new origins.S3Origin(assetsBucket, {
      originPath: '/_assets'
    });

    const forwardedHostFunction = new cloudfront.Function(this, 'ForwardedHostFunction', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var hostHeader = request.headers['host'];
  if (hostHeader && hostHeader.value) {
    request.headers['x-forwarded-host'] = { value: hostHeader.value };
  }
  return request;
}
`)
    });

    const defaultCachePolicy = new cloudfront.CachePolicy(this, 'DefaultCachePolicy', {
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        'authorization',
        'accept',
        'accept-encoding',
        'x-forwarded-host'
      ),
      cookieBehavior: cloudfront.CacheCookieBehavior.all(),
      defaultTtl: cdk.Duration.seconds(0),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.days(1)
    });
    const originRequestPolicy = cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER;

    const imageCachePolicy = new cloudfront.CachePolicy(this, 'ImageCachePolicy', {
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('accept', 'accept-encoding'),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      defaultTtl: cdk.Duration.days(1),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.days(30)
    });

    let hostedZone: route53.IHostedZone | undefined;
    if (rootDomain && hostedZoneId) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId,
        zoneName: rootDomain
      });
    }

    const certificate =
      rootDomain && hostedZone
        ? new acm.DnsValidatedCertificate(this, 'CloudFrontCertificate', {
            domainName: rootDomain,
            subjectAlternativeNames: [`app.${rootDomain}`, `*.${rootDomain}`, `www.${rootDomain}`],
            hostedZone,
            region: 'us-east-1'
          })
        : undefined;

    const wafRootDomain = rootDomain ?? 'classpoint.ng';
    const hqHost = `app.${wafRootDomain}`;
    const tenantSuffix = `.${wafRootDomain}`;
    const hostHeader = { singleHeader: { Name: 'host' } };
    const hostEquals = (value: string) => ({
      byteMatchStatement: {
        searchString: value,
        fieldToMatch: hostHeader,
        positionalConstraint: 'EXACTLY',
        textTransformations: [{ priority: 0, type: 'LOWERCASE' }]
      }
    });
    const hostEndsWith = (value: string) => ({
      byteMatchStatement: {
        searchString: value,
        fieldToMatch: hostHeader,
        positionalConstraint: 'ENDS_WITH',
        textTransformations: [{ priority: 0, type: 'LOWERCASE' }]
      }
    });

    const enableWaf = true;
    const managedRules =
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
          ];

    const rateRules: wafv2.CfnWebACL.RuleProperty[] = [
      {
        name: 'RateLimitGlobal',
        priority: 10,
        action: { block: {} },
        statement: {
          rateBasedStatement: {
            limit: 3000,
            aggregateKeyType: 'IP'
          }
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `waf-rate-global-${envName}`,
          sampledRequestsEnabled: true
        }
      },
      {
        name: 'RateLimitTenants',
        priority: 11,
        action: { block: {} },
        statement: {
          rateBasedStatement: {
            limit: 1200,
            aggregateKeyType: 'IP',
            scopeDownStatement: {
              andStatement: {
                statements: [
                  hostEndsWith(tenantSuffix),
                  { notStatement: { statement: hostEquals(hqHost) } }
                ]
              }
            }
          }
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `waf-rate-tenants-${envName}`,
          sampledRequestsEnabled: true
        }
      }
    ];

    const wafAcl = enableWaf
      ? new wafv2.CfnWebACL(this, 'WebWafAcl', {
          defaultAction: { allow: {} },
          scope: 'CLOUDFRONT',
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `classpoint-web-${envName}-waf`,
            sampledRequestsEnabled: true
          },
          rules: [...managedRules, ...rateRules]
        })
      : undefined;

    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultBehavior: {
        origin: serverOrigin,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: defaultCachePolicy,
        originRequestPolicy,
        functionAssociations: [
          {
            function: forwardedHostFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
          }
        ]
      },
      additionalBehaviors: {
        '_next/image*': {
          origin: imageOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: imageCachePolicy,
          originRequestPolicy
        },
        '_next/data/*': {
          origin: serverOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: defaultCachePolicy,
          originRequestPolicy
        },
        '_next/*': {
          origin: s3Origin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
        },
        'BUILD_ID': {
          origin: s3Origin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
        }
      },
      domainNames: certificate && rootDomain ? [rootDomain, `app.${rootDomain}`, `*.${rootDomain}`, `www.${rootDomain}`] : undefined,
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      webAclId: wafAcl?.attrArn
    });

    new s3deploy.BucketDeployment(this, 'DeployAssets', {
      destinationBucket: assetsBucket,
      destinationKeyPrefix: '_assets',
      sources: [s3deploy.Source.asset(path.join(openNextDir, 'assets'))],
      distribution,
      distributionPaths: ['/_next/*', '/BUILD_ID'],
      cacheControl: [
        s3deploy.CacheControl.maxAge(cdk.Duration.days(365)),
        s3deploy.CacheControl.fromString('public')
      ]
    });

    new s3deploy.BucketDeployment(this, 'DeployCache', {
      destinationBucket: assetsBucket,
      destinationKeyPrefix: cachePrefix,
      sources: [s3deploy.Source.asset(path.join(openNextDir, 'cache'))],
      cacheControl: [s3deploy.CacheControl.noCache()]
    });

    if (hostedZone && rootDomain) {
      const target = route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution));
      new route53.ARecord(this, 'AppAlias', {
        zone: hostedZone,
        recordName: `app.${rootDomain}`,
        target
      });
      new route53.AaaaRecord(this, 'AppAliasAAAA', {
        zone: hostedZone,
        recordName: `app.${rootDomain}`,
        target
      });
      new route53.ARecord(this, 'RootAlias', {
        zone: hostedZone,
        recordName: rootDomain,
        target
      });
      new route53.AaaaRecord(this, 'RootAliasAAAA', {
        zone: hostedZone,
        recordName: rootDomain,
        target
      });
      new route53.ARecord(this, 'WwwAlias', {
        zone: hostedZone,
        recordName: `www.${rootDomain}`,
        target
      });
      new route53.AaaaRecord(this, 'WwwAliasAAAA', {
        zone: hostedZone,
        recordName: `www.${rootDomain}`,
        target
      });
      new route53.ARecord(this, 'TenantAlias', {
        zone: hostedZone,
        recordName: `*.${rootDomain}`,
        target
      });
      new route53.AaaaRecord(this, 'TenantAliasAAAA', {
        zone: hostedZone,
        recordName: `*.${rootDomain}`,
        target
      });
    }

    new cdk.CfnOutput(this, 'WebDistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront domain for the OpenNext web app'
    });
  }
}
