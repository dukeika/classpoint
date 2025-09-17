# 🛡️ AB Holistic Interview Portal — Enhanced Development Guidelines & Best Practices

## 📘 1. General Development Principles

### Modular Architecture
- Break the project into small, independent modules (Auth, Job Management, Written Tests, Video Tests, Applicant Portal, Admin Portal, Notifications)
- Use clear API contracts between modules
- **NEW**: Implement error boundaries for component isolation
- **NEW**: Use centralized error handling and logging across modules

### Code Consistency
- Use a consistent code style and formatting (Prettier, ESLint for JS/TS)
- Enforce consistent naming (PascalCase for components/classes, camelCase for variables/functions, SCREAMING_SNAKE_CASE for constants)
- **NEW**: 100% TypeScript usage - no `any` types allowed
- **NEW**: Comprehensive JSDoc documentation for all functions

### Documentation
Every module must include:
- README explaining purpose, dependencies, and setup
- Inline comments for complex logic
- Docstrings or JSDoc comments for all functions
- **NEW**: Component prop interfaces with detailed descriptions
- **NEW**: API endpoint documentation with error responses

### AI Usage Rule
AI should only generate code based on:
- Approved architecture & schema
- Validated prompts (describe module, inputs, outputs, constraints clearly)
- All generated code must pass automated lint, test, and security checks before integration
- **NEW**: Reference this updated documentation for consistency

## 🧩 2. Enhanced Naming Conventions

| Element | Convention | Example | Notes |
|---------|------------|---------|--------|
| Files | kebab-case | job-service.ts | |
| Components | PascalCase | VideoTestRecorder.tsx | **NEW**: Include display names |
| Functions | camelCase | submitApplication() | **NEW**: Prefix with handle/on for event handlers |
| Variables | camelCase | applicantStatus | |
| Constants | SCREAMING_SNAKE | MAX_VIDEO_DURATION | |
| Database Tables | PascalCase | Applicants, Jobs | |
| Database Fields | camelCase | applicantId, resumeUrl | |
| S3 Buckets | kebab-case + env suffix | abholistic-videos-prod | |
| **NEW**: Error Classes | PascalCase + Error | AuthenticationError | |
| **NEW**: Type Guards | is + Type | isValidUser() | |
| **NEW**: Custom Hooks | use + Purpose | useErrorHandler() | |

## 🔐 3. Enhanced Security Guidelines

### Authentication & Authorization
- Use AWS Cognito for user management
- Require MFA for admin accounts
- Use Cognito groups/roles (admin, applicant, superadmin)
- Use short-lived JWTs and refresh tokens
- **NEW**: Implement rate limiting on authentication endpoints
- **NEW**: Add IP-based access control for suspicious activities
- **NEW**: Comprehensive input validation and sanitization

### Storage Security
- Encrypt data at rest using AWS KMS (for DynamoDB, S3)
- Encrypt in transit (TLS 1.2+ via CloudFront & ACM)
- Use private S3 buckets with signed URLs for all file uploads/downloads
- **NEW**: Implement file type validation and virus scanning
- **NEW**: Add data encryption utilities for sensitive fields

### IAM & Access Control
- Follow principle of least privilege
- Separate IAM roles for Lambda execution, Frontend signed URL access, Admin and Applicant Cognito identities
- No hardcoded credentials or secrets — use AWS Secrets Manager or Parameter Store
- **NEW**: VPC configuration for Lambda functions
- **NEW**: Enhanced CORS configuration with specific origins

### Input Validation
- Sanitize all user input on both client and backend
- Enforce content-type validation for file uploads (PDF, DOCX only)
- **NEW**: Implement Joi/Zod schema validation
- **NEW**: Add request size limits and timeouts

### Web Security
- Enable AWS WAF (block XSS/SQLi)
- Set secure HTTP headers (CSP, X-Frame-Options, HSTS)
- Implement CSRF protection on all form submissions
- **NEW**: Add security middleware for all API endpoints
- **NEW**: Implement request correlation IDs for security auditing

