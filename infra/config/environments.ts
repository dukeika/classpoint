export type EnvironmentKey = 'dev' | 'stage' | 'prod';

export interface EnvironmentConfig {
  account: string;
  region: string;
}

export const environments: Record<EnvironmentKey, EnvironmentConfig> = {
  dev: {
    account: '624914081304',
    region: 'us-east-1'
  },
  stage: {
    account: '000000000000', // TODO: replace with stage account
    region: 'us-east-1'
  },
  prod: {
    account: '000000000000', // TODO: replace with prod account
    region: 'us-east-1'
  }
};
