# ClassPoint Documentation

Welcome to the ClassPoint School Management System documentation. This guide will help you understand, deploy, and develop with ClassPoint.

## 📚 Documentation Index

### Getting Started
- [Project Overview](../README.md) - High-level overview of the project
- [Quick Start Guide](#quick-start) - Get up and running in minutes
- [Development Guide](#development-guide) - Set up your development environment

### Architecture & Design
- [System Architecture](#system-architecture) - Overall system design
- [Database Schema](#database-schema) - Prisma schema and data models
- [Multi-Tenancy](#multi-tenancy) - How tenant isolation works
- [Authentication & Authorization](./AUTHENTICATION_MODULE.md) - JWT and RBAC implementation

### API Documentation
- [Complete API Reference](./API.md) - All 105+ REST endpoints documented
- [API Quick Reference](#api-quick-reference) - Common use cases
- [Swagger/OpenAPI](http://localhost:3000/api) - Interactive API documentation

### Feature Documentation
- [Tenant & Plan Management](./TENANT_PLAN_IMPLEMENTATION.md) - Multi-tenancy and subscription plans
- [Academic Structure](#academic-structure) - Sessions, terms, classes, departments, subjects
- [Enrollment System](#enrollment-system) - Student registration and class assignment
- [Fee Status Tracking](#fee-status-tracking) - Fee payment management with audit logs
- [Attendance System](#attendance-system) - Daily attendance tracking and reporting
- [Assessment & Grading](#assessment--grading) - Grade entry and result compilation
- [Reporting & Communication](./PHASE_2_WEEK_5_SUMMARY.md) - Comments, external reports, announcements

### Infrastructure & Deployment
- [AWS Infrastructure](#aws-infrastructure) - Infrastructure as code with CDK
- [Deployment Guide](#deployment-guide) - Deploy to production
- [Database Migrations](#database-migrations) - Managing schema changes
- [Environment Configuration](#environment-configuration) - Required environment variables

### Development
- [Project Structure](#project-structure) - Monorepo organization
- [Coding Standards](#coding-standards) - Code style and conventions
- [Testing Guide](#testing-guide) - Unit, integration, and E2E tests
- [Contributing](#contributing) - How to contribute to the project

### Phase Summaries
- [Phase 0: Project Setup](./PHASE_0_SUMMARY.md) - Infrastructure and project initialization
- [Phase 1 Week 1: Tenant & Auth](./PHASE_1_WEEK_1_SUMMARY.md) - Multi-tenancy and authentication
- [Phase 1 Week 2: Academic Structure](./PHASE_1_WEEK_2_SUMMARY.md) - Academic management modules
- [Phase 2 Week 5: Reporting & Communication](./PHASE_2_WEEK_5_SUMMARY.md) - Reporting and announcements

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- AWS Account (for deployment)
- AWS CLI configured

### Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd classpoint/my-turborepo
   npm install
   ```

2. **Configure environment**
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   # Edit .env.local with your credentials
   ```

3. **Set up database**
   ```bash
   cd packages/db
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start development server**
   ```bash
   npm run dev --filter=api
   ```

API will be available at `http://localhost:3000`

---

## System Architecture

### Technology Stack

**Backend**
- NestJS - Progressive Node.js framework
- Prisma - Next-generation ORM
- PostgreSQL - Relational database
- AWS Cognito - User authentication
- AWS S3 - File storage

**Frontend** (Planned)
- Next.js 14+ - React framework
- TypeScript - Type-safe JavaScript
- Tailwind CSS - Utility-first CSS
- React Query - Data fetching

**Infrastructure**
- AWS CDK - Infrastructure as code
- AWS RDS - Managed PostgreSQL
- AWS VPC - Network isolation
- AWS CloudWatch - Logging and monitoring

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Web App    │  │  Mobile App  │  │  Admin Panel │  │
│  │  (Next.js)   │  │ (React Native)│ │  (Next.js)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway Layer                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │           NestJS REST API (105+ endpoints)       │  │
│  │  • JWT Authentication  • RBAC Authorization      │  │
│  │  • Multi-tenant Middleware  • Validation         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ AWS Cognito  │  │ PostgreSQL   │  │   AWS S3     │
│ (User Pools) │  │   (RDS)      │  │ (File Store) │
│              │  │              │  │              │
│ • Staff      │  │ • 25+ Tables │  │ • Reports    │
│ • Household  │  │ • Multi-tenant│ │ • Documents │
│ • Student    │  │ • ACID        │ │ • Images    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Database Schema

The database uses Prisma ORM with PostgreSQL. Key entities:

### Core Entities
- **Tenant** - School/organization
- **Plan** - Subscription plan with student capacity
- **User** - System users (staff, household, student)
- **Student** - Student profiles
- **Household** - Parent/guardian information

### Academic Structure
- **Session** - Academic year (e.g., 2024/2025)
- **Term** - School term (First, Second, Third)
- **Class** - Grade level and section (e.g., Primary 1A)
- **Department** - Subject grouping (e.g., Sciences)
- **Subject** - Individual subjects (e.g., Mathematics)

### Operations
- **Enrollment** - Student class assignments
- **FeeStatus** - Fee payment tracking
- **Attendance** - Daily attendance records
- **Assessment** - Assignments and exams
- **Grade** - Student scores

### Reporting & Communication
- **Comment** - Teacher/principal/housemaster comments
- **ExternalReport** - Uploaded report files
- **Announcement** - School-wide and class announcements

See [Prisma Schema](../packages/db/prisma/schema.prisma) for complete definitions.

---

## Multi-Tenancy

ClassPoint uses a **shared database, isolated data** multi-tenancy model:

### How It Works

1. **Tenant Identification**
   - Each tenant (school) has a unique `tenantId`
   - Tenant context extracted from JWT token
   - Middleware automatically filters all queries by `tenantId`

2. **Data Isolation**
   ```typescript
   // Automatic tenant filtering
   @TenantId() tenantId: string

   // All queries include tenant filter
   await prisma.student.findMany({
     where: { tenantId }
   });
   ```

3. **Cross-Tenant Prevention**
   - No cross-tenant data access
   - Tenant isolation enforced at middleware level
   - Database-level constraints for additional security

### Tenant Management

```typescript
// Create tenant
POST /tenants
{
  "name": "Greenfield Academy",
  "subdomain": "greenfield",
  "planId": "plan-123"
}

// Each tenant gets:
// - Unique subdomain
// - Isolated data
// - Separate Cognito user pool
// - Plan-based student capacity
```

---

## API Quick Reference

### Authentication
```bash
# Register
POST /auth/register

# Login
POST /auth/login

# Refresh token
POST /auth/refresh
```

### Common Operations
```bash
# Create student
POST /students

# Enroll student
POST /enrollments

# Mark attendance
POST /attendance/bulk

# Enter grades
POST /assessments/grades/bulk

# Create announcement
POST /announcements
```

See [Complete API Reference](./API.md) for all endpoints.

---

## AWS Infrastructure

### Deployed Resources

**Network**
- VPC with Multi-AZ subnets
- NAT Gateway for private subnets
- Security groups for access control
- VPC Flow Logs for monitoring

**Compute**
- EC2 Bastion (t4g.nano) with SSM
- Future: ECS/Lambda for API

**Database**
- RDS PostgreSQL 15 (db.t4g.micro)
- RDS Proxy for connection pooling
- Automated backups
- Multi-AZ deployment

**Authentication**
- 3 Cognito User Pools (Staff, Household, Student)
- JWT token generation
- Password policies

**Storage**
- S3 bucket with KMS encryption
- Lifecycle policies
- Versioning enabled

**Monitoring**
- CloudWatch Logs
- CloudWatch Metrics
- VPC Flow Logs

### Monthly Cost
~$50-75 USD for development environment

### Deployment

```bash
cd infra/cdk

# Deploy all stacks
npm run deploy:dev

# Deploy specific stack
npm run deploy:database
npm run deploy:storage
```

---

## Development Guide

### Project Structure

```
my-turborepo/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── tenant/        # Tenant management
│   │   │   ├── academic/      # Academic structure
│   │   │   ├── enrollment/    # Enrollment system
│   │   │   ├── attendance/    # Attendance tracking
│   │   │   ├── assessment/    # Grading system
│   │   │   ├── comment/       # Report comments
│   │   │   ├── external-report/ # File uploads
│   │   │   ├── announcement/  # Announcements
│   │   │   └── common/        # Shared utilities
│   │   └── test/              # E2E tests
│   └── web/                   # Next.js frontend (planned)
├── packages/
│   ├── db/                    # Prisma schema & client
│   ├── core/                  # Shared business logic
│   ├── auth/                  # Auth utilities
│   └── ui/                    # Shared components
├── infra/
│   └── cdk/                   # AWS infrastructure
└── docs/                      # Documentation
```

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-module
   ```

2. **Develop with hot reload**
   ```bash
   npm run dev --filter=api
   ```

3. **Run tests**
   ```bash
   npm test --filter=api
   ```

4. **Lint and format**
   ```bash
   npm run lint --filter=api
   npm run format
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new module"
   git push origin feature/new-module
   ```

---

## Testing Guide

### Unit Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Structure
```typescript
describe('StudentService', () => {
  let service: StudentService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [StudentService, PrismaService],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  it('should create a student', async () => {
    const result = await service.create(tenantId, createDto);
    expect(result).toHaveProperty('id');
  });
});
```

---

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/classpoint"

# AWS Region
AWS_REGION="af-south-1"

# Cognito - Staff Pool
COGNITO_STAFF_POOL_ID="af-south-1_xxxxxxxxx"
COGNITO_STAFF_CLIENT_ID="xxxxxxxxxxxxxxxxxx"

# Cognito - Household Pool
COGNITO_HOUSEHOLD_POOL_ID="af-south-1_xxxxxxxxx"
COGNITO_HOUSEHOLD_CLIENT_ID="xxxxxxxxxxxxxxxxxx"

# Cognito - Student Pool
COGNITO_STUDENT_POOL_ID="af-south-1_xxxxxxxxx"
COGNITO_STUDENT_CLIENT_ID="xxxxxxxxxxxxxxxxxx"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"

# S3
S3_REPORTS_BUCKET="classpoint-reports"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# Application
NODE_ENV="development"
PORT="3000"
```

---

## Database Migrations

### Create Migration
```bash
cd packages/db
npx prisma migrate dev --name add_new_field
```

### Apply Migrations
```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Reset Database
```bash
npx prisma migrate reset
```

### View Database
```bash
npx prisma studio
```

---

## Coding Standards

### TypeScript
- Use strict mode
- Explicit return types
- No `any` types
- Prefer interfaces over types

### NestJS
- Use dependency injection
- One service per entity
- DTOs for all inputs
- Use decorators for validation

### Naming Conventions
- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `IPascalCase` or `PascalCase`

### Example Module Structure
```typescript
// DTOs
export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;
}

// Service
@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: { ...dto, tenantId }
    });
  }
}

// Controller
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  create(@TenantId() tenantId: string, @Body() dto: CreateStudentDto) {
    return this.studentService.create(tenantId, dto);
  }
}
```

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone <your-fork-url>
   cd classpoint/my-turborepo
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature
   ```

4. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   ```

### PR Guidelines
- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Follow code style guidelines

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Prisma Client Out of Sync**
```bash
cd packages/db
npx prisma generate
```

**AWS Credentials Not Found**
```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## Support

### Documentation
- [Main README](../README.md)
- [API Reference](./API.md)
- [AWS Infrastructure](#aws-infrastructure)

### Community
- **GitHub Issues**: [Report bugs](https://github.com/your-org/classpoint/issues)
- **Discussions**: [Ask questions](https://github.com/your-org/classpoint/discussions)
- **Email**: support@classpoint.com

### Professional Support
For enterprise support, contact: enterprise@classpoint.com

---

## License

This project is licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

**Last Updated**: January 2025
**Version**: 1.0.0 (Phase 2 Complete)
