@echo off
echo Creating missing Lambda handlers...

REM Create all missing handler files with basic templates

echo Creating jobs handlers...
echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\jobs\delete.ts
echo import { successResponse, errorResponse } from '../../utils/response'; >> src\functions\jobs\delete.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> { >> src\functions\jobs\delete.ts
echo   try { return successResponse({ message: 'Delete job - TODO' }); } >> src\functions\jobs\delete.ts
echo   catch (error) { return errorResponse({ code: 'ERROR', message: 'Failed' }, 500); } >> src\functions\jobs\delete.ts
echo }; >> src\functions\jobs\delete.ts

echo Creating applications handlers...
echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\applications\create.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\applications\create.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'Create application - TODO' }); >> src\functions\applications\create.ts

echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\applications\list.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\applications\list.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'List applications - TODO' }); >> src\functions\applications\list.ts

echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\applications\get.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\applications\get.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'Get application - TODO' }); >> src\functions\applications\get.ts

echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\applications\updateStage.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\applications\updateStage.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'Update stage - TODO' }); >> src\functions\applications\updateStage.ts

echo Creating tests handlers...
echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\tests\create.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\tests\create.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'Create test - TODO' }); >> src\functions\tests\create.ts

echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\tests\get.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\tests\get.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'Get test - TODO' }); >> src\functions\tests\get.ts

echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\tests\submit.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\tests\submit.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'Submit test - TODO' }); >> src\functions\tests\submit.ts

echo Creating files handlers...
echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\files\getUploadUrl.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\files\getUploadUrl.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'Get upload URL - TODO' }); >> src\functions\files\getUploadUrl.ts

echo Creating notifications handlers...
echo import { APIGatewayProxyHandler } from 'aws-lambda'; > src\functions\notifications\send.ts
echo import { successResponse } from '../../utils/response'; >> src\functions\notifications\send.ts
echo export const handler: APIGatewayProxyHandler = async (event) =^> successResponse({ message: 'Send notification - TODO' }); >> src\functions\notifications\send.ts

echo All handler files created!
echo You can now run: npm run deploy:dev