# ClassPoint - School Management System

A comprehensive, multi-tenant school management system built with modern web technologies and deployed on AWS infrastructure.

## 🎯 Project Overview

ClassPoint is a full-stack school management platform designed to streamline academic administration, student enrollment, attendance tracking, assessment management, and communication between schools, teachers, parents, and students.

### Key Features

- **Multi-Tenancy**: Complete isolation between different schools/organizations
- **Role-Based Access Control (RBAC)**: 5 user roles with granular permissions
- **Academic Management**: Sessions, terms, classes, departments, and subjects
- **Enrollment & Fee Tracking**: Student registration, capacity management, and fee status
- **Attendance System**: Daily attendance with session tracking and reporting
- **Assessment & Grading**: Continuous assessment with weighted scoring
- **Reporting**: Comments, external report uploads, and result compilation
- **Communication**: School-wide and class-specific announcements
- **AWS Infrastructure**: Production-ready deployment on AWS (af-south-1)

## 🏗️ Architecture

### Technology Stack

**Frontend (Planned)**
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- React Query for data fetching

**Backend (Implemented)**
- NestJS with TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- AWS Cognito for user management

**Infrastructure (Deployed)**
- AWS CDK for infrastructure as code
- AWS RDS PostgreSQL (Multi-AZ)
- AWS Cognito User Pools
- AWS S3 for file storage
- VPC with public/private/isolated subnets
- RDS Proxy for connection pooling
- SSM Session Manager for secure access

### Monorepo Structure

```
my-turborepo/
├── apps/
│   ├── api/          # NestJS backend (✅ Implemented)
│   └── web/          # Next.js frontend (🔲 Planned)
├── packages/
│   ├── core/         # Shared business logic
│   ├── db/           # Prisma schema and client (✅ Implemented)
│   ├── auth/         # Authentication utilities
│   ├── comms/        # Communication utilities
│   └── ui/           # Shared UI components
├── infra/
│   └── cdk/          # AWS infrastructure (✅ Deployed)
└── docs/             # Documentation
```

## 📦 What's Inside?

### Apps and Packages

- **`apps/api`**: NestJS backend API with 11 modules and 105+ REST endpoints
- **`apps/web`**: Next.js frontend application (planned)
- **`@repo/db`**: Prisma schema, migrations, and database client
- **`@repo/core`**: Shared TypeScript types and business logic
- **`@repo/auth`**: Authentication and authorization utilities
- **`@repo/comms`**: Email, SMS, and notification services
- **`@repo/ui`**: Shared React component library
- **`@repo/eslint-config`**: ESLint configurations
- **`@repo/typescript-config`**: TypeScript configurations

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ (or use AWS RDS)
- AWS Account (for deployment)
- AWS CLI configured

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd classpoint/my-turborepo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   # Edit .env.local with your database and AWS credentials
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   cd packages/db
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   # From root directory
   npm run dev

   # Or run specific apps
   npm run dev --filter=api
   npm run dev --filter=web
   ```

### Environment Variables

Create `apps/api/.env.local` with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/classpoint?schema=public"

# AWS Cognito
AWS_REGION="af-south-1"
COGNITO_STAFF_POOL_ID="af-south-1_xxxxxxxxx"
COGNITO_STAFF_CLIENT_ID="xxxxxxxxxxxxxxxxxx"
COGNITO_HOUSEHOLD_POOL_ID="af-south-1_xxxxxxxxx"
COGNITO_HOUSEHOLD_CLIENT_ID="xxxxxxxxxxxxxxxxxx"
COGNITO_STUDENT_POOL_ID="af-south-1_xxxxxxxxx"
COGNITO_STUDENT_CLIENT_ID="xxxxxxxxxxxxxxxxxx"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# AWS S3
S3_REPORTS_BUCKET="classpoint-reports"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

## 🛠️ Development

### Build

```bash
# Build all packages and apps
npm run build

# Build specific app
npm run build --filter=api
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --filter=api
```

### Linting

```bash
# Lint all packages
npm run lint

