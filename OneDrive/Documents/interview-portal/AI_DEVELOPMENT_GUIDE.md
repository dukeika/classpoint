# ProRecruit AI Development Guide
*Comprehensive Rules and Guidelines for AI Assistant Development*

---

## **🎯 PROJECT OVERVIEW**

**Project Name**: ProRecruit - Professional Recruitment Platform  
**Type**: Multi-tenant SaaS Interview Management System  
**Status**: 95% Complete - Production Ready  
**Target**: AWS Amplify Deployment  

### **Mission Statement**
Build a production-grade, scalable recruitment platform that streamlines the hiring process through a seamless 4-stage candidate evaluation workflow with complete admin oversight.

---

## **📋 CORE PRINCIPLES & RULES**

### **🔒 SECURITY FIRST**
1. **NEVER expose credentials** in code or commit them to git
2. **ALWAYS use environment variables** for sensitive configuration
3. **IMPLEMENT proper authentication** checks before data access
4. **VALIDATE all user inputs** and sanitize data
5. **FOLLOW AWS security best practices** for all services
6. **USE HTTPS only** for all external communications

### **⚡ PRODUCTION QUALITY STANDARDS**
1. **WRITE clean, maintainable TypeScript** with proper types
2. **IMPLEMENT comprehensive error handling** with graceful fallbacks
3. **ADD proper logging** for debugging and monitoring
4. **OPTIMIZE for performance** - lazy loading, caching, minimal re-renders
5. **ENSURE mobile responsiveness** across all components
6. **MAINTAIN consistent code style** using project's ESLint configuration

### **🧪 TESTING & VALIDATION**
1. **TEST all features thoroughly** before marking complete
2. **VERIFY authentication flows** across all user roles
3. **VALIDATE GraphQL operations** and handle API errors
4. **CHECK mobile responsiveness** on different screen sizes
5. **CONFIRM data persistence** and state management
6. **TEST file upload/download** functionality

---

## **🏗️ ARCHITECTURE GUIDELINES**

### **📁 Project Structure Rules**
```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication routes
│   ├── admin/             # Super admin pages
│   ├── company/           # Company admin pages
│   ├── candidate/         # Candidate pages
│   └── api/               # API routes
├── components/
│   ├── admin/             # Admin-specific components
│   ├── candidate/         # Candidate-specific components
│   ├── company/           # Company admin components
│   ├── shared/            # Reusable components
│   ├── ui/                # Base UI components
│   └── auth/              # Authentication components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
├── services/              # API service layers
└── types/                 # TypeScript type definitions
```

### **🎨 Component Development Rules**
1. **USE TypeScript interfaces** for all component props
2. **IMPLEMENT proper error boundaries** for critical components
3. **FOLLOW React hooks best practices** - proper dependencies
4. **OPTIMIZE re-renders** using React.memo, useMemo, useCallback
5. **MAINTAIN consistent naming** - PascalCase for components
6. **DOCUMENT complex components** with JSDoc comments

### **🔄 State Management Rules**
1. **USE React Context** for global state (auth, theme)
2. **IMPLEMENT local state** for component-specific data
3. **CACHE API responses** using React Query/TanStack Query
4. **PERSIST user preferences** in localStorage when appropriate
5. **HANDLE loading and error states** consistently

---

## **🚀 AWS AMPLIFY INTEGRATION**

### **🔐 Authentication (Cognito)**
```typescript
// ALWAYS follow this authentication pattern
const { user, userRole, loading, signIn, signOut } = useAuth();

// Role-based access control
if (userRole !== 'super_admin') {
  return <UnauthorizedComponent />;
}

// Hard-coded super admin emails (SECURITY REQUIREMENT)
const SUPER_ADMIN_EMAILS = [
  'dukeika@gmail.com',
  'admin@prorecruit.ng',
  'admin@abhh.com',
  'superadmin@prorecruit.ng',
  'support@prorecruit.ng'
];
```

### **📡 GraphQL (AppSync)**
```typescript
// ALWAYS use proper error handling
try {
  const result = await client.graphql({
    query: listUsers,
    variables: { limit: 100 }
  });
  return result.data.listUsers.items;
} catch (error) {
  console.error('GraphQL Error:', error);
  // IMPLEMENT graceful fallback
  return mockData || [];
}
```

### **📁 File Storage (S3)**
```typescript
// ALWAYS validate file types and sizes
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Proper file upload pattern
await Storage.put(key, file, {
  level: 'private',
  contentType: file.type,
  metadata: { originalName: file.name }
});
```

