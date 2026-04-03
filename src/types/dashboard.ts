/**
 * ダッシュボードドメインの型定義
 */

/** 統計情報 */
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisWeek: number
}

/** アクティビティエントリ */
export interface ActivityEntry {
  id: string
  action: string
  userName: string
  timestamp: string
}

/** ダッシュボードデータ全体 */
export interface DashboardData {
  stats: DashboardStats
  recentActivity: ActivityEntry[]
}
