import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@classpoint/db';
import { TenantModule } from './tenant/tenant.module';
import { PlanModule } from './plan/plan.module';
import { AuthModule } from './auth/auth.module';
import { AcademicModule } from './academic/academic.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { FeeStatusModule } from './fee-status/fee-status.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AssessmentModule } from './assessment/assessment.module';
import { CommentModule } from './comment/comment.module';
import { ExternalReportModule } from './external-report/external-report.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { PromotionModule } from './promotion/promotion.module';
import { CmsModule } from './cms/cms.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ResourcesModule } from './resources/resources.module';
import { CalendarModule } from './calendar/calendar.module';
import { IntegrationModule } from './integration/integration.module';
import { ContactModule } from './contact/contact.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    TenantModule,
    PlanModule,
    AcademicModule,
    EnrollmentModule,
    FeeStatusModule,
    AttendanceModule,
    AssessmentModule,
    CommentModule,
    ExternalReportModule,
    AnnouncementModule,
    PromotionModule,
    CmsModule,
    AnalyticsModule,
    ResourcesModule,
    CalendarModule,
    IntegrationModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
