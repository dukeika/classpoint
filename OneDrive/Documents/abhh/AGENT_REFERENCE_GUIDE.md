# 🤖 AI Agent Reference Guide - AB Holistic Interview Portal

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Summary](#architecture-summary)
3. [Agent-Specific Guidelines](#agent-specific-guidelines)
4. [Code Quality Standards](#code-quality-standards)
5. [Security Requirements](#security-requirements)
6. [Performance Standards](#performance-standards)
7. [Testing Requirements](#testing-requirements)
8. [Deployment Information](#deployment-information)

## 🎯 Project Overview

The **AB Holistic Interview Portal** is an enterprise-grade, cloud-native recruitment platform featuring:

- **5-Stage Interview Process**: Application → Written Test → Video Test → Final Interview → Decision
- **Role-Based Access**: Admin, SuperAdmin, and Applicant user roles
- **Security-First Design**: End-to-end encryption, authentication, and audit logging
- **AWS Serverless Architecture**: Lambda, DynamoDB, S3, Cognito, CloudFront
- **Production Deployment**: Live at https://d8wgee9e93vts.cloudfront.net

### Current Implementation Status ✅
- **Code Quality Grade**: A- (upgraded from B+)
- **Security Score**: 9/10
- **Performance Score**: 9/10
- **Test Coverage**: 80% requirement implemented
- **TypeScript**: 100% usage, zero `any` types

## 🏗️ Architecture Summary

```
Frontend (Next.js 14 + TypeScript)
├── Enhanced Error Boundaries
├── Performance Optimizations (React.memo, useMemo)
├── Accessibility Compliance (WCAG 2.1 AA)
└── Type-Safe Components (no `any` types)

Backend (AWS Lambda + TypeScript)
├── Centralized Error Handling
├── Security Middleware & Rate Limiting
├── Performance Optimization & Caching
└── Comprehensive Type Definitions

Infrastructure (AWS Serverless)
├── CloudFront CDN Distribution
├── API Gateway with Lambda Functions
├── DynamoDB with Optimized Queries
├── S3 with Secure File Storage
└── Cognito Authentication
```

## 🤖 Agent-Specific Guidelines

### 🎨 react-ui-developer Agent

**Primary Focus**: Frontend component development, UI/UX implementation, accessibility

**Key Requirements**:
- **Error Handling**: Always implement Error Boundaries for new components
- **TypeScript**: Use strict typing, no `any` types, comprehensive interfaces
- **Performance**: Apply React.memo, useMemo, useCallback for optimization
- **Accessibility**: Include ARIA labels, keyboard navigation, screen reader support
- **Component Architecture**: Create reusable patterns with proper prop interfaces

**File Locations**:
- Components: `frontend/src/components/`
- Types: `frontend/src/types/`
- Hooks: `frontend/src/hooks/`
- Shared utilities: `frontend/src/utils/`

**Example Implementation Pattern**:
```typescript
interface ComponentProps {
  /** Clear prop description */
  data: SpecificType;
  /** Event handler with proper typing */
  onAction: (value: string) => void;
  /** Optional props with defaults */
  variant?: 'primary' | 'secondary';
}

const Component: React.FC<ComponentProps> = React.memo(({
  data,
  onAction,
  variant = 'primary'
}) => {
  // Implementation with error boundaries, accessibility, performance
});

Component.displayName = 'Component';
export default Component;
```

### 🏛️ backend-architect Agent

**Primary Focus**: Server-side logic, API design, database optimization, security

**Key Requirements**:
- **Error Handling**: Use centralized error classes from `utils/errors.ts`
- **Security**: Implement rate limiting, input validation, sanitization
- **Performance**: Apply caching, connection pooling, query optimization
- **TypeScript**: Use comprehensive types from `types/index.ts`
- **Testing**: Include unit tests with 80% coverage requirement

**File Locations**:
- Functions: `backend/src/functions/`
- Types: `backend/src/types/`
- Utils: `backend/src/utils/`
- Tests: `backend/src/**/__tests__/`

**Example Implementation Pattern**:
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createApiResponse, handleApiError } from '../utils/response';
import { validateInput } from '../utils/validation';
import { logInfo, logError } from '../utils/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const correlationId = event.requestContext.requestId;

  try {
    logInfo('Handler started', { correlationId });

    // Input validation
    const validatedData = validateInput(schema, JSON.parse(event.body || '{}'));

    // Business logic with error handling
    const result = await processRequest(validatedData);

    return createApiResponse(200, result);
  } catch (error) {
    logError('Handler failed', error, { correlationId });
    return handleApiError(error);
  }
};
```

### ☁️ aws-devops-engineer Agent

**Primary Focus**: Infrastructure management, deployment automation, monitoring

**Key Requirements**:
- **Deployment**: Use optimized serverless.yml configuration
- **Monitoring**: Implement CloudWatch dashboards and alarms
- **Security**: Configure VPC, encryption, access controls
- **Performance**: Optimize Lambda settings, caching strategies
- **Cost Optimization**: Use ARM64 architecture, proper resource sizing

**File Locations**:
- Configuration: `backend/serverless-optimized.yml`
- Infrastructure: `infrastructure/`
- Deployment scripts: `backend/scripts/`
- Monitoring: CloudWatch dashboards and alarms

**Deployment Commands**:
```bash
# Backend deployment
cd backend
npm run deploy:dev    # Development environment
npm run deploy:prod   # Production environment

# Frontend deployment (handled via CloudFront)
cd frontend
npm run build:prod
aws s3 sync out/ s3://bucket-name --delete
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

### 🏗️ system-architect Agent

**Primary Focus**: Architecture decisions, system design, integration patterns

**Key Requirements**:
- **Architecture**: Maintain serverless-first approach
- **Integration**: Design secure API contracts
- **Scalability**: Plan for growth and performance
- **Security**: Ensure end-to-end security architecture
- **Documentation**: Create architectural decision records (ADRs)

**Current Architecture Decisions**:
- Serverless-first with AWS Lambda
- Event-driven architecture with API Gateway
- NoSQL database with DynamoDB
- File storage with S3 and signed URLs
- Authentication with AWS Cognito
- CDN with CloudFront for global distribution

### 🔍 code-quality-reviewer Agent

**Primary Focus**: Code review, quality assurance, standards enforcement

**Key Requirements**:
- **TypeScript Standards**: Zero `any` types, comprehensive interfaces
- **Testing Coverage**: Minimum 80% coverage requirement
- **Security Review**: Check for vulnerabilities and best practices
- **Performance Review**: Identify optimization opportunities
- **Documentation**: Ensure comprehensive JSDoc coverage

**Review Checklist**:
- ✅ No `any` types in TypeScript code
- ✅ Error boundaries implemented for React components
- ✅ Input validation on all API endpoints
- ✅ Proper error handling and logging
- ✅ Performance optimizations applied
- ✅ Security best practices followed
- ✅ Test coverage meets requirements
- ✅ Documentation is comprehensive

### 🧪 e2e-qa-workflow-validator Agent

**Primary Focus**: End-to-end testing, workflow validation, user journey testing

**Key Requirements**:
- **User Journeys**: Test complete 5-stage interview process
- **Cross-Browser**: Validate across supported browsers
- **Performance**: Monitor load times and responsiveness
- **Security**: Test authentication and authorization flows
- **Accessibility**: Validate WCAG compliance

**Test Scenarios**:
1. Complete applicant registration and application flow
2. Admin job creation and management workflow
3. Written test creation and submission process
4. Video test recording and submission process
5. Stage progression and notification workflow

### 📝 documentation-generator Agent

**Primary Focus**: Documentation creation, maintenance, technical writing

**Key Requirements**:
- **API Documentation**: Update with current endpoints and responses
- **Component Documentation**: Document React component interfaces
- **Architecture Documentation**: Maintain system design documents
- **User Guides**: Create clear step-by-step instructions
- **Developer Onboarding**: Comprehensive setup and contribution guides

## 📊 Code Quality Standards

### TypeScript Requirements
- **Zero `any` types**: Use proper type definitions
- **Strict mode enabled**: Full TypeScript strict checking
- **Comprehensive interfaces**: Document all props and return types
- **Type guards**: Implement runtime type checking where needed
- **JSDoc comments**: Document all functions and complex logic

### Error Handling Standards
- **Frontend**: Use Error Boundaries for component isolation
- **Backend**: Use centralized error classes with correlation IDs
- **Logging**: Structured JSON logging with security considerations
- **User Experience**: Friendly error messages with recovery options

### Performance Standards
- **Frontend**: React.memo, useMemo, useCallback optimization
- **Backend**: Connection pooling, caching, query optimization
- **Response Times**: Under 2 seconds for all operations
- **Bundle Size**: Optimize with code splitting and lazy loading

### Security Standards
- **Authentication**: AWS Cognito with MFA for admins
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Server-side validation on all inputs
- **Rate Limiting**: Protect against abuse and attacks
- **Encryption**: End-to-end encryption for sensitive data

## 🧪 Testing Requirements

### Coverage Requirements
- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: All API endpoints
- **Component Tests**: All React components
- **E2E Tests**: Critical user journeys

### Testing Framework
- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright
- **Mocking**: Comprehensive mock factories

### Test Patterns
```typescript
// Unit test example
describe('ComponentName', () => {
  it('should handle user interaction correctly', () => {
    // Arrange, Act, Assert pattern
  });
});

// API test example
describe('API Endpoint', () => {
  it('should return valid response', async () => {
    // Test with proper mocking
  });
});
```

## 🚀 Deployment Information

### Live Environment
- **Frontend**: https://d8wgee9e93vts.cloudfront.net
- **Backend API**: https://7llou9r67j.execute-api.us-west-1.amazonaws.com/dev
- **Local Development**: http://localhost:3001

### Environment Configuration
- **Development**: Local development with mock authentication
- **Staging**: AWS deployment with test data
- **Production**: Full AWS deployment with real user data

### Deployment Process
1. **Code Quality Checks**: Lint, test, security scan
2. **Backend Deployment**: Serverless framework deployment
3. **Frontend Build**: Next.js static build
4. **CDN Update**: CloudFront invalidation
5. **Monitoring**: Verify deployment health

## 📋 Agent Interaction Guidelines

### When Working on Features
1. **Reference this documentation** for consistency
2. **Follow established patterns** from existing implementations
3. **Include error handling** and logging from the start
4. **Add tests** as part of the implementation
5. **Update documentation** when adding new features

### Communication Between Agents
- **Share context**: Include relevant file paths and implementation details
- **Maintain consistency**: Follow established naming and patterns
- **Document decisions**: Create ADRs for significant changes
- **Validate integration**: Ensure components work together properly

### Quality Assurance
- **Self-review**: Check against standards before completion
- **Peer review**: Request code-quality-reviewer validation
- **Testing**: Ensure adequate test coverage
- **Documentation**: Update relevant documentation

This guide ensures all AI agents maintain consistency, quality, and alignment with the AB Holistic Interview Portal's architecture and goals while preventing scope creep and maintaining focus on the original project vision.