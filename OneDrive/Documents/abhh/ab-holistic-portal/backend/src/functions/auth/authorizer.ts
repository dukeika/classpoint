import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  PolicyDocument,
  Statement,
  Context
} from 'aws-lambda';
import { JWTUtil, TokenValidationResult } from '../../utils/jwt';
import { Logger } from '../../utils/logger';
import { UserRole, Permission, JWTPayload } from '../../types';

const logger = new Logger('Authorizer');

interface AuthorizerResponse extends APIGatewayAuthorizerResult {
  context?: {
    userId: string;
    email: string;
    role: string;
    permissions: string;
  };
}

/**
 * AWS API Gateway Lambda Authorizer Function
 *
 * This authorizer validates JWT tokens from AWS Cognito and creates
 * IAM policies for API Gateway access control.
 *
 * Features:
 * - Validates Cognito JWT tokens using JWKS
 * - Extracts user roles and permissions from token claims
 * - Returns proper IAM policy for API Gateway
 * - Handles token expiration and invalid tokens
 * - Supports role-based access control
 */

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
): Promise<AuthorizerResponse> => {
  logger.info('Authorizer invoked', {
    methodArn: event.methodArn,
    type: event.type,
    authorizationToken: event.authorizationToken ? 'present' : 'missing',
    requestId: context.awsRequestId
  });

  try {
    // Extract token from authorization header
    const token = event.authorizationToken;
    if (!token) {
      logger.warn('No authorization token provided');
      throw new Error('Unauthorized: No token provided');
    }

    // Validate the token
    const jwtUtil = JWTUtil.getInstance();
    const validationResult: TokenValidationResult = await jwtUtil.validateAccessToken(token);

    if (!validationResult.isValid || !validationResult.payload) {
      logger.warn('Token validation failed', {
        error: validationResult.error,
        hasPayload: !!validationResult.payload
      });
      throw new Error(`Unauthorized: ${validationResult.error || 'Invalid token'}`);
    }

    const payload = validationResult.payload as JWTPayload;
    logger.info('Token validated successfully', {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions?.length || 0
    });

    // Extract method and resource from method ARN
    const { resource, method } = parseMethodArn(event.methodArn);

    // Determine access policy based on user role and resource
    const effect = determineAccess(payload, resource, method);

    // Generate IAM policy
    const policy = generatePolicy(payload.sub, effect, event.methodArn);

    const response: AuthorizerResponse = {
      principalId: payload.sub,
      policyDocument: policy,
      context: {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: JSON.stringify(payload.permissions || [])
      }
    };

    logger.info('Authorization successful', {
      principalId: response.principalId,
      effect,
      resource,
      method
    });

    return response;

  } catch (error) {
    logger.error('Authorization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      methodArn: event.methodArn
    });

    // For authorization failures, we need to throw an error
    // API Gateway will return 401 Unauthorized
    throw new Error('Unauthorized');
  }
};

/**
 * Parse the method ARN to extract resource and HTTP method
 */
function parseMethodArn(methodArn: string): { resource: string; method: string } {
  // Method ARN format: arn:aws:execute-api:region:account:api-id/stage/method/resource-path
  const parts = methodArn.split('/');

  if (parts.length < 3) {
    return { resource: '', method: '' };
  }

  const method = parts[2];
  const resource = parts.slice(3).join('/');

  return { resource, method };
}

/**
 * Determine access based on user role, resource, and method
 */