# Lint specific package
npm run lint --filter=api
```

### Type Checking

```bash
# Type check all packages
npm run type-check
```

## 📚 API Documentation

The backend API is fully documented with Swagger/OpenAPI. Once the API is running, visit:

```
http://localhost:3000/api
```

### API Modules Overview

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | 6 | User authentication, registration, password management |
| **Tenant** | 10 | Tenant/school management with multi-tenancy |
| **Plan** | 6 | Subscription plans with student capacity limits |
| **Academic** | 39 | Sessions, terms, classes, departments, subjects |
| **Enrollment** | 11 | Student registration, class assignment, promotion |
| **Fee Status** | 10 | Fee payment tracking with audit logging |
| **Attendance** | 11 | Daily attendance with session tracking |
| **Assessment** | 6 | Grade entry, result compilation, publishing |
| **Comment** | 10 | Teacher/principal/housemaster comments |
| **External Report** | 9 | PDF/image uploads to S3 |
| **Announcement** | 10 | School-wide and class announcements |

**Total: 105+ REST endpoints**

### Quick API Examples

#### Authentication
```bash
# Register staff user
POST /auth/register
{
  "email": "teacher@school.com",
  "password": "SecurePass123!",
  "userType": "staff",
  "tenantId": "tenant-123",
  "role": "TEACHER"
}

# Login
POST /auth/login
{
  "email": "teacher@school.com",
  "password": "SecurePass123!"
}
```

#### Create Student
```bash
POST /students
Authorization: Bearer <token>
{
  "firstName": "John",
  "lastName": "Doe",
  "admissionNumber": "2024001",
  "dateOfBirth": "2010-05-15",
  "gender": "MALE"
}
```

#### Mark Attendance
```bash
POST /attendance/bulk
Authorization: Bearer <token>
{
  "classId": "class-123",
  "date": "2025-01-25",
  "session": "MORNING",
  "records": [
    { "studentId": "student-1", "status": "PRESENT" },
    { "studentId": "student-2", "status": "ABSENT" }
  ],
  "markedBy": "teacher-123"
}
```

See [API Documentation](./docs/API.md) for complete endpoint reference.

## 🏗️ Infrastructure

### AWS Architecture

The application is deployed on AWS in the **af-south-1 (Cape Town)** region with the following components:

- **VPC**: Multi-AZ with public, private, and isolated subnets
- **RDS PostgreSQL**: db.t4g.micro with automated backups
- **RDS Proxy**: Connection pooling and failover
- **Cognito**: 3 User Pools (Staff, Household, Student)
- **S3**: Encrypted storage with lifecycle policies
- **Bastion**: SSM-enabled EC2 for database access
- **CloudWatch**: Logging and monitoring

**Monthly Cost**: ~$50-75 USD

### Deploy Infrastructure

```bash
cd infra/cdk

# Install dependencies
npm install

# Bootstrap CDK (first time only)
npm run bootstrap

# Deploy all stacks
npm run deploy:dev

# Deploy specific stack
npm run deploy:database
npm run deploy:storage
```

### Database Access

```bash
# Start SSM tunnel to database
cd infra/cdk
npm run db:tunnel

