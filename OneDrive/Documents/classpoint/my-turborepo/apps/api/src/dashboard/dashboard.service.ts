import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { StudentStatus } from '@classpoint/db';

export interface DashboardStatistics {
  totalStudents: number;
  activeClasses: number;
  totalEnrollments: number;
  totalHouseholds: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics for a tenant
   */
  async getStatistics(tenantId: string): Promise<DashboardStatistics> {
    this.logger.log(`Fetching dashboard statistics for tenant: ${tenantId}`);

    const [
      totalStudents,
      activeClasses,
      totalEnrollments,
      totalHouseholds,
    ] = await Promise.all([
      // Total students (enrolled)
      this.prisma.student.count({
        where: { tenantId, status: StudentStatus.ENROLLED }
      }, // Active classes
      this.prisma.class.count({
        where: { tenantId, isActive: true }
      }, // Total current enrollments
      this.prisma.enrollment.count({
        where: { tenantId, isCurrent: true }
      }, // Total households
      this.prisma.household.count({
        where: { tenantId }
      }]);

    return {
      totalStudents,
      activeClasses,
      totalEnrollments,
      totalHouseholds};
  }
}