## 💻 4. Enhanced Code Quality & Reliability

### Error Handling
- **NEW**: Centralized error handling with custom error classes
- **NEW**: Structured logging with correlation IDs
- **NEW**: React Error Boundaries for UI error isolation
- **NEW**: Async Error Boundaries for API operations
- **NEW**: User-friendly error messages with recovery options
- Always catch and log exceptions in Lambda
- Show user-friendly error messages, not raw errors

### Type Safety
- **NEW**: 100% TypeScript usage - absolutely no `any` types
- **NEW**: Comprehensive type definitions in shared types folder
- **NEW**: Type guards for runtime type checking
- **NEW**: Union types for better type safety
- Define shared types/interfaces in a types/ folder

### Testing
- **NEW**: Jest testing framework with 80% coverage requirement
- **NEW**: Unit tests for all services and utilities
- **NEW**: Integration tests for all API endpoints
- **NEW**: Component testing with React Testing Library
- **NEW**: End-to-end testing with Playwright
- **NEW**: Mock factories for consistent test data

### Performance
- **NEW**: React.memo for component optimization
- **NEW**: useMemo and useCallback for expensive operations
- **NEW**: Performance monitoring hooks
- **NEW**: DynamoDB connection pooling and caching
- **NEW**: Query optimization and pagination
- **NEW**: Response compression and optimization

### CI/CD
- Use GitHub Actions (or Amplify CI/CD) with:
  - Lint checks
  - Unit test runs
  - Security scan (npm audit, Snyk)
  - **NEW**: Type checking validation
  - **NEW**: Performance regression testing
  - Auto-deploy to dev/staging environments

## 🗃️ 5. Enhanced Data Management

### Database (DynamoDB)
- Define schema upfront (Jobs, Applicants, Applications, Tests)
- Use partition/sort keys for efficient queries
- Implement TTL on temporary records (e.g., video pre-signed URLs)
- **NEW**: Connection pooling for better performance
- **NEW**: Query optimization with proper indexing
- **NEW**: Caching layer for frequently accessed data

### File Storage (S3)
- Separate buckets for resumes and videos
- Organize by applicantId/jobId
- Enable versioning and lifecycle policies
- **NEW**: Multipart upload support for large files
- **NEW**: Automatic virus scanning integration
- **NEW**: File encryption at object level

### Backups & Recovery
- DynamoDB Point-in-Time Recovery enabled
- S3 versioning enabled
- Regular export to Glacier for archive
- **NEW**: Automated backup verification
- **NEW**: Disaster recovery procedures documented

## ⚡ 6. Enhanced Performance & Scalability

### Backend Performance
- **NEW**: Lambda function optimization with ARM64 architecture
- **NEW**: Connection pooling and reuse for external services
- **NEW**: Response caching for frequently accessed data
- **NEW**: Optimized cold start times with provisioned concurrency
- Use AWS Lambda + API Gateway (serverless, scalable)

### Frontend Performance
- **NEW**: Code splitting with Next.js dynamic imports
- **NEW**: Image optimization with Next.js Image component
- **NEW**: Performance monitoring with Web Vitals
- **NEW**: Lazy loading for non-critical components
- Enable CloudFront CDN for frontend
- Use lazy loading and code splitting in React app

### File Handling
- Use S3 multipart uploads for large video files
- **NEW**: Progressive video upload with pause/resume capability
- **NEW**: Client-side file compression before upload

## 📋 7. Enhanced Development Process

### Branching Strategy
- main (production), dev (staging), feature branches
- No direct commits to main — use pull requests
- **NEW**: Feature branch naming: feature/JIRA-123-description
- **NEW**: Hotfix branch support for critical issues

### Code Reviews
- All AI-generated code must be human-reviewed before merging
- Run lint + test checks before pull request approval
- **NEW**: Security review for all authentication/authorization changes
- **NEW**: Performance review for database queries and API endpoints

