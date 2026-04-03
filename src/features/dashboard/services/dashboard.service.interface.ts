import type { DashboardData } from '@/types/dashboard.js'

/**
 * ダッシュボードサービスのインターフェース
 */
export interface IDashboardService {
  getDashboardData(): Promise<DashboardData>
}
