import { APIGatewayTokenAuthorizerHandler } from 'aws-lambda';

export const handler: APIGatewayTokenAuthorizerHandler = async (event) => {
  try {
    // TODO: Implement JWT authorization
    const token = event.authorizationToken;

    if (!token) {
      throw new Error('Unauthorized');
    }

    // For now, return a basic policy
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
          },
        ],
      },
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
};