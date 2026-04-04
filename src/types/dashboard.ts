/**
 * ダッシュボードドメインの型定義
 */

/** 統計情報 */
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  roleBreakdown: RoleBreakdown[]
  weeklyNewUsers: WeeklyEntry[]
}

/** ロール別ユーザー数 */
export interface RoleBreakdown {
  role: string
  count: number
}

/** 週別新規ユーザー数 */
export interface WeeklyEntry {
  week: string
  count: number
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
