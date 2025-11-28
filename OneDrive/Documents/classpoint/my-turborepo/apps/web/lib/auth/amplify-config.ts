import { ResourcesConfig } from 'aws-amplify'

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-2',
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'eu-west-2_yC8ZQo484',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'gno2qu84tmovsu9801653o8br',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
        given_name: {
          required: true,
        },
        family_name: {
          required: true,
        },
        // Custom attributes are allowed by Cognito even if not in the strict type; keep optional.
        'custom:tenant_id': {
          required: false,
        },
        'custom:roles': {
          required: false,
        },
      } satisfies Record<string, { required: boolean }>,
      passwordFormat: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
}
