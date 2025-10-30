#!/bin/bash
set -e

NEW_COMMIT="aaeee8d"
ECR_REGISTRY="624914081304.dkr.ecr.eu-west-2.amazonaws.com"
ECR_REPO="classpoint-web"
REGION="eu-west-2"
PROFILE="futurelogix"

echo "=== DEPLOYMENT ATTEMPT 6 - Final Fix ==="
echo "Commit: $NEW_COMMIT (Copy server.cjs and use it in CMD)"
echo ""

# Step 1: Wait for service deletion
echo "Step 1: Waiting for previous service deletion..."
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
echo ""

# Step 2: Monitor ECR for new image
echo "Step 2: Monitoring ECR for new Docker image..."
for i in {1..20}; do
  echo "  Check $i at $(date +%T)..."
  
  if aws ecr describe-images \
    --repository-name $ECR_REPO \
    --image-ids imageTag=$NEW_COMMIT \
    --region $REGION \
    --profile $PROFILE \
    --query 'imageDetails[0].imageTags' \
    --output text &> /dev/null; then
    
    echo "✓ Image found in ECR!"
    break
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
    echo "Check CloudWatch logs at:"
    echo "https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logsV2:log-groups/log-group/\$252Faws\$252Fapprunner\$252Fclasspoint-web\$252F$SERVICE_ID"
    exit 1
  fi
done

echo ""
echo "Timeout after 10 minutes"
exit 1
