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
  describe('getDashboardData (全データ)', () => {
    it('ダッシュボードデータを正常に取得できる', async () => {
      const data = await service.getDashboardData()
      expect(data).toEqual(mockDashboardData)
    })

    it('500エラー時にApiErrorをスローする', async () => {
      server.use(dashboardErrorHandlers.serverError)
      await expect(service.getDashboardData()).rejects.toThrow(ApiError)
    })

    it('ネットワークエラー時にエラーをスローする', async () => {
      server.use(
        http.get('*/api/dashboard', () => HttpResponse.error()),
      )
      await expect(service.getDashboardData()).rejects.toThrow()
    })
  })

  describe('getStats (統計のみ)', () => {
    it('統計データのみ取得できる', async () => {
      const stats = await service.getStats()
      expect(stats).toEqual(mockDashboardData.stats)
      expect(stats.totalUsers).toBe(10)
      expect(stats.roleBreakdown).toHaveLength(3)
    })

    it('500エラー時にApiErrorをスローする', async () => {
      server.use(dashboardErrorHandlers.statsError)
      await expect(service.getStats()).rejects.toThrow(ApiError)
    })
  })

  describe('getActivity (アクティビティのみ)', () => {
    it('アクティビティのみ取得できる', async () => {
      const activity = await service.getActivity()
      expect(activity).toEqual(mockDashboardData.recentActivity)
      expect(activity).toHaveLength(3)
    })

    it('500エラー時にApiErrorをスローする', async () => {
      server.use(dashboardErrorHandlers.activityError)
      await expect(service.getActivity()).rejects.toThrow(ApiError)
    })
  })
})