### Environment Management
- Separate AWS environments: dev, staging, prod
- Use environment variables via .env files or SSM Parameter Store
- **NEW**: Environment-specific configuration validation
- **NEW**: Blue-green deployment strategy for production

## 📊 8. Enhanced Observability & Monitoring

### Logging
- **NEW**: Structured JSON logging with correlation IDs
- **NEW**: Performance metrics logging
- **NEW**: Security audit logging
- Enable CloudWatch logs for all Lambdas
- Do not log sensitive data (PII) in CloudWatch logs

### Monitoring
- **NEW**: Custom CloudWatch dashboards
- **NEW**: Application performance monitoring
- **NEW**: User behavior analytics
- Set CloudWatch alarms on Lambda errors, API Gateway 5XX errors, DynamoDB throttling
- Use CloudTrail to audit all admin actions

### Alerting
- **NEW**: PagerDuty integration for critical alerts
- **NEW**: Slack notifications for deployment status
- **NEW**: Automated escalation procedures

## 🧪 9. Testing Standards

### Unit Testing
- **NEW**: 80% code coverage requirement
- **NEW**: Test-driven development for critical features
- **NEW**: Mock all external dependencies
- Jest for both frontend and backend testing

### Integration Testing
- **NEW**: API contract testing
- **NEW**: Database integration testing
- **NEW**: Third-party service integration testing

### End-to-End Testing
- **NEW**: Critical user journey testing
- **NEW**: Cross-browser compatibility testing
- **NEW**: Performance testing under load

## 🤖 10. AI Development Guidelines

### AI-Assisted Development
When using AI agents for code generation:
- Reference this documentation for consistency
- Specify security constraints and performance requirements
- Include error handling and logging requirements
- Validate generated code against type definitions
- **NEW**: Use agent-specific documentation for specialized tasks

### Agent-Specific Guidelines
- **react-ui-developer**: Focus on component reusability, accessibility, and performance
- **backend-architect**: Emphasize security, scalability, and error handling
- **aws-devops-engineer**: Prioritize monitoring, alerting, and deployment automation
- **code-quality-reviewer**: Enforce TypeScript standards and testing coverage

## 📈 11. Production Readiness Checklist

### Security
- ✅ All endpoints have authentication/authorization
- ✅ Input validation on all user inputs
- ✅ Rate limiting implemented
- ✅ Security headers configured
- ✅ No sensitive data in logs

### Performance
- ✅ Response times under 2 seconds
- ✅ Error rates under 1%
- ✅ 99.9% uptime SLA
- ✅ Caching implemented where appropriate
- ✅ Database queries optimized

### Reliability
- ✅ Error boundaries implemented
- ✅ Graceful degradation for failures
- ✅ Monitoring and alerting configured
- ✅ Backup and recovery procedures tested
- ✅ Disaster recovery plan documented

### Code Quality
- ✅ 80% test coverage achieved
- ✅ All TypeScript errors resolved
- ✅ No `any` types in codebase
- ✅ Security scan passed
- ✅ Performance benchmarks met

## 🚀 12. Current Implementation Status

### Completed Enhancements
- ✅ **Frontend**: React Error Boundaries, TypeScript improvements, Performance optimizations
- ✅ **Backend**: Centralized error handling, Security enhancements, Performance optimization
- ✅ **Testing**: Jest framework setup with coverage requirements
- ✅ **Deployment**: CloudFront CDN, Optimized serverless configuration
- ✅ **Documentation**: Updated development guidelines and best practices

### Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   API Gateway    │    │   Lambda        │
│   (Frontend)    │────│   (Backend API)  │────│   Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│      S3         │    │    DynamoDB      │    │    Cognito      │
│  (File Storage) │    │   (Database)     │    │   (Auth)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Live URLs
- **Production**: https://d8wgee9e93vts.cloudfront.net
- **API Backend**: https://7llou9r67j.execute-api.us-west-1.amazonaws.com/dev
- **Local Development**: http://localhost:3001

This enhanced development guide ensures consistency, quality, and security across all AI-assisted development activities while maintaining the original project vision and goals.