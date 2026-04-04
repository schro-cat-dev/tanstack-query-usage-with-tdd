import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { server } from '@/mocks/server.js'
import { dashboardErrorHandlers } from '@/mocks/handlers/dashboard.handlers.js'
import { mockDashboardData } from '@/mocks/data/dashboard.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useGetDashboardStats } from './use-get-dashboard-stats.js'

describe('useGetDashboardStats', () => {
  it('初期状態はローディング中である', () => {
    const { result } = renderHookWithProviders(() => useGetDashboardStats())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.stats).toBeUndefined()
    expect(result.current.recentActivity).toBeUndefined()
  })

  it('統計データとアクティビティを並行取得できる', async () => {
    const { result } = renderHookWithProviders(() => useGetDashboardStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).toEqual(mockDashboardData.stats)
    expect(result.current.stats?.totalUsers).toBe(10)
    expect(result.current.recentActivity).toEqual(mockDashboardData.recentActivity)
    expect(result.current.recentActivity).toHaveLength(3)
  })

  it('統計APIエラー時にエラー状態になる', async () => {
    server.use(dashboardErrorHandlers.statsError)

    const { result } = renderHookWithProviders(() => useGetDashboardStats())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('refetch関数で両方のデータを再取得できる', async () => {
    const { result } = renderHookWithProviders(() => useGetDashboardStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.refetch()

    await waitFor(() => {
      expect(result.current.stats).toBeDefined()
    })
  })
})
