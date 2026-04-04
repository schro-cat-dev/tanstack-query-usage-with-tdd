import type { DashboardData } from '@/types/dashboard.js'

export const mockDashboardData: DashboardData = {
  stats: {
    totalUsers: 10,
    activeUsers: 7,
    newUsersToday: 1,
    newUsersThisWeek: 3,
    roleBreakdown: [
      { role: 'admin', count: 2 },
      { role: 'editor', count: 4 },
      { role: 'viewer', count: 4 },
    ],
    weeklyNewUsers: [
      { week: '3/3', count: 1 },
      { week: '3/10', count: 2 },
      { week: '3/17', count: 1 },
      { week: '3/24', count: 3 },
      { week: '3/31', count: 2 },
      { week: '4/1', count: 1 },
    ],
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
