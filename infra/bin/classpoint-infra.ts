#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClasspointStack } from '../lib/classpoint-stack';
import { ClasspointAuthStack } from '../lib/classpoint-auth-stack';
import { ClasspointServicesStack } from '../lib/classpoint-services-stack';
import { ClasspointPublishStack } from '../lib/classpoint-publish-stack';
import { ClasspointAcademicsStack } from '../lib/classpoint-academics-stack';
import { ClasspointCatalogStack } from '../lib/classpoint-catalog-stack';
import { ClasspointWebStack } from '../lib/classpoint-web-stack';
import { environments, EnvironmentKey } from '../config/environments';

const app = new cdk.App();
const targetEnv = (app.node.tryGetContext('env') ?? 'dev') as EnvironmentKey;
const envConfig = environments[targetEnv];

if (!envConfig) {
  throw new Error(`Unknown env '${targetEnv}'. Provide one of: ${Object.keys(environments).join(', ')}`);
}

const coreStack = new ClasspointStack(app, `ClasspointStack-${targetEnv}`, {
  envName: targetEnv,
  env: {
    account: envConfig.account,
    region: envConfig.region
  },
  tags: {
    app: 'classpoint',
    env: targetEnv
  }
});

const authStack = new ClasspointAuthStack(app, `ClasspointAuthStack-${targetEnv}`, {
  envName: targetEnv,
  userPoolId: coreStack.userPoolId,
  env: {
    account: envConfig.account,
    region: envConfig.region
  },
  tags: {
    app: 'classpoint',
    env: targetEnv
  }
});
authStack.addDependency(coreStack);

const servicesStack = new ClasspointServicesStack(app, `ClasspointServicesStack-${targetEnv}`, {
  envName: targetEnv,
  eventBus: coreStack.eventBus,
  uploadsBucket: coreStack.uploadsBucket,
  awsSdkLayer: coreStack.awsSdkLayer,
  userPoolId: coreStack.userPoolId,
  tables: coreStack.tables,
  env: {
    account: envConfig.account,
    region: envConfig.region
  },
  tags: {
    app: 'classpoint',
    env: targetEnv
  }
});
servicesStack.addDependency(coreStack);

const webStack = new ClasspointWebStack(app, `ClasspointWebStack-${targetEnv}`, {
  envName: targetEnv,
  apiId: coreStack.apiId,
  apiKey: coreStack.apiKey,
  graphqlUrl: coreStack.graphqlUrl,
  userPoolId: coreStack.userPoolId,
  userPoolClientId: coreStack.userPoolClientId,
  env: {
    account: envConfig.account,
    region: envConfig.region
  },
  tags: {
    app: 'classpoint',
    env: targetEnv
  }
});
webStack.addDependency(coreStack);

const catalogStack = new ClasspointCatalogStack(app, `ClasspointCatalogStack-${targetEnv}`, {
  envName: targetEnv,
  apiId: coreStack.apiId,
  env: {
    account: envConfig.account,
    region: envConfig.region
  },
  tags: {
    app: 'classpoint',
    env: targetEnv
  }
});
catalogStack.addDependency(coreStack);

new ClasspointPublishStack(app, `ClasspointPublishStack-${targetEnv}`, {
  envName: targetEnv,
  apiId: coreStack.apiId,
  env: {
    account: envConfig.account,
    region: envConfig.region
  },
  tags: {
    app: 'classpoint',
    env: targetEnv
  }
});

new ClasspointAcademicsStack(app, `ClasspointAcademicsStack-${targetEnv}`, {
  envName: targetEnv,
  apiId: coreStack.apiId,
  env: {
    account: envConfig.account,
    region: envConfig.region
  },
  tags: {
    app: 'classpoint',
    env: targetEnv
  }
});
