import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as route53 from 'aws-cdk-lib/aws-route53';

export interface ClasspointAuthStackProps extends StackProps {
  envName: string;
  userPoolId: string;
}

export class ClasspointAuthStack extends Stack {
  public readonly cognitoDomain?: string;

  constructor(scope: Construct, id: string, props: ClasspointAuthStackProps) {
    super(scope, id, props);

    const { envName, userPoolId } = props;
    Tags.of(this).add('environment', envName);

    const rootDomain = this.node.tryGetContext('rootDomain') as string | undefined;
    const hostedZoneId = this.node.tryGetContext('hostedZoneId') as string | undefined;
    if (!rootDomain || !hostedZoneId) {
      return;
    }
    const authDomain = `auth.${rootDomain}`;

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId,
      zoneName: rootDomain
    });

    const userPool = cognito.UserPool.fromUserPoolId(this, 'UserPool', userPoolId);
    const cognitoCert = new acm.DnsValidatedCertificate(this, 'CognitoDomainCert', {
      domainName: authDomain,
      hostedZone,
      region: this.region
    });

    const userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool,
      customDomain: {
        domainName: authDomain,
        certificate: cognitoCert
      }
    });

    new route53.CnameRecord(this, 'UserPoolDomainAlias', {
      zone: hostedZone,
      recordName: authDomain,
      domainName: userPoolDomain.cloudFrontDomainName
    });

    this.cognitoDomain = `https://${authDomain}`;

    new cdk.CfnOutput(this, 'CognitoHostedDomain', {
      value: this.cognitoDomain,
      description: 'Cognito Hosted UI domain'
    });
  }
}
