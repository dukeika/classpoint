// src/lib/amplify-config.ts
import { Amplify } from "aws-amplify";

let isConfigured = false;

export const configureAmplify = (): boolean => {
  if (isConfigured) return true;

  try {
    // Try to import the generated config
    const awsExports = require("../aws-exports");
    const config = awsExports.default || awsExports;

    // Use the aws-exports directly
    Amplify.configure(config);
    isConfigured = true;
    console.log("Amplify configured successfully with real config");
    return true;
  } catch (error) {
    console.warn(
      "AWS exports not found, using mock configuration for development"
    );
    // Mock configuration for development when aws-exports doesn't exist
    try {
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: "eu-west-2_XXXXXXXX",
            userPoolClientId: "XXXXXXXXXXXXXXXXXXXXXXXXXX",
            identityPoolId: "eu-west-2:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
            loginWith: {
              email: true,
            },
            signUpVerificationMethod: "code" as const,
            userAttributes: {
              email: {
                required: true,
              },
            },
            allowGuestAccess: false,
          },
        },
      });
      isConfigured = true;
      console.log("Amplify configured with mock config");
      return false; // Return false to indicate mock mode
    } catch (mockError) {
      console.error(
        "Failed to configure Amplify even with mock config:",
        mockError
      );
      return false;
    }
  }
};

export const isAmplifyConfigured = () => isConfigured;

export default configureAmplify;
