import { APIGatewayTokenAuthorizerHandler, APIGatewayAuthorizerResult } from 'aws-lambda';
import { JWTUtil } from '../../utils/jwt';
import { Logger } from '../../utils/logger';

const logger = new Logger('Authorizer');
const jwtUtil = JWTUtil.getInstance();

export const handler: APIGatewayTokenAuthorizerHandler = async (event): Promise<APIGatewayAuthorizerResult> => {
  try {
    logger.info('Processing authorization request', {
      methodArn: event.methodArn,
      authorizationToken: event.authorizationToken ? 'present' : 'missing'
    });

    const token = event.authorizationToken;

    if (!token) {
      logger.warn('No authorization token provided');
      throw new Error('Unauthorized - No token provided');
    }

    // Extract token from Bearer header
    const cleanToken = JWTUtil.extractTokenFromHeader(token);
    if (!cleanToken) {
      logger.warn('Invalid authorization header format');
      throw new Error('Unauthorized - Invalid token format');
    }

    // Validate the token
    const validationResult = await jwtUtil.validateAccessToken(cleanToken);

    if (!validationResult.isValid || !validationResult.payload) {
      logger.warn('Token validation failed', {
        error: validationResult.error
      });
      throw new Error('Unauthorized - Invalid token');
    }

    const { payload } = validationResult;

    logger.info('Token validated successfully', {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
      permissions: payload.permissions,
      cognitoGroups: payload['cognito:groups'] || 'none'
    });

    // Generate policy based on user role
    const policy = generatePolicy(payload.sub, event.methodArn, payload);

    logger.info('Generated policy for user', {
      userId: payload.sub,
      role: payload.role,
      effect: policy.policyDocument.Statement[0]?.Effect,
      methodArn: event.methodArn
    });

    // Add user context to the response
    const context = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: JSON.stringify(payload.permissions || [])
    };

    logger.info('Setting authorizer context', {
      userId: context.userId,
      role: context.role,
      permissions: context.permissions
    });

    return {
      ...policy,
      context
    };

  } catch (error) {
    logger.error('Authorization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      methodArn: event.methodArn
    });

    // Return explicit deny policy for failed authorization instead of throwing
    return {
      principalId: 'unauthorized',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: event.methodArn
          }
        ]
      }
    };
  }
};

/**
 * Generates IAM policy based on user role and permissions
 */
function generatePolicy(
  principalId: string,
  resource: string,
  payload: any
): APIGatewayAuthorizerResult {

  const policy: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: []
    }
  };

  // Extract method and resource info from ARN format: arn:aws:execute-api:region:account:api-id/stage/METHOD/resource
  const resourceParts = resource.split('/');
  const arnParts = resource.split(':');
  const pathPart = arnParts[5]; // api-id/stage/METHOD/resource
  const pathSegments = pathPart.split('/');
  const method = pathSegments[2] || ''; // METHOD is at index 2

  // Define role-based access rules
  const accessRules = getRoleBasedAccessRules(payload.role, payload.permissions || []);

  // Check if this request is allowed
  const isAllowed = checkAccess(method, resourceParts, accessRules);

  if (isAllowed) {
    policy.policyDocument.Statement.push({
      Action: 'execute-api:Invoke',
      Effect: 'Allow',
      Resource: resource
    });
  } else {
    policy.policyDocument.Statement.push({
      Action: 'execute-api:Invoke',
      Effect: 'Deny',
      Resource: resource
    });
  }

  return policy;
}

/**
 * Defines access rules based on user role
 */
function getRoleBasedAccessRules(role: string, permissions: string[]) {
  const rules = {
    allowedMethods: [] as string[],
    allowedResources: [] as string[],
    deniedResources: [] as string[]
  };

  logger.info('Determining access rules', { role, permissions });

  switch (role.toLowerCase()) {
    case 'super_admin':
    case 'superadmin':
      rules.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      rules.allowedResources = ['*'];
      break;

    case 'admin':
    case 'admins':
      rules.allowedMethods = ['GET', 'POST', 'PUT', 'PATCH'];
      rules.allowedResources = [
        'jobs',
        'applications',
        'tests',
        'notifications',
        'files'
      ];
      // Admins cannot delete certain resources
      rules.deniedResources = ['users'];
      break;

    case 'applicant':
    case 'applicants':
      rules.allowedMethods = ['GET', 'POST', 'PUT'];
      rules.allowedResources = [
        'applications', // Own applications only
        'jobs', // Read-only access
        'tests', // Take tests only
        'files' // Upload files only
      ];
      break;

    default:
      // No access by default for unrecognized roles
      logger.warn('Unrecognized role, denying access', { role });
      break;
  }

  logger.info('Access rules determined', {
    role,
    allowedMethods: rules.allowedMethods,
    allowedResources: rules.allowedResources,
    deniedResources: rules.deniedResources
  });

  return rules;
}

/**
 * Checks if a specific request is allowed based on access rules
 */
function checkAccess(method: string, resourceParts: string[], rules: any): boolean {
  // Check if method is allowed
  if (!rules.allowedMethods.includes(method)) {
    return false;
  }

  // Check if resource is allowed
  const resourcePath = resourceParts.slice(3).join('/'); // Remove stage and API parts
  const primaryResource = resourcePath.split('/')[0];

  // Check explicit denials first
  if (rules.deniedResources.some((denied: string) => resourcePath.includes(denied))) {
    return false;
  }

  // Check if resource is allowed
  if (rules.allowedResources.includes('*')) {
    return true;
  }

  return rules.allowedResources.some((allowed: string) =>
    resourcePath.startsWith(allowed) || primaryResource === allowed
  );
}