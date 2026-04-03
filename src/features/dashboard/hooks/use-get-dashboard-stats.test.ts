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
    expect(result.current.data).toBeUndefined()
  })

  it('ダッシュボードデータを正常に取得できる', async () => {
    const { result } = renderHookWithProviders(() => useGetDashboardStats())

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockDashboardData)
    expect(result.current.data?.stats.totalUsers).toBe(10)
    expect(result.current.data?.recentActivity).toHaveLength(3)
  })

  it('APIエラー時にエラー状態になる', async () => {
    server.use(dashboardErrorHandlers.serverError)

    const { result } = renderHookWithProviders(() => useGetDashboardStats())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('refetch関数でデータを再取得できる', async () => {
    const { result } = renderHookWithProviders(() => useGetDashboardStats())

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const { refetch } = result.current
    await refetch()

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual(mockDashboardData)
  })
})
