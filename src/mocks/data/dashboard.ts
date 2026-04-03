import type { DashboardData } from '@/types/dashboard.js'

export const mockDashboardData: DashboardData = {
  stats: {
    totalUsers: 10,
    activeUsers: 7,
    newUsersToday: 1,
    newUsersThisWeek: 3,
  },
  recentActivity: [
    {
      id: 'act-1',
      action: 'ユーザーを作成しました',
      userName: '中村真理',
      timestamp: '2026-04-04T09:00:00Z',
    },
    {
      id: 'act-2',
      action: 'プロフィールを更新しました',
      userName: '田中太郎',
      timestamp: '2026-04-03T17:00:00Z',
    },
    {
      id: 'act-3',
      action: 'ログインしました',
      userName: '佐藤花子',
      timestamp: '2026-04-03T14:00:00Z',
    },
  ],
}
