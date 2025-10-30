#!/bin/bash
set -e

NEW_COMMIT="a605388b05c7ad1e377e7ab630dcae90d4c70737"
ECR_REGISTRY="624914081304.dkr.ecr.eu-west-2.amazonaws.com"
ECR_REPO="classpoint-web"
REGION="eu-west-2"
PROFILE="futurelogix"

echo "=== FINAL DEPLOYMENT ATTEMPT ==="
echo "Commit: $NEW_COMMIT"
echo "Monitoring ECR for new image..."
echo ""

# Wait for new image
for i in {1..20}; do
  echo "Check $i at $(date +%T)..."
  
  if aws ecr describe-images \
    --repository-name $ECR_REPO \
    --image-ids imageTag=$NEW_COMMIT \
    --region $REGION \
    --profile $PROFILE \
    --query 'imageDetails[0].imageTags' \
    --output text &> /dev/null; then
    
    echo "✓ Image found in ECR!"
    echo ""
    
    echo "Creating App Runner service with proper authentication..."
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
    echo "Monitoring deployment..."
    
    SERVICE_ARN=$(aws apprunner list-services --region $REGION --profile $PROFILE --query "ServiceSummaryList[?ServiceName=='classpoint-web'].ServiceArn" --output text)
    
    for j in {1..30}; do
      sleep 15
      STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region $REGION --profile $PROFILE --query "Service.Status" --output text)
      echo "[$j/30] Status: $STATUS"
      
      if [ "$STATUS" = "RUNNING" ]; then
        echo ""
        echo "========================================="
        echo "✓ DEPLOYMENT SUCCESSFUL!"
        echo "========================================="
        SERVICE_URL=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region $REGION --profile $PROFILE --query "Service.ServiceUrl" --output text)
        echo "Service URL: https://$SERVICE_URL"
        echo ""
        echo "Testing connectivity..."
        curl -I "https://$SERVICE_URL" 2>&1 | grep -E "HTTP|Server" || true
        echo ""
        echo "Deployment complete!"
        exit 0
      elif [ "$STATUS" = "CREATE_FAILED" ]; then
        echo ""
        echo "✗ Deployment FAILED!"
        SERVICE_ID=$(echo "$SERVICE_ARN" | awk -F'/' '{print $NF}')
        echo "Checking application logs..."
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
    
    echo "Timeout after 7.5 minutes"
    exit 1
  fi
  
  sleep 30
done

echo ""
echo "Timeout waiting for image (10 minutes)"
exit 1
