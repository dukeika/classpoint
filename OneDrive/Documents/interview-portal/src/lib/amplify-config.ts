// Clean Amplify Configuration
import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  aws_project_region: 'eu-west-2',
  aws_cognito_region: 'eu-west-2',
  aws_user_pools_id: 'eu-west-2_VvBB48LmX',
  aws_user_pools_web_client_id: '3843f0u00360rit8kml02ll07j',
  aws_cognito_username_attributes: ['EMAIL'],
  aws_cognito_signup_attributes: ['EMAIL'],
  aws_cognito_mfa_configuration: 'OFF',
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: []
  },
  aws_cognito_verification_mechanisms: ['EMAIL']
};

// Configure Amplify immediately
Amplify.configure(amplifyConfig);
console.log('✅ Amplify configured with User Pool:', amplifyConfig.aws_user_pools_id);

export default amplifyConfig;