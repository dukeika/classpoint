# Authentication Setup - Deployment Summary

## ✅ Deployment Complete

**Date:** 2025-10-24
**AWS Profile:** futurelogix
**Account:** 624914081304
**Region:** af-south-1 (Cape Town)
**Stage:** dev

---

## 🎯 What Was Deployed

### AWS Cognito User Pools (3 Pools)

#### 1. Staff User Pool
**Purpose:** Manages SUPER_ADMIN, SCHOOL_ADMIN, and TEACHER users

**Pool ID:** `af-south-1_kqGYNh2kd`
**Client ID:** `2ue3pomcpsjvargqq0ir3frmm0`

**Features:**
- Self-signup: Disabled (admins create accounts)
- MFA: Optional (can be enabled by users)
- Password Policy: 12 chars, complex
- Auth Flows: USER_PASSWORD, USER_SRP, ADMIN_USER_PASSWORD
- Custom Attributes: `custom:tenant_id`, `custom:roles`
- Groups: SuperAdmin, SchoolAdmin, Bursar, ExamsOfficer, Teacher

#### 2. Household User Pool
**Purpose:** Manages PARENT users

**Pool ID:** `af-south-1_ftmPG9Igx`
**Client ID:** `56n62a3crlnarqkq5gpkqctvoi`

**Features:**
- Self-signup: Enabled (parents can register)
- MFA: Disabled
- Password Policy: 8 chars, no special chars required
- Auth Flows: USER_PASSWORD, USER_SRP
- Custom Attributes: `custom:tenant_id`, `custom:household_id`

#### 3. Student User Pool
**Purpose:** Manages STUDENT users

**Pool ID:** `af-south-1_XOkbTw9L3`
**Client ID:** `5sjuqdlcc5jjhf07sg9gisg3dl`

**Features:**
- Self-signup: Disabled (teachers/admins create accounts)
- MFA: Disabled
- Password Policy: 6 chars, simple (student-friendly)
- Auth Flows: USER_PASSWORD, USER_SRP, ADMIN_USER_PASSWORD
- Custom Attributes: `custom:tenant_id`, `custom:student_id`

---

## 📦 SSM Parameters Created

The following parameters are stored in AWS Systems Manager Parameter Store for easy configuration retrieval:

```
/classpoint/dev/auth/staff-pool-id          = af-south-1_kqGYNh2kd
/classpoint/dev/auth/staff-client-id        = 2ue3pomcpsjvargqq0ir3frmm0
/classpoint/dev/auth/household-pool-id      = af-south-1_ftmPG9Igx
/classpoint/dev/auth/household-client-id    = 56n62a3crlnarqkq5gpkqctvoi
/classpoint/dev/auth/student-pool-id        = af-south-1_XOkbTw9L3
/classpoint/dev/auth/student-client-id      = 5sjuqdlcc5jjhf07sg9gisg3dl
```

---

## 🔧 API Configuration

The `.env` file has been created at `apps/api/.env` with the following configuration:

```env
# AWS Configuration
AWS_REGION=af-south-1

# Cognito User Pools - Staff
COGNITO_STAFF_POOL_ID=af-south-1_kqGYNh2kd
COGNITO_STAFF_CLIENT_ID=2ue3pomcpsjvargqq0ir3frmm0

# Cognito User Pools - Household (Parents)
COGNITO_HOUSEHOLD_POOL_ID=af-south-1_ftmPG9Igx
COGNITO_HOUSEHOLD_CLIENT_ID=56n62a3crlnarqkq5gpkqctvoi

# Cognito User Pools - Student
COGNITO_STUDENT_POOL_ID=af-south-1_XOkbTw9L3
COGNITO_STUDENT_CLIENT_ID=5sjuqdlcc5jjhf07sg9gisg3dl

# JWT Configuration
JWT_SECRET=classpoint-dev-secret-change-in-production-2025
JWT_EXPIRATION=1h
```

---

## 🚀 Next Steps

### 1. Test Authentication

Start the API server and test the authentication endpoints:

```bash
cd apps/api
pnpm install  # If not already done
pnpm start:dev
```

The API will be available at `http://localhost:3001`

### 2. Test Endpoints

#### Public Test Endpoint (No Auth Required)
```bash
curl http://localhost:3001/auth/public-test
```

#### Register a Test User
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.teacher@greenvalley.edu",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "Teacher",
    "role": "TEACHER",
    "phoneNumber": "+27821234567"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "cm4xxx",
    "email": "test.teacher@greenvalley.edu",
    "firstName": "Test",
    "lastName": "Teacher",
    "role": "TEACHER"
  }
}
```

#### Login
```bash
curl -X POST "http://localhost:3001/auth/login?role=TEACHER" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.teacher@greenvalley.edu",
    "password": "SecurePass123!"
  }'
```

#### Get Profile (Authenticated)
```bash
# Save the access token from login/register response
ACCESS_TOKEN="your-access-token-here"

curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Test Role-Based Access
```bash
# Teacher endpoint (should work for TEACHER role)
curl http://localhost:3001/auth/teacher-test \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Admin endpoint (should fail with 403 for TEACHER role)
curl http://localhost:3001/auth/admin-test \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3. Create Test Users in Cognito

You can create test users directly in AWS Cognito:

**Via AWS Console:**
1. Go to AWS Console → Cognito → User Pools
2. Select the appropriate pool (Staff/Household/Student)
3. Users → Create user
4. Fill in email, password, and custom attributes

**Via AWS CLI:**
```bash
# Create a test admin user
aws cognito-idp admin-create-user \
  --user-pool-id af-south-1_kqGYNh2kd \
  --username admin@greenvalley.edu \
  --user-attributes \
    Name=email,Value=admin@greenvalley.edu \
    Name=email_verified,Value=true \
    Name=given_name,Value=Admin \
    Name=family_name,Value=User \
    Name=custom:roles,Value=SCHOOL_ADMIN \
  --temporary-password TempPass123! \
  --profile futurelogix \
  --region af-south-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id af-south-1_kqGYNh2kd \
  --username admin@greenvalley.edu \
  --password SecurePass123! \
  --permanent \
  --profile futurelogix \
  --region af-south-1
