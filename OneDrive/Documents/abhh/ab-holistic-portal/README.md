# 🧠 AB Holistic Interview Portal

A secure, cloud-native recruitment platform for Applied Behavioral Holistic Health, built on AWS serverless architecture.

## 🌐 **Live Application**

**Frontend:** http://ab-holistic-portal-frontend-dev-1757978890.s3-website-us-west-1.amazonaws.com
**API Endpoint:** https://7llou9r67j.execute-api.us-west-1.amazonaws.com/dev

### **Demo Credentials**
- **Admin:** `admin@abholistic.com` (any password)
- **Applicant:** Any email address (any password)

## 🚀 Quick Start

```bash
# Frontend Development
cd frontend
npm install
npm run dev          # Start development server
npm run build        # Build for production

# Backend Deployment
cd backend
npm run deploy:dev   # Deploy to AWS
```

## 📋 Project Overview

The AB Holistic Interview Portal implements a stage-gated recruitment process:

**Application Flow:** Apply → Written Test → Video Test → Final Interview → Decision

**Key Features:**
- 🔐 Role-based authentication (Admin & Applicant portals)
- 💼 Complete job lifecycle management (CRUD operations)
- 📋 Application tracking with stage progression
- 🔍 Advanced search and filtering capabilities
- 📝 Timed written assessments (single attempt) *[Coming Soon]*
- 🎥 Browser-based video recording *[Coming Soon]*
- 📊 Admin evaluation dashboard
- 🔒 End-to-end encryption and compliance
- 📧 Automated notifications *[Coming Soon]*

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, React Hook Form, Zod
- **Backend:** AWS Lambda, Node.js 18.x, Serverless Framework
- **Database:** Amazon DynamoDB
- **Storage:** Amazon S3 (static hosting + file storage)
- **Auth:** AWS Cognito (User Pools) + Mock Auth for development
- **API:** AWS API Gateway
- **Deployment:** S3 Static Website Hosting

## 📁 Project Structure

```
ab-holistic-portal/
├── frontend/          # React/Next.js Amplify app
├── backend/           # AWS Lambda functions
├── infrastructure/    # Infrastructure as Code
├── shared/           # Shared types and constants
├── docs/             # Documentation
├── tests/            # Test files
└── .github/          # CI/CD workflows
```

## 🎨 Design System

**AB Holistic Brand Colors:**
- Primary: `#2D5A4A` (Deep Teal)
- Secondary: `#F5E942` (Bright Yellow)
- Accent: `#000000` (Black)

## 🔐 Security Features

- AWS WAF protection (XSS/SQLi)
- Private S3 with signed URLs
- Data encryption at rest (KMS)
- TLS 1.2+ in transit
- Input validation & sanitization
- Audit logging & compliance

## 🏗️ **Current Implementation Status**

### ✅ **Completed Features**
- **Infrastructure:** Complete AWS serverless architecture deployed
- **Admin Portal:** Full job management system (create, view, edit, delete)
- **Application Tracking:** View and manage applications by job with stage progression
- **Applicant Portal:** Public job listings with search and filtering
- **Authentication:** Role-based access control with protected routes
- **UI/UX:** Professional design with AB Holistic branding

### 🚧 **In Progress**
- **Job Application Form:** Comprehensive application submission process
- **Applicant Dashboard:** Personal dashboard for tracking application status

### ⏳ **Planned Features**
- **Written Test Module:** Timed assessments with single-attempt enforcement
- **Video Test Recording:** Browser-based video recording system
- **Stage Management:** Admin controls for advancing/rejecting applications
- **Real Authentication:** AWS Cognito integration (currently using mock auth)
- **File Upload:** Resume and video upload to S3 buckets
- **Email Notifications:** Automated notifications for stage transitions

## 📚 Documentation

- [Current Status](./CURRENT_STATUS.md) - Detailed progress and next steps
- [Implementation Guide](../Implementation%20Guide.md) - Detailed build instructions
- [Development Guide](../Development%20guide.md) - Coding standards and best practices
- [Product Requirements](../Product%20Requirement.md) - Feature specifications

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

## 📊 Monitoring

- CloudWatch metrics and logs
- CloudTrail audit logging
- Performance monitoring
- Error tracking and alerts

## 🤝 Contributing

1. Follow the [Development Guide](../Development%20guide.md)
2. Create feature branches from `dev`
3. Submit PRs with comprehensive tests
4. All AI-generated code requires human review

## 📄 License

Proprietary - Applied Behavioral Holistic Health

---

## 🔗 **Quick Access Links**

### **Live Application**
- **Frontend:** http://ab-holistic-portal-frontend-dev-1757978890.s3-website-us-west-1.amazonaws.com
- **Admin Dashboard:** `/admin/dashboard`
- **Job Listings:** `/jobs`
- **Login:** `/auth/login`

### **Admin Portal Features**
- **Jobs Management:** `/admin/jobs`
- **Create Job:** `/admin/jobs/create`
- **View Applications:** `/admin/jobs/[id]/applications`

### **Development Resources**
- **API Endpoint:** https://7llou9r67j.execute-api.us-west-1.amazonaws.com/dev
- **S3 Buckets:** Resume and video storage configured
- **Cognito User Pool:** `us-west-1_n0Ij4uUuB`

---

**Built with ❤️ for AB Holistic Health** | **Last Updated:** January 2025