---

## **🎭 USER ROLES & PERMISSIONS**

### **👑 Super Admin (Platform Management)**
- **Full access** to all companies and users
- **User approval** and company management
- **Platform analytics** and system monitoring
- **Route**: `/admin/dashboard`

### **🏢 Company Admin (Hiring Management)**
- **Limited to own company** data only
- **Job posting** and candidate management
- **Stage progression** approval authority
- **Route**: `/company/dashboard`

### **👤 Candidate (Application Tracking)**
- **Own applications** and profile only
- **Test taking** and interview participation
- **Progress monitoring** and notifications
- **Route**: `/candidate/dashboard`

---

## **🔄 4-STAGE WORKFLOW IMPLEMENTATION**

### **Stage 1: Application Review**
```typescript
// Admin must approve to progress
const approveApplicationStage = async (applicationId: string) => {
  await applicationService.updateStage(applicationId, {
    currentStage: 2,
    applicationStatus: 'COMPLETED',
    writtenTestStatus: 'PENDING'
  });
  
  // ALWAYS send notification
  await notificationService.send({
    type: 'STAGE_PROGRESSION',
    recipientId: candidateId,
    message: 'Congratulations! Your application has been approved for the written test.'
  });
};
```

### **Stage 2-4: Test and Interview Management**
- **IMPLEMENT proper test interfaces** with timer functionality
- **STORE video recordings** securely in S3
- **PROVIDE admin review screens** for all assessments
- **ENABLE interview scheduling** with calendar integration

---

## **🔔 NOTIFICATION SYSTEM RULES**

### **Real-time Notifications**
```typescript
// ALWAYS implement these notification types
enum NotificationType {
  STAGE_PROGRESSION = 'STAGE_PROGRESSION',
  TEST_AVAILABLE = 'TEST_AVAILABLE',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  APPLICATION_UPDATE = 'APPLICATION_UPDATE'
}

// Notification persistence
const notification = {
  id: generateId(),
  type: NotificationType.STAGE_PROGRESSION,
  recipientId: userId,
  title: 'Application Update',
  message: 'Your application has progressed to the next stage.',
  read: false,
  createdAt: new Date().toISOString()
};
```

---

## **⚙️ DEVELOPMENT WORKFLOW**

### **🏗️ Feature Development Process**
1. **CREATE TodoList** for complex features (use TodoWrite tool)
2. **READ existing code** to understand patterns
3. **FOLLOW established conventions** in the codebase
4. **IMPLEMENT with proper TypeScript** types
5. **ADD error handling** and loading states
6. **TEST thoroughly** across user roles
7. **UPDATE relevant documentation**

### **🔧 Code Quality Checklist**
- [ ] TypeScript compilation passes
- [ ] ESLint rules followed
- [ ] Proper error handling implemented
- [ ] Loading states added
- [ ] Mobile responsive design
- [ ] Authentication checks in place
- [ ] GraphQL operations tested
- [ ] File upload/download tested

### **📦 Deployment Checklist**
- [ ] Environment variables secured
- [ ] AWS credentials properly managed
- [ ] GraphQL schema deployed
- [ ] S3 bucket permissions configured
- [ ] Cognito user pools tested
- [ ] API endpoints functional
- [ ] Build process successful

---

## **🎨 UI/UX STANDARDS**

### **🎯 Design Principles**
- **Consistent color scheme** using Tailwind CSS classes
- **Responsive design** with mobile-first approach
- **Clear visual hierarchy** with proper typography
- **Accessible components** following WCAG guidelines
- **Loading states** for all async operations
- **Error states** with helpful messages

### **📱 Component Patterns**
```tsx
// Standard component structure
interface ComponentProps {
  data: DataType[];
  onAction: (id: string) => void;
  loading?: boolean;
  error?: string;
}

export default function Component({ data, onAction, loading, error }: ComponentProps) {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data.length) return <EmptyState />;
  
  return (
    <div className="space-y-4">
      {/* Component content */}
    </div>
  );
}
```

---

## **🚨 AUTHENTICATION TROUBLESHOOTING**

### **🔍 Common Authentication Issues**

#### **Issue: "UserNotFoundException: User does not exist"**
**Root Cause**: App pointing to wrong User Pool or AWS account

**Diagnosis Steps**:
1. Check environment variables in deployment
2. Verify User Pool ID is exactly: `eu-west-2_FpwJJthe4`
3. Confirm AWS credentials point to account `624914081304`
4. Test admin user exists: `node scripts/list-admins.js`

