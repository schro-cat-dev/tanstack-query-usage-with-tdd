import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/mocks/server.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import {
  useGlobalFetchingCount,
  useGlobalMutatingCount,
  useAppActivity,
} from './use-global-indicators.js'
import { useGetDashboardStats } from '@/features/dashboard/hooks/use-get-dashboard-stats.js'
import { useCreateUser } from '@/features/users/hooks/use-create-user.js'
import { act } from '@testing-library/react'

describe('08: useIsFetching / useIsMutating — グローバルインジケータ', () => {
  it('フェッチ中のクエリ数を返す', async () => {
    server.use(
      http.get('*/api/dashboard/stats', async () => {
        await delay(300)
        return HttpResponse.json({
          totalUsers: 10, activeUsers: 7, newUsersToday: 1, newUsersThisWeek: 3,
          roleBreakdown: [], weeklyNewUsers: [],
        })
      }),
    )

    const { result } = renderHookWithProviders(() => ({
      dashboard: useGetDashboardStats(),
      fetchingCount: useGlobalFetchingCount(),
    }))

    // フェッチ中はカウントが正の数であることを確認
    // (stats + activity の2つが走るので 1 以上)
    await waitFor(() => {
      expect(result.current.fetchingCount).toBeGreaterThan(0)
    })

    await waitFor(() => {
      expect(result.current.dashboard.isLoading).toBe(false)
    })

    expect(result.current.fetchingCount).toBe(0)
  })

  it('useAppActivity がフェッチとミューテーションの複合状態を返す', async () => {
    const { result } = renderHookWithProviders(() => ({
      activity: useAppActivity(),
      dashboard: useGetDashboardStats(),
    }))

    await waitFor(() => {
      expect(result.current.dashboard.isLoading).toBe(false)
    })

    expect(result.current.activity.isFetching).toBe(false)
    expect(result.current.activity.isMutating).toBe(false)
    expect(result.current.activity.isActive).toBe(false)
  })

  it('ミューテーション中のカウントが増える', async () => {
    server.use(
      http.post('*/api/users', async () => {
        await delay(200)
        return HttpResponse.json(
          { user: { id: '99', name: 'test', email: 'test@example.com', role: 'viewer', createdAt: '', updatedAt: '' } },
          { status: 201 },
        )
      }),
    )

    const { result } = renderHookWithProviders(() => ({
      create: useCreateUser(),
      mutatingCount: useGlobalMutatingCount(),
    }))

    act(() => {
      result.current.create.mutate({
        name: 'テスト',
        email: 'test@example.com',
        role: 'viewer',
      })
    })

    // ミューテーション中はカウント >= 1
    await waitFor(() => {
      expect(result.current.create.isPending).toBe(true)
    })

    // 完了を待つ
    await waitFor(() => {
      expect(result.current.create.isSuccess).toBe(true)
    })
  })
})
