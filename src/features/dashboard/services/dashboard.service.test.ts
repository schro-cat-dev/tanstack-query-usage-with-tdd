import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server.js'
import { dashboardErrorHandlers } from '@/mocks/handlers/dashboard.handlers.js'
import { mockDashboardData } from '@/mocks/data/dashboard.js'
import { DashboardService } from './dashboard.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import { ApiError } from '@/types/api.js'

const apiClient = new ApiClient('http://localhost')
const service = new DashboardService(apiClient)

describe('DashboardService', () => {
  it('ダッシュボードデータを正常に取得できる', async () => {
    const data = await service.getDashboardData()
    expect(data).toEqual(mockDashboardData)
    expect(data.stats.totalUsers).toBe(10)
    expect(data.recentActivity).toHaveLength(3)
  })

  it('500エラー時にApiErrorをスローする', async () => {
    server.use(dashboardErrorHandlers.serverError)

    await expect(service.getDashboardData()).rejects.toThrow(ApiError)
    try {
      await service.getDashboardData()
    } catch (error) {
      expect((error as ApiError).status).toBe(500)
    }
  })

  it('ネットワークエラー時にエラーをスローする', async () => {
    server.use(
      http.get('*/api/dashboard', () => {
        return HttpResponse.error()
      }),
    )

    await expect(service.getDashboardData()).rejects.toThrow()
  })
})
