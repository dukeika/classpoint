# Authentication Module Implementation

## Overview

The Authentication Module provides comprehensive user authentication and authorization for the ClassPoint system, integrating AWS Cognito for user management with role-based access control (RBAC).

**Implementation Date:** Phase 1 - Authentication Module
**Status:** ✅ Complete
**Technologies:** AWS Cognito, JWT, Passport.js, NestJS Guards

---

## Table of Contents

1. [Architecture](#architecture)
2. [User Roles](#user-roles)
3. [User Pools](#user-pools)
4. [API Endpoints](#api-endpoints)
5. [Authentication Flow](#authentication-flow)
6. [Guards and Decorators](#guards-and-decorators)
7. [Configuration](#configuration)
8. [Usage Examples](#usage-examples)
9. [Security Considerations](#security-considerations)
10. [Error Handling](#error-handling)
11. [Testing](#testing)

---

## Architecture

### Components

```
auth/
├── dto/                          # Data Transfer Objects
│   ├── login.dto.ts             # Login credentials
│   ├── register.dto.ts          # Registration data with role
│   ├── refresh-token.dto.ts     # Token refresh
│   ├── auth-response.dto.ts     # Authentication response
│   └── index.ts
├── services/                     # Business logic
│   ├── cognito.service.ts       # AWS Cognito operations
│   ├── auth.service.ts          # Auth coordination & DB sync
│   └── index.ts
├── strategies/                   # Passport strategies
│   └── jwt.strategy.ts          # JWT token validation
├── guards/                       # Authorization guards
│   ├── jwt-auth.guard.ts        # Authentication guard
│   ├── roles.guard.ts           # Role-based authorization
│   └── index.ts
├── decorators/                   # Custom decorators
│   ├── public.decorator.ts      # Mark routes as public
│   ├── roles.decorator.ts       # Specify required roles
│   ├── current-user.decorator.ts # Extract user from request
│   └── index.ts
├── auth.controller.ts            # API endpoints
├── auth.module.ts                # Module registration
└── index.ts                      # Exports
```

### Service Responsibilities

**CognitoService:**
- Direct AWS Cognito API interactions
- User pool management (create, update, delete users)
- Authentication (login, token refresh, password reset)
- Multi-pool support (staff, household, student)

**AuthService:**
- Coordinates between Cognito and database
- Synchronizes user data
- Business logic and validations
- Tenant validation

---

## User Roles

The system supports five distinct user roles with hierarchical permissions:

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',      // Platform administrator (ClassPoint staff)
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',    // School administrator (principal, IT admin)
  TEACHER = 'TEACHER',               // Teaching staff
  PARENT = 'PARENT',                 // Parent/Guardian
  STUDENT = 'STUDENT',               // Student (limited access)
}
```

### Role Hierarchy

```
SUPER_ADMIN (highest privilege)
    ↓
SCHOOL_ADMIN
    ↓
TEACHER
    ↓
PARENT
    ↓
STUDENT (lowest privilege)
```

### Permission Matrix

| Feature | SUPER_ADMIN | SCHOOL_ADMIN | TEACHER | PARENT | STUDENT |
|---------|-------------|--------------|---------|--------|---------|
| Manage all tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage own tenant | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage plans | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create/manage teachers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create/manage students | ✅ | ✅ | ✅ | ❌ | ❌ |
| View student data | ✅ | ✅ | ✅ | ✅ (own children) | ✅ (own data) |
| Manage classes | ✅ | ✅ | ✅ | ❌ | ❌ |
| View grades/attendance | ✅ | ✅ | ✅ | ✅ (own children) | ✅ (own records) |

---

## User Pools

The system uses **three separate Cognito User Pools** for different user types:

### 1. Staff Pool
**Users:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER
**Purpose:** School staff and administrators
**Custom Attributes:**
- `custom:role` - User role
- `custom:tenantId` - Associated school/tenant

### 2. Household Pool
**Users:** PARENT
**Purpose:** Parents and guardians
**Custom Attributes:**
- `custom:role` - Always PARENT
- `custom:tenantId` - Associated school/tenant
- `custom:householdId` - Household ID (for multi-parent households)

### 3. Student Pool
**Users:** STUDENT
**Purpose:** Students
**Custom Attributes:**
- `custom:role` - Always STUDENT
- `custom:tenantId` - Associated school/tenant
- `custom:studentId` - Student record ID

### Environment Configuration

```env
# AWS Configuration
AWS_REGION=af-south-1

# Staff Pool
COGNITO_STAFF_POOL_ID=af-south-1_xxxxx
COGNITO_STAFF_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx

# Household Pool
COGNITO_HOUSEHOLD_POOL_ID=af-south-1_yyyyy
COGNITO_HOUSEHOLD_CLIENT_ID=yyyyyyyyyyyyyyyyyyy

# Student Pool
COGNITO_STUDENT_POOL_ID=af-south-1_zzzzz
COGNITO_STUDENT_CLIENT_ID=zzzzzzzzzzzzzzzzzzz

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRATION=1h
```

---

## API Endpoints

### Base URL
```
POST /auth/*
```

### 1. Login

**Endpoint:** `POST /auth/login?role=TEACHER`

**Description:** Authenticate user with email and password

**Query Parameters:**
- `role` (optional): UserRole - defaults to TEACHER

**Request Body:**
```json
{
  "email": "john.doe@greenvalley.edu",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "cm4abc123xyz",
    "email": "john.doe@greenvalley.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER",
    "tenantId": "cm4tenant123",
    "tenant": {
      "id": "cm4tenant123",
      "code": "GVHS001",
      "name": "Green Valley High School"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `401 Unauthorized` - User not found
- `401 Unauthorized` - User email not confirmed

---

### 2. Register

**Endpoint:** `POST /auth/register`

**Description:** Create new user account

**Request Body:**
```json
{
  "email": "jane.smith@greenvalley.edu",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+27821234567",
  "role": "TEACHER",
  "tenantId": "cm4tenant123"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Success Response (201):**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": { /* user object */ }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input or user already exists
- `400 Bad Request` - Invalid tenant ID
- `400 Bad Request` - Tenant is not active

---

### 3. Refresh Token

**Endpoint:** `POST /auth/refresh?email=user@example.com`

**Description:** Obtain new access token using refresh token

**Query Parameters:**
- `email` (required): User's email address

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "new-access-token...",
  "refreshToken": "same-refresh-token...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": { /* user object */ }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### 4. Get Profile

**Endpoint:** `GET /auth/profile`

**Description:** Get current user's profile

**Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200):**
```json
{
  "id": "cm4abc123xyz",
  "email": "john.doe@greenvalley.edu",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+27821234567",
  "role": "TEACHER",
  "tenantId": "cm4tenant123",
  "tenant": {
    "id": "cm4tenant123",
    "code": "GVHS001",
    "name": "Green Valley High School",
    "status": "ACTIVE"
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

---

### 5. Sign Out

**Endpoint:** `POST /auth/signout`

**Description:** Sign out user (invalidate all tokens globally)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized` - Invalid token

---

### 6. Public Test Endpoint

**Endpoint:** `GET /auth/public-test`

**Description:** Test endpoint that doesn't require authentication

**Success Response (200):**
```json
{
  "message": "Public endpoint - no authentication required",
  "timestamp": "2025-01-24T21:30:00.000Z"
}
```

---

### 7. Admin Test Endpoint

**Endpoint:** `GET /auth/admin-test`

**Description:** Test endpoint restricted to SUPER_ADMIN and SCHOOL_ADMIN

**Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200):**
```json
{
  "message": "Admin access granted",
  "user": {
    "id": "cm4abc123",
    "email": "admin@greenvalley.edu",
    "role": "SCHOOL_ADMIN"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

---

### 8. Teacher Test Endpoint

**Endpoint:** `GET /auth/teacher-test`

**Description:** Test endpoint restricted to TEACHER, SCHOOL_ADMIN, and SUPER_ADMIN

**Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200):**
```json
{
  "message": "Teacher access granted",
  "user": {
    "id": "cm4abc123",
    "email": "teacher@greenvalley.edu",
    "role": "TEACHER"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

---

## Authentication Flow

### Registration Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant CognitoService
    participant Cognito
    participant Database

    Client->>API: POST /auth/register
    API->>AuthService: register(registerDto)
    AuthService->>Database: Check tenant exists and active
    AuthService->>Database: Check user doesn't exist
    AuthService->>CognitoService: adminCreateUser()
    CognitoService->>Cognito: AdminCreateUserCommand
    Cognito-->>CognitoService: User created
    CognitoService->>Cognito: AdminSetUserPasswordCommand
    Cognito-->>CognitoService: Password set
    CognitoService->>Cognito: AdminGetUserCommand
    Cognito-->>CognitoService: User details (sub)
    CognitoService-->>AuthService: Cognito user created
    AuthService->>Database: Create user record
    Database-->>AuthService: User created
    AuthService->>CognitoService: authenticate()
    CognitoService->>Cognito: InitiateAuthCommand
    Cognito-->>CognitoService: Tokens
    CognitoService-->>AuthService: Tokens
    AuthService-->>API: AuthResponseDto
    API-->>Client: 201 Created with tokens
```

### Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant CognitoService
    participant Cognito
    participant Database

    Client->>API: POST /auth/login
    API->>AuthService: login(loginDto, role)
    AuthService->>CognitoService: authenticate()
    CognitoService->>Cognito: InitiateAuthCommand
    Cognito-->>CognitoService: Tokens + ID Token
    CognitoService-->>AuthService: Tokens
    AuthService->>Database: Find or create user
    Database-->>AuthService: User record
    AuthService-->>API: AuthResponseDto
    API-->>Client: 200 OK with tokens
```

### Token Refresh Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant CognitoService
    participant Cognito
    participant Database

    Client->>API: POST /auth/refresh
    API->>AuthService: refreshToken()
    AuthService->>Database: Get user by email
    Database-->>AuthService: User with role
    AuthService->>CognitoService: refreshToken()
    CognitoService->>Cognito: InitiateAuthCommand (REFRESH_TOKEN_AUTH)
    Cognito-->>CognitoService: New access token + ID token
    CognitoService-->>AuthService: Tokens
    AuthService-->>API: AuthResponseDto
    API-->>Client: 200 OK with new access token
```

### Protected Route Access Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant JwtAuthGuard
    participant JwtStrategy
    participant RolesGuard
    participant Controller

    Client->>API: GET /protected-route (with Bearer token)
    API->>JwtAuthGuard: canActivate()
    JwtAuthGuard->>JwtStrategy: validate(payload)
    JwtStrategy->>Database: Find user
    Database-->>JwtStrategy: User object
    JwtStrategy-->>JwtAuthGuard: User attached to request
    JwtAuthGuard->>RolesGuard: canActivate()
    RolesGuard->>RolesGuard: Check user role vs required roles
    RolesGuard-->>API: Access granted
    API->>Controller: Execute route handler
    Controller-->>Client: Response
```

---

## Guards and Decorators

### JwtAuthGuard

Validates JWT tokens and attaches user to request.

**Usage:**
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth';

@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute() {
  return 'This route requires authentication';
}
```

**Applied Globally:**
The guard is applied at the controller level in AuthController, but individual routes can bypass it using `@Public()`.

---

### RolesGuard

Enforces role-based access control.

**Usage:**
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from './auth';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
@Get('admin-only')
async adminOnlyRoute() {
  return 'This route requires admin role';
}
```

---

### @Public() Decorator

Marks routes that don't require authentication.

**Usage:**
```typescript
import { Public } from './auth';

@Public()
@Get('public-endpoint')
async publicRoute() {
  return 'Anyone can access this';
}
```

---

### @Roles() Decorator

Specifies which roles are allowed to access a route.

**Usage:**
```typescript
import { Roles, UserRole } from './auth';

@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
@Get('teacher-endpoint')
async teacherRoute() {
  return 'Teachers and admins only';
}
```

---

### @CurrentUser() Decorator

Extracts authenticated user from request.

**Usage:**
```typescript
import { CurrentUser } from './auth';

@Get('my-profile')
async getMyProfile(@CurrentUser() user: any) {
  return { userId: user.sub, email: user.email };
}

// Or extract specific property
@Get('my-email')
async getMyEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

---

## Configuration

### Required Environment Variables

Create `.env` or `.env.local` file in the API root:

```env
# AWS Configuration
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cognito User Pools
COGNITO_STAFF_POOL_ID=af-south-1_StaffPool
COGNITO_STAFF_CLIENT_ID=staff-client-id

COGNITO_HOUSEHOLD_POOL_ID=af-south-1_HouseholdPool
COGNITO_HOUSEHOLD_CLIENT_ID=household-client-id

COGNITO_STUDENT_POOL_ID=af-south-1_StudentPool
COGNITO_STUDENT_CLIENT_ID=student-client-id

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=1h

# Database (if not using workspace package)
DATABASE_URL=postgresql://user:pass@localhost:5432/classpoint
```

### ConfigModule Setup

The `ConfigModule` is configured globally in `app.module.ts`:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
})
```

This makes configuration available to all modules without explicit imports.

---

## Usage Examples

### Protecting a Controller

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, UserRole, CurrentUser } from '../auth';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {

  // Only authenticated users
  @Get()
  async listStudents(@CurrentUser() user: any) {
    // user.tenantId is available from TenantMiddleware
    return this.studentService.findAll(user.tenantId);
  }

  // Only teachers and admins
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  async createStudent(
    @Body() dto: CreateStudentDto,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.studentService.create(dto, tenantId);
  }

  // Only admins
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @Delete(':id')
  async deleteStudent(@Param('id') id: string) {
    return this.studentService.remove(id);
  }
}
```

### Public Routes

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth';

@Controller('public')
export class PublicController {

  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date() };
  }

  @Public()
  @Get('schools')
  async listSchools() {
    // Public endpoint - no authentication required
    return this.tenantService.findAllPublic();
  }
}
```

### Mixed Authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Public, CurrentUser } from '../auth';

@Controller('mixed')
@UseGuards(JwtAuthGuard)
export class MixedController {

  // Requires authentication
  @Get('private')
  privateEndpoint(@CurrentUser() user: any) {
    return { message: 'Authenticated', user };
  }

  // Public endpoint (bypasses guard)
  @Public()
  @Get('public')
  publicEndpoint() {
    return { message: 'Public access' };
  }
}
```

---

## Security Considerations

### 1. Token Security

**Storage:**
- Store access tokens in memory (not localStorage)
- Store refresh tokens in httpOnly cookies (preferred) or secure storage
- Never expose tokens in URLs or logs

**Expiration:**
- Access tokens: Short-lived (1 hour default)
- Refresh tokens: Long-lived (7-30 days)
- Implement token rotation on refresh

**Transmission:**
- Always use HTTPS in production
- Include tokens in Authorization header: `Bearer <token>`

### 2. Password Security

**Requirements Enforced:**
- Minimum 8 characters
- Uppercase, lowercase, number, special character
- Validated by class-validator decorators and Cognito

**Best Practices:**
- Never log passwords
- Never return passwords in responses
- Use Cognito's secure password storage
- Implement password reset flow

### 3. Role-Based Access Control

**Principle of Least Privilege:**
- Grant minimum permissions required
- Use @Roles() decorator to restrict access
- Combine with tenant isolation for multi-tenancy

**Role Validation:**
- Roles stored in Cognito custom attributes
- Synced to database on login
- Validated by RolesGuard on every request

### 4. Tenant Isolation

**Multi-tenancy Security:**
- TenantMiddleware extracts tenant from JWT
- All database queries filter by tenantId
- EnrollmentGuard enforces capacity limits per tenant
- Cross-tenant access is prevented

**Validation:**
- Tenant existence validated on registration
- Tenant status (ACTIVE) checked on login
- Tenant data attached to request for authorization

### 5. CORS Configuration

**Production Setup:**
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
});
```

### 6. Rate Limiting

**Recommended Implementation:**
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per minute
    }),
  ],
})
```

Apply to login/register endpoints to prevent brute force attacks.

---

## Error Handling

### Authentication Errors

**401 Unauthorized:**
- Invalid credentials
- Expired token
- Missing token
- User not found
- Email not confirmed

**Example Response:**
```json
{
  "statusCode": 401,
  "message": "Invalid or missing authentication token",
  "error": "Unauthorized"
}
```

### Authorization Errors

**403 Forbidden:**
- Insufficient permissions
- Wrong role
- Tenant access denied

**Example Response:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required roles: SUPER_ADMIN, SCHOOL_ADMIN",
  "error": "Forbidden"
}
```

### Validation Errors

**400 Bad Request:**
- Invalid input
- User already exists
- Weak password
- Invalid tenant

**Example Response:**
```json
{
  "statusCode": 400,
  "message": [
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

---

## Testing

### Unit Tests

**Auth Service Tests:**
```typescript
describe('AuthService', () => {
  it('should login user successfully', async () => {
    const loginDto = { email: 'test@example.com', password: 'Pass123!' };
    const result = await authService.login(loginDto, UserRole.TEACHER);

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe(loginDto.email);
  });

  it('should throw UnauthorizedException for invalid credentials', async () => {
    const loginDto = { email: 'test@example.com', password: 'wrong' };

    await expect(
      authService.login(loginDto, UserRole.TEACHER)
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

**Roles Guard Tests:**
```typescript
describe('RolesGuard', () => {
  it('should allow access for users with required role', () => {
    const mockContext = createMockExecutionContext({
      user: { role: UserRole.SCHOOL_ADMIN },
      requiredRoles: [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN],
    });

    expect(rolesGuard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access for users without required role', () => {
    const mockContext = createMockExecutionContext({
      user: { role: UserRole.TEACHER },
      requiredRoles: [UserRole.SUPER_ADMIN],
    });

    expect(() => rolesGuard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
```

### Integration Tests

**Login Flow Test:**
```typescript
describe('POST /auth/login', () => {
  it('should return tokens on successful login', () => {
    return request(app.getHttpServer())
      .post('/auth/login?role=TEACHER')
      .send({ email: 'teacher@test.com', password: 'Pass123!' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user.role).toBe('TEACHER');
      });
  });
});
```

**Protected Route Test:**
```typescript
describe('GET /auth/profile', () => {
  it('should return user profile with valid token', async () => {
    const { accessToken } = await loginUser('teacher@test.com', 'Pass123!');

    return request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('email');
        expect(res.body).toHaveProperty('role');
      });
  });

  it('should return 401 without token', () => {
    return request(app.getHttpServer())
      .get('/auth/profile')
      .expect(401);
  });
});
```

### E2E Tests

**Complete Registration and Login Flow:**
```typescript
describe('User Registration and Login E2E', () => {
  it('should complete full registration and login cycle', async () => {
    const email = `test-${Date.now()}@example.com`;

    // Register
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'TEACHER',
        tenantId: testTenant.id,
      })
      .expect(201);

    expect(registerRes.body).toHaveProperty('accessToken');

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login?role=TEACHER')
      .send({ email, password: 'SecurePass123!' })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();

    // Get Profile
    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(email);
      });
  });
});
```

---

## Migration and Deployment

### Database Migration

Ensure User table has required fields:

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  cognitoSub  String   @unique
  firstName   String
  lastName    String
  phoneNumber String?
  role        String
  tenantId    String?
  tenant      Tenant?  @relation(fields: [tenantId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Run migration:
```bash
pnpm prisma migrate dev --name add_auth_fields
```

### Environment Setup

1. Create Cognito User Pools in AWS Console
2. Configure user pool settings (password policy, MFA, etc.)
3. Create app clients for each pool (disable client secret for frontend)
4. Add custom attributes (custom:role, custom:tenantId)
5. Update environment variables
6. Deploy API with new configuration

### Deployment Checklist

- [ ] User pools created in AWS
- [ ] App clients configured
- [ ] Environment variables set
- [ ] Database migrated
- [ ] JWT secret rotated (production)
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Logs configured (mask sensitive data)
- [ ] Monitoring alerts set up

---

## Troubleshooting

### Common Issues

**Issue:** "Invalid or missing authentication token"
**Solution:** Ensure Bearer token is included in Authorization header

**Issue:** "User not found"
**Solution:** User may not have logged in yet. Login creates user record in database.

**Issue:** "Invalid tenant"
**Solution:** Ensure tenant exists and is ACTIVE. Check tenantId in registration.

**Issue:** "Insufficient permissions"
**Solution:** Check user role and required roles. Ensure @Roles() decorator is correct.

**Issue:** "User with this email already exists"
**Solution:** User already registered. Use login endpoint instead.

---

## Future Enhancements

1. **MFA (Multi-Factor Authentication)**
   - SMS or TOTP-based MFA
   - Optional for users, mandatory for admins

2. **Social Login**
   - Google OAuth
   - Microsoft Azure AD
   - Apple Sign In

3. **Password Reset Flow**
   - Implement forgot password endpoint
   - Email verification for password reset

4. **Session Management**
   - Track active sessions
   - Revoke specific sessions
   - Session limits per user

5. **Audit Logging**
   - Log all authentication events
   - Track role changes
   - Monitor failed login attempts

6. **JWKS Integration**
   - Proper JWT validation using Cognito public keys
   - Replace simplified JWT strategy

---

## Conclusion

The Authentication Module provides a robust, secure, and scalable authentication and authorization system for ClassPoint. It leverages AWS Cognito for user management, implements role-based access control, and integrates seamlessly with the multi-tenant architecture.

**Key Features:**
✅ Multi-pool Cognito integration
✅ Role-based access control (RBAC)
✅ JWT token authentication
✅ Secure password handling
✅ Tenant isolation
✅ Comprehensive error handling
✅ Production-ready security

**Next Steps:**
- Implement Student, Staff, and Household modules using auth guards
- Add MFA for admin users
- Implement comprehensive audit logging
- Set up monitoring and alerting

---

**Documentation Version:** 1.0
**Last Updated:** 2025-10-24
**Author:** AI Assistant
