# AB Holistic Interview Portal

## Overview

AB Holistic Interview Portal is a comprehensive web application designed to streamline the job application and recruitment process. Built with modern web technologies and AWS cloud services, the platform provides robust job management and application tracking capabilities.

## Documentation

We've prepared comprehensive documentation to help you understand, set up, and contribute to the project:

- [System Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Authentication System](AUTHENTICATION_SYSTEM.md)
- [Authentication Setup](AUTHENTICATION_SETUP.md)
- [Authentication Troubleshooting](AUTHENTICATION_TROUBLESHOOTING.md)
- [Development Workflow](docs/DEVELOPMENT.md)

## Key Features

- Admin Job Management
  - Create, edit, delete, and publish job listings
- Job Application System
- User Authentication and Authorization
- Resume File Uploads
- Application Tracking and Management

## System Requirements

### Frontend
- Node.js 18+
- npm 9+
- Next.js 14+
- React 18+
- TypeScript

### Backend
- AWS Lambda
- Node.js 18+
- Serverless Framework

## Quick Start

### Prerequisites

- AWS Account
- AWS CLI configured
- Node.js and npm installed
- Serverless Framework (`npm install -g serverless`)

### Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/your-org/ab-holistic-portal.git
cd ab-holistic-portal
```

2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Configure Environment Variables
- Copy `.env.example` to `.env.development`
- Fill in AWS credentials and configuration

4. Start Development Servers
```bash
# Frontend
npm run dev

# Backend
serverless offline
```

## Authentication Configuration

### Environment Variables

```bash
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-west-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-west-1_n0Ij4uUuB
NEXT_PUBLIC_COGNITO_CLIENT_ID=3npp9udv9uarhb2ob18sj7jgvl
NEXT_PUBLIC_COGNITO_DOMAIN=ab-holistic-portal.auth.us-west-1.amazoncognito.com

# API Endpoint
NEXT_PUBLIC_API_ENDPOINT=https://04efp4qnv4.execute-api.us-west-1.amazonaws.com/prod

# Callback URLs
NEXT_PUBLIC_PROD_CALLBACK_URL=https://d8wgee9e93vts.cloudfront.net/auth/callback.html
NEXT_PUBLIC_DEV_CALLBACK_URL=http://localhost:3000/auth/callback
```

### Authentication Features
- OAuth 2.0 Authorization Code Flow
- AWS Cognito User Pool Authentication
- Role-based Access Control
- Secure Token Management
- Multi-environment Support

## Contributing

Please read our [Development Guide](docs/DEVELOPMENT.md) for contribution guidelines and workflow.

## Troubleshooting

Consult our [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for common issues and solutions.

## License

[Specify your license here]

## Contact

[Provide contact information for support and inquiries]
