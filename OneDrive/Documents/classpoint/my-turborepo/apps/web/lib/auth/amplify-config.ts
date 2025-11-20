import { ResourcesConfig } from 'aws-amplify'

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'af-south-1_kqGYNh2kd',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '2ue3pomcpsjvargqq0ir3frmm0',
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
        'custom:tenant_id': {
          required: false,
        },
        'custom:roles': {
          required: false,
        },
      },
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