# In another terminal, connect to database
npm run db:connect
```

See [Infrastructure Guide](./docs/INFRASTRUCTURE.md) for detailed deployment instructions.

## 🔒 Security

### Authentication & Authorization

- **JWT-based authentication** with AWS Cognito
- **Role-Based Access Control (RBAC)** with 5 roles:
  - `SUPER_ADMIN`: Full system access
  - `SCHOOL_ADMIN`: School-level administration
  - `TEACHER`: Teaching and grading access
  - `PARENT`: View-only access to children's data
  - `STUDENT`: View-only access to own data

### Multi-Tenancy

- Complete data isolation between tenants
- Tenant context extracted from JWT
- All queries filtered by `tenantId`
- Middleware enforces tenant isolation

### Data Protection

- Passwords hashed with AWS Cognito
- JWT tokens with expiration
- SQL injection prevention via Prisma
- Input validation with class-validator
- XSS protection
- HTTPS encryption in production

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Project Overview](./docs/OVERVIEW.md)
- [API Reference](./docs/API.md)
- [Authentication System](./docs/AUTHENTICATION_MODULE.md)
- [Tenant & Plan Management](./docs/TENANT_PLAN_IMPLEMENTATION.md)
- [Infrastructure Setup](./docs/INFRASTRUCTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Development Guide](./docs/DEVELOPMENT.md)

### Phase Summaries

- [Phase 0: Project Setup](./docs/PHASE_0_SUMMARY.md)
- [Phase 1 Week 1: Tenant & Auth](./docs/PHASE_1_WEEK_1_SUMMARY.md)
- [Phase 1 Week 2: Academic Structure](./docs/PHASE_1_WEEK_2_SUMMARY.md)
- [Phase 2 Week 5: Reporting & Communication](./docs/PHASE_2_WEEK_5_SUMMARY.md)

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## 🚢 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy infrastructure**
   ```bash
   cd infra/cdk
   npm run deploy:prod
   ```

3. **Run database migrations**
   ```bash
   cd packages/db
   npx prisma migrate deploy
   ```

4. **Deploy API** (AWS Lambda or ECS)
   ```bash
   # Deploy to AWS Lambda
   npm run deploy:api:prod
   ```

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 🗺️ Roadmap

### ✅ Completed (Phase 0-2, Weeks 1-5)

- [x] Project setup and infrastructure
- [x] Multi-tenant architecture
- [x] Authentication & authorization
- [x] Academic structure management
- [x] Enrollment & fee tracking
- [x] Attendance system
- [x] Assessment & grading
- [x] Reporting & communication

### 🔄 In Progress

- [ ] Frontend implementation
- [ ] Real-time notifications
- [ ] Email/SMS integration
- [ ] Report card PDF generation

### 📅 Planned

**Phase 3: Communication & Notifications**
- [ ] Push notifications
- [ ] Email service integration
- [ ] SMS gateway integration
- [ ] In-app messaging
- [ ] Parent-teacher chat

**Phase 4: Analytics & Reporting**
- [ ] Student performance dashboards
- [ ] Attendance analytics
- [ ] Fee collection reports
- [ ] Custom report builder
- [ ] Data export (CSV, Excel, PDF)

**Phase 5: Additional Features**
- [ ] Timetable management
- [ ] Library management
- [ ] Transport management
- [ ] Event calendar
- [ ] Online assignments
- [ ] Parent portal
- [ ] Mobile app (React Native)

## 📊 Project Statistics

- **Backend Modules**: 11
- **REST Endpoints**: 105+
- **Database Tables**: 25+
- **Lines of Code**: ~15,000+
- **AWS Resources**: 20+
- **Documentation Pages**: 10+

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Team

- **Project Lead**: [Your Name]
- **Backend Developer**: [Your Name]
- **Frontend Developer**: [Name]
- **DevOps Engineer**: [Name]

## 🙏 Acknowledgments

- [Turborepo](https://turborepo.org/) for the monorepo setup
- [NestJS](https://nestjs.com/) for the backend framework
- [Prisma](https://www.prisma.io/) for the database toolkit
- [AWS](https://aws.amazon.com/) for cloud infrastructure

## 📞 Support

- **Documentation**: [https://docs.classpoint.com](./docs)
- **Issues**: [GitHub Issues](https://github.com/your-org/classpoint/issues)
- **Email**: support@classpoint.com

## 🔗 Useful Links

### Turborepo
- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)

### NestJS
- [Documentation](https://docs.nestjs.com/)
- [Fundamentals](https://docs.nestjs.com/fundamentals)
- [Techniques](https://docs.nestjs.com/techniques)

### Prisma
- [Documentation](https://www.prisma.io/docs)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**Built with ❤️ using TypeScript, NestJS, Next.js, and AWS**
