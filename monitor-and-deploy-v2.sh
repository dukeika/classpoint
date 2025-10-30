#!/bin/bash
set -e

NEW_COMMIT="2d7dde3774f097bfb755cf513f9f49de289219a2"
ECR_REGISTRY="624914081304.dkr.ecr.eu-west-2.amazonaws.com"
ECR_REPO="classpoint-web"
REGION="eu-west-2"
PROFILE="futurelogix"

echo "Monitoring ECR for new image with tag: $NEW_COMMIT"
echo "Will check every 30 seconds..."
echo ""

# Wait for new image
for i in {1..20}; do
  echo "Check $i at $(date +%T)..."
  
  # Check if image with new commit SHA exists
  if aws ecr describe-images \
    --repository-name $ECR_REPO \
    --image-ids imageTag=$NEW_COMMIT \
    --region $REGION \
    --profile $PROFILE \
    --query 'imageDetails[0].imageTags' \
    --output text &> /dev/null; then
    
    echo "✓ New image found in ECR!"
    echo ""
    
    # Create new App Runner service with IAM role
    echo "Creating new App Runner service with proper authentication..."
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
    echo "Service creation started! Monitoring status..."
    
    # Get service ARN
    SERVICE_ARN=$(aws apprunner list-services --region $REGION --profile $PROFILE --query "ServiceSummaryList[?ServiceName=='classpoint-web'].ServiceArn" --output text)
    
    # Monitor service creation
    for j in {1..30}; do
      sleep 15
      STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region $REGION --profile $PROFILE --query "Service.Status" --output text)
      echo "Status check $j: $STATUS"
      
      if [ "$STATUS" = "RUNNING" ]; then
        echo ""
        echo "✓ Service is RUNNING!"
        SERVICE_URL=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region $REGION --profile $PROFILE --query "Service.ServiceUrl" --output text)
        echo "Service URL: https://$SERVICE_URL"
        echo ""
        echo "Testing service..."
        curl -I "https://$SERVICE_URL" 2>&1 | head -10 || true
        exit 0
      elif [ "$STATUS" = "CREATE_FAILED" ]; then
        echo ""
        echo "✗ Service creation FAILED! Checking logs..."
        # Get the service ID from ARN
        SERVICE_ID=$(echo "$SERVICE_ARN" | awk -F'/' '{print $NF}')
        echo "Service ID: $SERVICE_ID"
        exit 1
      fi
    done
    
    echo "Service creation timeout after 7.5 minutes"
    exit 1
  fi
  
  sleep 30
done

echo ""
echo "Timeout waiting for new image (10 minutes)"
echo "Please check GitHub Actions: https://github.com/dukeika/classpoint/actions"
exit 1
