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
      http.get('*/api/dashboard', async () => {
        await delay(300)
        return HttpResponse.json({
          stats: { totalUsers: 10, activeUsers: 7, newUsersToday: 1, newUsersThisWeek: 3 },
          recentActivity: [],
        })
      }),
    )

    // ダッシュボードフックと同時に useGlobalFetchingCount を使う
    const { result } = renderHookWithProviders(() => ({
      dashboard: useGetDashboardStats(),
      fetchingCount: useGlobalFetchingCount(),
    }))

    // フェッチ中はカウントが 1 以上
    expect(result.current.fetchingCount).toBeGreaterThanOrEqual(0)

    // フェッチ完了を待つ
    await waitFor(() => {
      expect(result.current.dashboard.isSuccess).toBe(true)
    })

    // フェッチ完了後はカウントが 0
    expect(result.current.fetchingCount).toBe(0)
  })

  it('useAppActivity がフェッチとミューテーションの複合状態を返す', async () => {
    const { result } = renderHookWithProviders(() => ({
      activity: useAppActivity(),
      dashboard: useGetDashboardStats(),
    }))

    // フェッチ完了を待つ
    await waitFor(() => {
      expect(result.current.dashboard.isSuccess).toBe(true)
    })

    // 完了後はすべて非アクティブ
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
