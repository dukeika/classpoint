# Deployment Guide

## Current Setup

### Infrastructure

- **Platform**: AWS App Runner (Cost-effective, auto-scaling)
- **Region**: eu-west-2 (London)
- **Container Registry**: Amazon ECR
- **Repository**: `classpoint-web`
- **ECR URI**: `624914081304.dkr.ecr.eu-west-2.amazonaws.com/classpoint-web`

### CI/CD Pipeline

**GitHub Actions** automatically builds and deploys on every push to `master` branch.

**Workflow Location**: `.github/workflows/deploy-web.yml`

**What it does**:
1. Checks out code
2. Authenticates with AWS ECR
3. Builds Docker image from `apps/web/Dockerfile`
4. Pushes image with two tags:
   - `latest` - always points to most recent build
   - `<commit-sha>` - specific version for rollbacks

### App Runner Service

**Service Name**: classpoint-web
**Instance Configuration**:
- CPU: 1 vCPU
- Memory: 2 GB
- Port: 3000

**Auto Deployment**: Enabled (deploys automatically when new image pushed to ECR)

**Estimated Cost**: $25-40/month (scales to zero when idle)

## Environment Variables

The following environment variables need to be configured in App Runner:

```bash
# Add your environment variables here
NODE_ENV=production
# Add API_URL, DATABASE_URL, etc. as needed
```

## GitHub Secrets

The following secrets are configured in GitHub:
- `AWS_ACCESS_KEY_ID` - IAM user access key for ECR
- `AWS_SECRET_ACCESS_KEY` - IAM user secret key

## Deployment Process

### Automatic Deployment

1. Push code to `master` branch
2. GitHub Actions automatically:
   - Builds Docker image
   - Pushes to ECR
   - App Runner auto-deploys new version

### Manual Deployment

To trigger a manual deployment:
1. Go to https://github.com/dukeika/classpoint/actions
2. Select "Deploy Web App to ECR" workflow
3. Click "Run workflow" → "Run workflow"

## Monitoring

- **GitHub Actions**: https://github.com/dukeika/classpoint/actions
- **ECR Console**: https://eu-west-2.console.aws.amazon.com/ecr/repositories/private/624914081304/classpoint-web
- **App Runner Console**: https://eu-west-2.console.aws.amazon.com/apprunner/home?region=eu-west-2#/services

## Rollback

To rollback to a previous version:

```bash
# List available image tags
aws ecr list-images --repository-name classpoint-web --region eu-west-2 --profile futurelogix

# Update App Runner to use specific version
aws apprunner update-service \
  --service-arn <service-arn> \
  --source-configuration ImageRepository={ImageIdentifier=624914081304.dkr.ecr.eu-west-2.amazonaws.com/classpoint-web:<commit-sha>} \
  --region eu-west-2 \
  --profile futurelogix
```

## Troubleshooting

### Build Failures

Check GitHub Actions logs: https://github.com/dukeika/classpoint/actions

Common issues:
- TypeScript errors: Temporarily disabled via `next.config.js`
- Dependency issues: Clear cache and rebuild
- Docker build timeout: Increase GitHub Actions timeout

### Deployment Failures

Check App Runner logs in AWS Console

Common issues:
- Port mismatch: App must listen on port 3000
- Missing environment variables
- Health check failures

## Next Steps

1. **Complete App Runner setup**: Create the service (pending Docker build)
2. **Configure custom domain**: Point your domain to App Runner URL
3. **Add environment variables**: Configure production secrets
4. **Set up monitoring**: CloudWatch logs and alarms
5. **Fix backend TypeScript errors**: 908 errors remaining (apps/api)
