#!/bin/bash
set -e

REGION="eu-west-2"
PROFILE="futurelogix"

echo "=== Monitoring App Runner Deployment ==="
echo ""

# Get service ARN
SERVICE_ARN=$(aws apprunner list-services --region $REGION --profile $PROFILE --query "ServiceSummaryList[?ServiceName=='classpoint-web'].ServiceArn" --output text)
echo "Service ARN: $SERVICE_ARN"
echo ""

# Monitor service creation
for i in {1..40}; do
  sleep 15
  STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region $REGION --profile $PROFILE --query "Service.Status" --output text)
  
  echo "[$i/40] Status: $STATUS"
  
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
    exit 0
  elif [ "$STATUS" = "CREATE_FAILED" ]; then
    echo ""
    echo "✗ Deployment FAILED!"
    SERVICE_ID=$(echo "$SERVICE_ARN" | awk -F'/' '{print $NF}')
    echo "Service ID: $SERVICE_ID"
    echo ""
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
