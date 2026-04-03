import type { DashboardData } from '@/types/dashboard.js'
import type { IApiClient } from '@/lib/api/interfaces.js'
import type { IDashboardService } from './dashboard.service.interface.js'

/**
 * ダッシュボードサービス
 * API クライアントを通じてダッシュボードデータを取得する
 */
export class DashboardService implements IDashboardService {
  #apiClient: IApiClient

  constructor(apiClient: IApiClient) {
    this.#apiClient = apiClient
  }

  async getDashboardData(): Promise<DashboardData> {
    return this.#apiClient.get<DashboardData>('/api/dashboard')
  }
}
