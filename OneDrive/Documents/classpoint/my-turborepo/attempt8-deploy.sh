#!/bin/bash
set -e

ECR_REGISTRY="624914081304.dkr.ecr.eu-west-2.amazonaws.com"
ECR_REPO="classpoint-web"
REGION="eu-west-2"
PROFILE="futurelogix"

echo "=== DEPLOYMENT ATTEMPT 8 - Fix Corepack Permissions ==="
echo "Commit: abe12a9 (Set HOME=/tmp for corepack cache)"
echo ""

# Step 1: Delete failed service from attempt 7
echo "Step 1: Deleting previous failed service..."
SERVICE_ARN=$(aws apprunner list-services --region $REGION --profile $PROFILE --query "ServiceSummaryList[?ServiceName=='classpoint-web'].ServiceArn" --output text 2>/dev/null)
if [ -n "$SERVICE_ARN" ]; then
  echo "Deleting service: $SERVICE_ARN"
  aws apprunner delete-service --service-arn "$SERVICE_ARN" --region $REGION --profile $PROFILE --query "Service.Status" --output text
  
  # Wait for deletion
  for i in {1..20}; do
    sleep 5
    status=$(aws apprunner list-services --region $REGION --profile $PROFILE --query "ServiceSummaryList[?ServiceName=='classpoint-web'].Status" --output text 2>/dev/null)
    if [ -z "$status" ]; then
      echo "✓ Service deleted"
      break
    else
      echo "  [$i/20] Status: $status"
    fi
  done
else
  echo "No service to delete"
fi
echo ""

# Step 2: Wait for new Docker image
echo "Step 2: Waiting for new Docker image in ECR..."
for i in {1..20}; do
  echo "  Check $i at $(date +%T)..."
  
  # Check latest image push time
  LATEST_PUSH=$(aws ecr describe-images --repository-name $ECR_REPO --region $REGION --profile $PROFILE --image-ids imageTag=latest --query 'imageDetails[0].imagePushedAt' --output text 2>/dev/null || echo "none")
  
  if [ "$LATEST_PUSH" != "none" ]; then
    echo "  Latest image pushed at: $LATEST_PUSH"
    # If image was pushed after 18:05 (current time ~ 18:06), it's the new one
    PUSH_TIMESTAMP=$(date -d "$LATEST_PUSH" +%s 2>/dev/null || echo "0")
    CUTOFF_TIMESTAMP=$(date -d "2025-10-30 18:05" +%s 2>/dev/null || echo "999999999999")
    
    if [ "$PUSH_TIMESTAMP" -gt "$CUTOFF_TIMESTAMP" ]; then
      echo "✓ New image found!"
      break
    fi
  fi
  
  sleep 30
done
echo ""

# Step 3: Create App Runner service
echo "Step 3: Creating App Runner service..."
aws apprunner create-service \
  --service-name classpoint-web \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'$ECR_REGISTRY'/'$ECR_REPO':latest",
      "ImageConfiguration": {
        "Port": "3000"
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::624914081304:role/AppRunnerECRAccessRole"
    }
  }' \
  --instance-configuration "Cpu=1024,Memory=2048" \
  --health-check-configuration "Protocol=TCP,Path=/,Interval=5,Timeout=2,HealthyThreshold=1,UnhealthyThreshold=5" \
  --region $REGION \
  --profile $PROFILE \
  --query "Service.[ServiceName,ServiceUrl,Status]" \
  --output table

echo ""
echo "Step 4: Monitoring deployment..."

SERVICE_ARN=$(aws apprunner list-services --region $REGION --profile $PROFILE --query "ServiceSummaryList[?ServiceName=='classpoint-web'].ServiceArn" --output text)

for j in {1..40}; do
  sleep 15
  STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region $REGION --profile $PROFILE --query "Service.Status" --output text)
  echo "  [$j/40] Status: $STATUS"
  
  if [ "$STATUS" = "RUNNING" ]; then
    echo ""
    echo "========================================="
    echo "✓ DEPLOYMENT SUCCESSFUL!"
    echo "========================================="
    SERVICE_URL=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region $REGION --profile $PROFILE --query "Service.ServiceUrl" --output text)
    echo "Service URL: https://$SERVICE_URL"
    echo ""
    echo "Testing connectivity..."
    curl -I "https://$SERVICE_URL" 2>&1 | grep -E "HTTP|Server|X-" || true
    echo ""
    echo "Deployment complete!"
    exit 0
  elif [ "$STATUS" = "CREATE_FAILED" ]; then
    echo ""
    echo "✗ Deployment FAILED!"
    SERVICE_ID=$(echo "$SERVICE_ARN" | awk -F'/' '{print $NF}')
    echo "Fetching application logs..."
    MSYS_NO_PATHCONV=1 aws logs filter-log-events \
      --log-group-name /aws/apprunner/classpoint-web/$SERVICE_ID/application \
      --region $REGION \
      --profile $PROFILE \
      --max-items 50 \
      --output text \
      --query "events[*].message" 2>&1 | head -30 || echo "Could not fetch logs"
    exit 1
  fi
done

echo ""
echo "Timeout after 10 minutes"
exit 1