**Solution**:
```bash
# Verify user exists in correct User Pool
AWS_REGION=eu-west-2 node scripts/list-admins.js
```

#### **Issue: Login Redirects to Candidate Portal Instead of Admin Dashboard**
**Root Cause**: Environment variable mismatch or cached authentication

**Solution**:
1. Clear browser cache completely
2. Check `/debug-auth` page on deployed URL
3. Verify environment variables match production values
4. Test in incognito/private mode

#### **Issue: Cognito Identity Pool 400 Errors**
**Root Cause**: Wrong or missing Identity Pool ID

**Solution**:
```bash
# Correct Identity Pool ID
NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID=eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66
```

#### **Issue: AppSync 502 Errors**
**Root Cause**: Wrong AppSync endpoint or authentication issues

**Solution**:
```bash
# Correct AppSync endpoint
NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT=https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql
```

### **🔧 Debug Commands**
```bash
# Test admin user access
node scripts/list-admins.js

# Test authentication configuration
node debug-deployment.js

# Reset admin password if needed
node scripts/reset-admin-password.js dukeika@gmail.com

# Create new admin user
node scripts/create-admin.js test@example.com Test User
```

### **📋 Production Authentication Checklist**
- [ ] User Pool ID: `eu-west-2_FpwJJthe4`
- [ ] Identity Pool ID: `eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66`
- [ ] AppSync Endpoint: `54ofumz56bfh3kozn2qrd55ih4`
- [ ] AWS Account: `624914081304`
- [ ] Region: `eu-west-2`
- [ ] Super Admin exists: `dukeika@gmail.com`
- [ ] No duplicate environment variables
- [ ] No corrupted/truncated variable names
- [ ] Browser cache cleared
- [ ] `/debug-auth` shows correct values

---

## **🐛 ERROR HANDLING PATTERNS**

### **🚨 GraphQL Errors**
```typescript
const handleGraphQLError = (error: any) => {
  console.error('GraphQL Error:', error);
  
  if (error.errors) {
    error.errors.forEach((err: any) => {
      if (err.errorType === 'Unauthorized') {
        // Redirect to login
        router.push('/login');
      }
    });
  }
  
  // Show user-friendly message
  toast.error('Something went wrong. Please try again.');
};
```

### **🔒 Authentication Errors**
```typescript
const handleAuthError = (error: any) => {
  if (error.code === 'UserNotConfirmedException') {
    router.push('/verify');
  } else if (error.code === 'NotAuthorizedException') {
    setError('Invalid email or password');
  } else {
    setError('Authentication failed. Please try again.');
  }
};
```

---

## **📊 MONITORING & ANALYTICS**

### **📈 Performance Monitoring**
- **TRACK page load times** and component render performance
- **MONITOR API response times** and error rates
- **IMPLEMENT user activity tracking** for platform usage
- **USE AWS CloudWatch** for system monitoring

### **📋 Logging Standards**
```typescript
// Structured logging pattern
const logEvent = (event: string, data: any, level: 'info' | 'warn' | 'error' = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    data,
    userId: user?.id,
    userRole,
    level
  };
  
  console[level]('[ProRecruit]', logEntry);
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // CloudWatch or similar
  }
};
```

---

## **🔧 ENVIRONMENT CONFIGURATION**

### **🚨 CRITICAL AWS CONFIGURATION**

**Production AWS Account**: `624914081304`  
**Region**: `eu-west-2` (London)  
**Status**: All resources deployed and functional

### **🌍 Environment Variables (EXACT VALUES REQUIRED)**
```bash
# REQUIRED - Authentication (EXACT VALUES)
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_AWS_USER_POOLS_ID=eu-west-2_FpwJJthe4
NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID=3juansb0jr3s3b8qouon7nr9gn
NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID=eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66

# REQUIRED - GraphQL API (EXACT VALUES)
NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT=https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql
NEXT_PUBLIC_AWS_APPSYNC_REGION=eu-west-2
NEXT_PUBLIC_AWS_APPSYNC_API_KEY=da2-2ottpnk4ejdarf3moy2nzq2adu

# REQUIRED - File Storage (EXACT VALUES)
AWS_USER_FILES_S3_BUCKET=prorecruit-storage-eu-west-2-624914081304

# SERVER-SIDE CREDENTIALS (Production Values - Handle Securely)
AWS_ACCESS_KEY_ID=AKIAZC76IEYMCKKTPIHT
AWS_SECRET_ACCESS_KEY=[SECURE_VALUE_REQUIRED]
```