```

### 4. Update Database URL

The `.env` file currently has a placeholder for `DATABASE_URL`. Update it with your actual database connection string:

```env
# Option 1: Direct RDS connection (if you have access)
DATABASE_URL=postgresql://classpoint_admin:password@your-rds-endpoint:5432/classpoint

# Option 2: Through bastion/tunnel (for development)
DATABASE_URL=postgresql://classpoint_admin:password@localhost:5432/classpoint
```

You can retrieve the database credentials from AWS Secrets Manager:

```bash
aws secretsmanager get-secret-value \
  --secret-id classpoint/db/dev \
  --profile futurelogix \
  --region af-south-1 \
  --query SecretString \
  --output text | jq
```

### 5. Run Database Migrations

If you haven't already, ensure the User table is created:

```bash
cd apps/api
pnpm prisma migrate dev --name add_user_table
```

Or if using the shared database package:

```bash
cd packages/db
pnpm prisma migrate dev
```

---

## 🧪 Testing Checklist

- [ ] API starts without errors
- [ ] Public endpoint returns 200
- [ ] User registration works
- [ ] User login works
- [ ] Profile endpoint requires authentication
- [ ] Role-based access control works
- [ ] Token refresh works
- [ ] Invalid credentials return 401
- [ ] Missing token returns 401
- [ ] Invalid role returns 403

---

## 📊 CloudFormation Stack Details

**Stack Name:** `ClassPoint-dev-Auth`
**Stack ARN:** `arn:aws:cloudformation:af-south-1:624914081304:stack/ClassPoint-dev-Auth/1eb7d930-b09b-11f0-9f2a-0e2401847c95`

**Resources Created:**
- 3 Cognito User Pools
- 3 Cognito User Pool Clients
- 6 SSM Parameters
- 5 Cognito User Pool Groups (Staff pool only)

**Stack Outputs:**
```
StaffUserPoolId = af-south-1_kqGYNh2kd
StaffUserPoolClientId = 2ue3pomcpsjvargqq0ir3frmm0
HouseholdUserPoolId = af-south-1_ftmPG9Igx
HouseholdUserPoolClientId = 56n62a3crlnarqkq5gpkqctvoi
StudentUserPoolId = af-south-1_XOkbTw9L3
StudentUserPoolClientId = 5sjuqdlcc5jjhf07sg9gisg3dl
```

---

## 🔐 Security Notes

### Production Recommendations

1. **Enable MFA:**
   - Enable required MFA for all SUPER_ADMIN users
   - Enable optional MFA for SCHOOL_ADMIN and TEACHER

2. **Update JWT Secret:**
   - Change the JWT_SECRET to a strong random value
   - Store in AWS Secrets Manager for production

3. **Configure OAuth Callbacks:**
   - Set up proper OAuth callback URLs for frontend app
   - Configure hosted UI if needed

4. **Set Up CloudWatch Alarms:**
   - Monitor failed login attempts
   - Alert on unusual authentication patterns
   - Track token refresh rates

5. **Enable Advanced Security:**
   - Enable Cognito Advanced Security features
   - Configure risk-based authentication
   - Set up IP address restrictions if needed

6. **Audit Logging:**
   - Enable CloudTrail for Cognito API calls
   - Set up S3 bucket for audit logs
   - Configure log retention policies

---

## 🛠️ Troubleshooting

### Issue: "Invalid or missing authentication token"

**Solution:** Ensure the Authorization header is set correctly:
```
Authorization: Bearer <access-token>
```

### Issue: "User not found"

**Solution:** The user may not exist in the database. Login creates the user record automatically on first login.

### Issue: "Insufficient permissions"

**Solution:** Check the user's role and the required roles for the endpoint. Use the @Roles() decorator on the endpoint.

### Issue: "Tenant is not active"

**Solution:** If you specified a tenantId during registration, ensure the tenant exists and has status ACTIVE.

### Issue: Connection timeout to Cognito

**Solution:**
- Check AWS credentials are configured correctly
- Verify network connectivity to af-south-1 region
- Check if AWS profile has necessary permissions

---

## 📚 Related Documentation

- [Authentication Module Documentation](./AUTHENTICATION_MODULE.md)
- [Tenant & Plan Implementation](./TENANT_PLAN_IMPLEMENTATION.md)
- [API Documentation](http://localhost:3001/api) (when API is running)

---

## ✅ Deployment Verification

To verify the deployment is working correctly:

```bash
# Test Cognito connectivity
aws cognito-idp describe-user-pool \
  --user-pool-id af-south-1_kqGYNh2kd \
  --profile futurelogix \
  --region af-south-1

# Test SSM parameter retrieval
aws ssm get-parameter \
  --name /classpoint/dev/auth/staff-pool-id \
  --profile futurelogix \
  --region af-south-1
```

---

**Deployment Status:** ✅ Complete
**Ready for Testing:** Yes
**Next Phase:** Integration Testing & Frontend Integration

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
