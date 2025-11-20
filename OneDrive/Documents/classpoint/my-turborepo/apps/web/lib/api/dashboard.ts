import { apiClient } from './client'

export interface DashboardStatistics {
  totalStudents: number
  activeClasses: number
  totalEnrollments: number
  totalHouseholds: number
}

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStatistics: async (): Promise<DashboardStatistics> => {
    return apiClient.get<DashboardStatistics>('/dashboard/statistics')
  },
}