### **⚠️ CRITICAL DEPLOYMENT ISSUES TO AVOID**

**NEVER make these mistakes in Amplify Console:**

1. **❌ Wrong User Pool ID**: 
   - Wrong: `eu-west-2_VvBB48LmX` or `eu-west-2_F...` (truncated)
   - ✅ Correct: `eu-west-2_FpwJJthe4`

2. **❌ Wrong Identity Pool ID**:
   - Wrong: `eu-west-2:c0ce106d-6892-437-2dcae624ec66` (missing digits)
   - ✅ Correct: `eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66`

3. **❌ Wrong AppSync Endpoint**:
   - Wrong: `https://javwcpdxwnavrj7rq7egf55ihu.appsync-api.eu-west-2.amazonaws.com/graphql`
   - ✅ Correct: `https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql`

4. **❌ Wrong AWS Credentials**:
   - Wrong: `AKIAZC7KKTPIHT` (missing `6I`)
   - ✅ Correct: `AKIAZC76IEYMCKKTPIHT`

5. **❌ Duplicate/Corrupted Variables**:
   - Delete: `NEXT_PUBLIC_AWS_APPSYNC_GRAPHQLENDPOINT` (wrong name)
   - Delete: `NEXT_PUBLIC_AWS_APPSYNC_APIKEY` (duplicate)
   - Keep: `NEXT_PUBLIC_AWS_APPSYNC_API_KEY` (correct name)

---

## **📚 COMMON COMMANDS**

### **🏃‍♂️ Development**
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Create admin user
npm run create-admin

# List admin users
npm run list-admins

# Build for production
npm run build
```

### **☁️ AWS Amplify**
```bash
# Deploy backend changes
amplify push

# Add new resources
amplify add <category>

# Check status
amplify status

# Deploy to staging
amplify publish

# Environment management
amplify env checkout <env-name>
```

---

## **🚀 PRODUCTION DEPLOYMENT**

### **📦 Pre-deployment Checklist**
- [ ] All environment variables configured securely
- [ ] GraphQL schema deployed and tested
- [ ] Authentication flows verified
- [ ] File upload/download tested
- [ ] Error monitoring configured
- [ ] Performance optimization completed
- [ ] Security audit passed
- [ ] Load testing completed

### **🚀 AMPLIFY CONSOLE DEPLOYMENT (RECOMMENDED)**

**Due to cross-account configuration issues in Amplify CLI, use Console deployment:**

#### **Step 1: Amplify Console Setup**
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. **Ensure region**: `eu-west-2`
3. **Ensure account**: `624914081304`
4. Connect GitHub repository: `interview-portal`
5. Branch: `main`

#### **Step 2: Environment Variables (CRITICAL)**
**NEVER use corrupted/duplicate variables. Set EXACTLY these:**

```bash
AWS_ACCESS_KEY_ID=AKIAZC76IEYMCKKTPIHT
AWS_SECRET_ACCESS_KEY=[YOUR_SECRET_KEY]
AWS_USER_FILES_S3_BUCKET=prorecruit-storage-eu-west-2-624914081304
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID=eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66
NEXT_PUBLIC_AWS_APPSYNC_API_KEY=da2-2ottpnk4ejdarf3moy2nzq2adu
NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT=https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql
NEXT_PUBLIC_AWS_APPSYNC_REGION=eu-west-2
NEXT_PUBLIC_AWS_USER_POOLS_ID=eu-west-2_FpwJJthe4
NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID=3juansb0jr3s3b8qouon7nr9gn
```

#### **Step 3: Deployment Verification**
After deployment, test these IMMEDIATELY:
1. **Login Test**: `https://[your-app].amplifyapp.com/login`
   - Email: `dukeika@gmail.com`
   - Expected: Redirect to `/admin/dashboard` (NOT candidate portal)
2. **Debug Page**: `https://[your-app].amplifyapp.com/debug-auth`
   - Verify all configurations match expected values
3. **Console Check**: No Cognito 400 or AppSync 502 errors

### **🔄 CI/CD Pipeline (amplify.yml)**
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npm run type-check
    build:
      commands:
        - npm run build
    postBuild:
      commands:
        - echo "Build completed successfully"
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - .next/cache/**/*
      - node_modules/**/*
