#!/bin/bash
SERVICE_ARN=$(aws apprunner list-services --region eu-west-2 --profile futurelogix --query "ServiceSummaryList[?ServiceName=='classpoint-web'].ServiceArn" --output text)

for i in {1..30}; do
  sleep 10
  STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region eu-west-2 --profile futurelogix --query "Service.Status" --output text)
  echo "[$i/30] $(date +%T) - Status: $STATUS"
  
  if [ "$STATUS" = "RUNNING" ]; then
    echo ""
    echo "========================================="
    echo "SUCCESS - DEPLOYMENT COMPLETE!"
    echo "========================================="
    SERVICE_URL=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region eu-west-2 --profile futurelogix --query "Service.ServiceUrl" --output text)
    echo "Service URL: https://$SERVICE_URL"
    echo ""
    echo "Testing connectivity..."
    curl -I "https://$SERVICE_URL" 2>&1 | head -15 || true
    exit 0
  elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "OPERATION_FAILED" ]; then
    echo ""
    echo "========================================="
    echo "DEPLOYMENT FAILED!"
    echo "========================================="
    SERVICE_ID=$(echo "$SERVICE_ARN" | awk -F'/' '{print $NF}')
    echo "Service ID: $SERVICE_ID"
    echo "Check CloudWatch logs at:"
    echo "https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logsV2:log-groups/log-group/%252Faws%252Fapprunner%252Fclasspoint-web%252F$SERVICE_ID"
    exit 1
  fi
done
