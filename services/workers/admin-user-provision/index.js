const {
  CognitoIdentityProviderClient,
  GetUserCommand,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  AdminSetUserPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const cognito = new CognitoIdentityProviderClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const userPoolId = process.env.USER_POOL_ID;
const usersTable = process.env.USERS_TABLE;

const ADMIN_GROUPS = ['APP_ADMIN', 'SCHOOL_ADMIN'];
const TARGET_GROUPS = ['APP_ADMIN', 'SCHOOL_ADMIN', 'BURSAR', 'TEACHER', 'PARENT'];
const GROUP_TO_USER_TYPE = {
  APP_ADMIN: 'STAFF',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  BURSAR: 'STAFF',
  TEACHER: 'STAFF',
  PARENT: 'PARENT'
};

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(payload)
});

const readToken = (event) => {
  const header = event.headers?.authorization || event.headers?.Authorization || '';
  if (!header) return '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return header.trim();
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const randomPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';
  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];
  const base = Array.from({ length: 8 }, () => pick(upper + lower + numbers)).join('');
  return `${pick(upper)}${pick(lower)}${pick(numbers)}${pick(symbols)}${base}`;
};

exports.handler = async (event) => {
  if (!userPoolId || !usersTable) {
    return json(500, { error: 'Service not configured.' });
  }

  try {
    const token = readToken(event);
    if (!token) {
      return json(401, { error: 'Authorization token required.' });
    }

    const requester = await cognito.send(new GetUserCommand({ AccessToken: token }));
    const requesterUsername = requester.Username;
    if (!requesterUsername) {
      return json(401, { error: 'Invalid access token.' });
    }

    const requesterGroups = await cognito.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: userPoolId,
        Username: requesterUsername
      })
    );
    const groupNames = (requesterGroups.Groups || []).map((group) => group.GroupName).filter(Boolean);
    const isAdmin = groupNames.some((group) => ADMIN_GROUPS.includes(group));
    if (!isAdmin) {
      return json(403, { error: 'Admin group required.' });
    }

    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body || {};
    const email = normalizeString(body.email).toLowerCase();
    const firstName = normalizeString(body.firstName);
    const lastName = normalizeString(body.lastName);
    const role = normalizeString(body.role).toUpperCase();
    const phone = normalizeString(body.phone);

    if (!email || !firstName || !lastName || !role) {
      return json(400, { error: 'email, firstName, lastName, and role are required.' });
    }
    if (!TARGET_GROUPS.includes(role)) {
      return json(400, { error: 'Invalid role.' });
    }
    if (role === 'APP_ADMIN' && !groupNames.includes('APP_ADMIN')) {
      return json(403, { error: 'Only APP_ADMIN can create another APP_ADMIN.' });
    }

    const requesterSchool = requester.UserAttributes?.find((attr) => attr.Name === 'custom:schoolId')?.Value || '';
    const schoolId = groupNames.includes('APP_ADMIN') && normalizeString(body.schoolId)
      ? normalizeString(body.schoolId)
      : requesterSchool;

    if (!schoolId) {
      return json(400, { error: 'schoolId is required for this action.' });
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const tempPassword = randomPassword();

    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        TemporaryPassword: tempPassword,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
          { Name: 'name', Value: fullName },
          { Name: 'custom:schoolId', Value: schoolId },
          ...(phone ? [{ Name: 'phone_number', Value: phone }] : [])
        ]
      })
    );

    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: tempPassword,
        Permanent: true
      })
    );

    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: role
      })
    );

    const userId = crypto.randomUUID();
    const userType = GROUP_TO_USER_TYPE[role] || 'STAFF';
    const now = new Date().toISOString();

    const userItem = {
      schoolId,
      id: userId,
      email,
      name: fullName,
      userType,
      status: 'INVITED',
      createdAt: now,
      updatedAt: now
    };
    if (phone) {
      userItem.phone = phone;
    }

    await dynamo.send(
      new PutCommand({
        TableName: usersTable,
        Item: userItem
      })
    );

    return json(200, {
      ok: true,
      userId,
      username: email,
      tempPassword,
      schoolId,
      role
    });
  } catch (err) {
    const message = err?.name === 'UsernameExistsException'
      ? 'User already exists.'
      : err?.message || 'Unable to create user.';
    const status = err?.name === 'UsernameExistsException' ? 409 : 500;
    return json(status, { error: message });
  }
};