```

### **⚠️ CRITICAL DEPLOYMENT WARNINGS**

**COMMON MISTAKES THAT BREAK AUTHENTICATION:**
1. **Truncated Variable Names**: Check for incomplete variable names in Console
2. **Wrong AWS Account**: Must be `624914081304`, not `032397978068`
3. **Wrong Region**: Must be `eu-west-2`, not `us-east-1` or `us-west-1`
4. **Duplicate Variables**: Delete `_GRAPHQLENDPOINT` and `_APIKEY` duplicates
5. **Corrupted Values**: Identity Pool ID must contain `4312-ab97`, not `437`

---

## **⚠️ CRITICAL WARNINGS**

### **🚨 SECURITY ALERTS**
1. **NEVER commit AWS credentials** to version control
2. **ALWAYS validate user permissions** before data access
3. **ENCRYPT sensitive data** in transit and at rest
4. **SANITIZE all user inputs** to prevent injection attacks
5. **USE HTTPS only** for all communications

### **🔄 DATA INTEGRITY**
1. **BACKUP database** before major changes
2. **VALIDATE data transformations** thoroughly
3. **IMPLEMENT transaction rollbacks** where necessary
4. **TEST data migration scripts** in staging first

### **📊 PERFORMANCE WARNINGS**
1. **AVOID infinite loops** in useEffect hooks
2. **OPTIMIZE bundle size** - lazy load heavy components
3. **CACHE expensive computations** with useMemo
4. **MINIMIZE API calls** - batch where possible

---

## **📖 RESOURCES & REFERENCES**

### **📚 Documentation Links**
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### **🔗 Project-Specific Files**
- `README.md` - Project overview and setup
- `TESTING_GUIDE.md` - Testing procedures
- `USER_MANAGEMENT_GUIDE.md` - User management workflows
- `AWS_MIGRATION_GUIDE.md` - AWS deployment details
- `DEPLOYMENT_GUIDE.md` - Production deployment steps

---

## **📞 SUPPORT & ESCALATION**

### **🆘 When to Ask for Help**
1. **Security vulnerabilities** discovered
2. **Data corruption** or loss detected  
3. **Authentication system** not functioning
4. **Critical production errors** occurring
5. **Performance degradation** beyond acceptable limits

### **📝 Issue Reporting Format**
```
**Issue Type**: [Bug/Feature/Security/Performance]
**Severity**: [Critical/High/Medium/Low]  
**Environment**: [Development/Staging/Production]
**User Role**: [Super Admin/Company Admin/Candidate]
**Description**: Clear description of the issue
**Steps to Reproduce**: Numbered steps
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Screenshots**: If applicable
**Browser/Device**: Technical details
```

---

## **✅ SUCCESS CRITERIA**

### **🎯 Definition of Done**
A feature is considered complete when:
- [ ] All TypeScript compilation passes without errors
- [ ] ESLint rules are followed
- [ ] Authentication and authorization work correctly
- [ ] GraphQL operations function properly
- [ ] File upload/download works as expected
- [ ] Error handling is comprehensive
- [ ] Loading states are implemented
- [ ] Mobile responsiveness is verified
- [ ] Testing is completed across all user roles
- [ ] Code is documented appropriately

### **🏆 Quality Gates**
Before any production deployment:
- [ ] Security review completed
- [ ] Performance testing passed
- [ ] Load testing completed
- [ ] Cross-browser testing verified
- [ ] Accessibility audit passed
- [ ] Code review approved
- [ ] Monitoring and alerting configured

---

*This document serves as the definitive guide for all AI assistants working on the ProRecruit project. Follow these guidelines religiously to ensure consistent, production-quality development.*

**Last Updated**: 2025-01-12  
**Version**: 1.1 (Added Authentication Troubleshooting & Deployment Fixes)  
**Next Review**: Monthly  

---

## **📄 QUICK REFERENCE CARD**

### **🔑 Key Commands**
- Start: `npm run dev`
- Build: `npm run build`  
- Type Check: `npm run type-check`
- Create Admin: `npm run create-admin`

### **🌐 Key URLs**
- Development: http://localhost:3001
- GraphQL: https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql
- S3 Bucket: prorecruit-storage-eu-west-2-624914081304

### **👥 User Roles**
- Super Admin: `dukeika@gmail.com`
- Company Admin: Pattern-based or manual assignment
- Candidate: Default for new registrations

### **🔄 Workflow Stages**
1. Application Review → 2. Written Test → 3. Video Test → 4. Interview

---

*Keep this guide handy and reference it frequently during development. Success depends on following these standards consistently.*