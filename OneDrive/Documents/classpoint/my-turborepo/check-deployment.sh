#!/bin/bash
for i in {1..20}; do
  sleep 15
  STATUS=$(aws apprunner list-services --region eu-west-2 --profile futurelogix --query "ServiceSummaryList[?ServiceName=='classpoint-web'].Status" --output text)
  echo "[$i/20] Status: $STATUS"
  
  if [ "$STATUS" = "RUNNING" ]; then
    echo ""
    echo "========================================="
    echo "DEPLOYMENT SUCCESSFUL!"
    echo "========================================="
    URL=$(aws apprunner list-services --region eu-west-2 --profile futurelogix --query "ServiceSummaryList[?ServiceName=='classpoint-web'].ServiceUrl" --output text)
    echo "Service URL: https://$URL"
    echo ""
    curl -I "https://$URL" 2>&1 | head -10 || true
    break
  elif [ "$STATUS" = "CREATE_FAILED" ]; then
    echo ""
    echo "DEPLOYMENT FAILED!"
    SERVICE_ARN=$(aws apprunner list-services --region eu-west-2 --profile futurelogix --query "ServiceSummaryList[?ServiceName=='classpoint-web'].ServiceArn" --output text)
    SERVICE_ID=$(echo "$SERVICE_ARN" | awk -F'/' '{print $NF}')
    echo "Fetching logs..."
    MSYS_NO_PATHCONV=1 aws logs filter-log-events \
      --log-group-name /aws/apprunner/classpoint-web/$SERVICE_ID/application \
      --region eu-west-2 \
      --profile futurelogix \
      --max-items 30 \
      --output text \
      --query "events[*].message" 2>&1 | head -20 || echo "Could not fetch logs"
    break
  fi
done
