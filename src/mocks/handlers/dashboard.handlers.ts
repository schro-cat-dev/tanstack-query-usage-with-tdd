import { http, HttpResponse, delay } from 'msw'
import { mockDashboardData } from '@/mocks/data/dashboard.js'

export const dashboardHandlers = [
  // GET /api/dashboard - 正常系
  http.get('*/api/dashboard', async () => {
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
  delayed: http.get('*/api/dashboard', async () => {
    await delay(2000)
    return HttpResponse.json(mockDashboardData)
  }),
}