function determineAccess(payload: JWTPayload, resource: string, method: string): 'Allow' | 'Deny' {
  const { role, permissions = [] } = payload;

  logger.info('Determining access', {
    userId: payload.sub,
    role,
    resource,
    method,
    permissionsCount: permissions.length
  });

  // Super admin has access to everything
  if (role === UserRole.SUPER_ADMIN) {
    return 'Allow';
  }

  // Define resource-based access rules
  const accessRules = getAccessRules();

  for (const rule of accessRules) {
    if (rule.resourcePattern.test(resource) && rule.methods.includes(method)) {
      // Check if user has required role
      if (rule.allowedRoles.includes(role)) {
        // If specific permissions are required, check them
        if (rule.requiredPermissions && rule.requiredPermissions.length > 0) {
          const hasRequiredPermission = rule.requiredPermissions.some(permission =>
            permissions.includes(permission)
          );
          if (!hasRequiredPermission) {
            logger.warn('Access denied: Missing required permission', {
              requiredPermissions: rule.requiredPermissions,
              userPermissions: permissions
            });
            return 'Deny';
          }
        }
        return 'Allow';
      }
    }
  }

  logger.warn('Access denied: No matching rule found', {
    role,
    resource,
    method
  });

  return 'Deny';
}

/**
 * Define access rules for different resources
 */
interface AccessRule {
  resourcePattern: RegExp;
  methods: string[];
  allowedRoles: UserRole[];
  requiredPermissions?: Permission[];
}

function getAccessRules(): AccessRule[] {
  return [
    // Job management - Admin only
    {
      resourcePattern: /^jobs$/,
      methods: ['POST'],
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      requiredPermissions: [Permission.CREATE_JOB]
    },
    {
      resourcePattern: /^jobs\/[^/]+$/,
      methods: ['PUT', 'DELETE'],
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      requiredPermissions: [Permission.UPDATE_JOB, Permission.DELETE_JOB]
    },

    // Job listing - Public (no auth required) or authenticated
    {
      resourcePattern: /^jobs$/,
      methods: ['GET'],
      allowedRoles: [UserRole.APPLICANT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },
    {
      resourcePattern: /^jobs\/[^/]+$/,
      methods: ['GET'],
      allowedRoles: [UserRole.APPLICANT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },

    // My jobs - Authenticated users only
    {
      resourcePattern: /^jobs\/my-jobs$/,
      methods: ['GET'],
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },

    // Application management
    {
      resourcePattern: /^applications$/,
      methods: ['POST'],
      allowedRoles: [UserRole.APPLICANT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },
    {
      resourcePattern: /^applications$/,
      methods: ['GET'],
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      requiredPermissions: [Permission.VIEW_ALL_APPLICATIONS]
    },
    {
      resourcePattern: /^applications\/[^/]+$/,
      methods: ['GET'],
      allowedRoles: [UserRole.APPLICANT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },
    {
      resourcePattern: /^applications\/[^/]+\/stage$/,
      methods: ['PUT'],
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      requiredPermissions: [Permission.UPDATE_APPLICATION_STAGE]
    },

    // Test management
    {
      resourcePattern: /^tests$/,
      methods: ['POST'],
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      requiredPermissions: [Permission.CREATE_TEST]
    },
    {
      resourcePattern: /^tests\/[^/]+$/,
      methods: ['GET'],
      allowedRoles: [UserRole.APPLICANT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },
    {
      resourcePattern: /^tests\/[^/]+\/submit$/,
      methods: ['POST'],
      allowedRoles: [UserRole.APPLICANT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },

    // File uploads
    {
      resourcePattern: /^files\/upload-url$/,
      methods: ['POST'],
      allowedRoles: [UserRole.APPLICANT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },

    // Notifications
    {
      resourcePattern: /^notifications\/send$/,
      methods: ['POST'],
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    }
  ];
}

/**
 * Generate IAM policy document
 */
function generatePolicy(principalId: string, effect: 'Allow' | 'Deny', resource: string): PolicyDocument {
  const statement: Statement = {
    Action: 'execute-api:Invoke',
    Effect: effect,
    Resource: resource
  };

  const policyDocument: PolicyDocument = {
    Version: '2012-10-17',
    Statement: [statement]
  };

  logger.debug('Generated policy', {
    principalId,
    effect,
    resource,
    policy: policyDocument
  });

  return policyDocument;
}

export default handler;