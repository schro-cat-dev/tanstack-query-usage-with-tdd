import { http, HttpResponse, delay } from 'msw'
import { mockDashboardData } from '@/mocks/data/dashboard.js'

export const dashboardHandlers = [
  // 具体的なパスを先に定義（MSW は先にマッチしたものを使う）

  // GET /api/dashboard/stats — 統計データのみ
  http.get('*/api/dashboard/stats', () => {
    return HttpResponse.json(mockDashboardData.stats)
  }),

  // GET /api/dashboard/activity — アクティビティのみ
  http.get('*/api/dashboard/activity', () => {
    return HttpResponse.json(mockDashboardData.recentActivity)
  }),

  // GET /api/dashboard — 全データ（後方互換）
  http.get('*/api/dashboard', () => {
    return HttpResponse.json(mockDashboardData)
  }),
]

/** エラー系ハンドラ（テストでserver.use()する用） */
export const dashboardErrorHandlers = {
  serverError: http.get('*/api/dashboard', () => {
    return HttpResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    )
  }),
  statsError: http.get('*/api/dashboard/stats', () => {
    return HttpResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    )
  }),
  activityError: http.get('*/api/dashboard/activity', () => {
    return HttpResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    )
  }),
  delayed: http.get('*/api/dashboard', async () => {
    await delay(2000)
    return HttpResponse.json(mockDashboardData)
  }),
}
