import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('ClassPoint API')
    .setDescription('ClassPoint School Management System API Documentation')
    .setVersion('1.0')
    .addTag('authentication', 'Authentication endpoints')
    .addTag('tenants', 'Tenant management')
    .addTag('plans', 'Subscription plans')
    .addTag('academic', 'Academic structure (sessions, terms, classes, subjects)')
    .addTag('enrollment', 'Student enrollment management')
    .addTag('attendance', 'Attendance tracking')
    .addTag('assessment', 'Assessments and grading')
    .addTag('fee-status', 'Fee payment tracking')
    .addTag('comments', 'Teacher/principal comments')
    .addTag('external-reports', 'External report cards')
    .addTag('announcements', 'School announcements')
    .addTag('promotions', 'Student promotions')
    .addTag('cms', 'Public CMS (branding, news, events, galleries)')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('resources', 'Assignments and resource library')
    .addTag('calendar', 'Calendar and reminders')
    .addTag('integration', 'Data import/export')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
