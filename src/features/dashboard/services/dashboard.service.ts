import type { DashboardData, DashboardStats, ActivityEntry } from '@/types/dashboard.js'
import type { IApiClient } from '@/lib/api/interfaces.js'
import type { IDashboardService } from './dashboard.service.interface.js'

/**
 * ダッシュボードサービス
 * 統計とアクティビティを独立したAPIから取得可能
 */
export class DashboardService implements IDashboardService {
  #apiClient: IApiClient

  constructor(apiClient: IApiClient) {
    this.#apiClient = apiClient
  }

  async getDashboardData(): Promise<DashboardData> {
    return this.#apiClient.get<DashboardData>('/api/dashboard')
  }

  async getStats(): Promise<DashboardStats> {
    return this.#apiClient.get<DashboardStats>('/api/dashboard/stats')
  }

  async getActivity(): Promise<ActivityEntry[]> {
    return this.#apiClient.get<ActivityEntry[]>('/api/dashboard/activity')
  }
}
