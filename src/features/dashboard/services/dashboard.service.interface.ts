import type { DashboardData, DashboardStats, ActivityEntry } from '@/types/dashboard.js'

/**
 * ダッシュボードサービスのインターフェース
 */
export interface IDashboardService {
  /** 全データ取得（後方互換） */
  getDashboardData(): Promise<DashboardData>
  /** 統計データのみ取得 */
  getStats(): Promise<DashboardStats>
  /** アクティビティのみ取得 */
  getActivity(): Promise<ActivityEntry[]>
}
