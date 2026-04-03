import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useUserWithDashboard } from './use-dependent-query.js'
import { mockUsers } from '@/mocks/data/users.js'

describe('06: 依存クエリ', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/users/1', () => HttpResponse.json(mockUsers[0])),
    )
  })

  it('userId が null の場合、どちらのクエリも実行しない', () => {
    const { result } = renderHookWithProviders(() =>
      useUserWithDashboard(null),
    )

    expect(result.current.user).toBeUndefined()
    expect(result.current.dashboard).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('ユーザーを取得した後にダッシュボードを取得する（直列実行）', async () => {
    const { result } = renderHookWithProviders(() =>
      useUserWithDashboard('1'),
    )

    // まずユーザーが取得される
    await waitFor(() => {
      expect(result.current.user).toBeDefined()
    })
    expect(result.current.user?.name).toBe('田中太郎')

    // 次にダッシュボードが取得される
    await waitFor(() => {
      expect(result.current.dashboard).toBeDefined()
    })
    expect(result.current.dashboard?.stats.totalUsers).toBe(10)
  })

  it('ユーザー取得がエラーの場合、ダッシュボードは取得しない', async () => {
    server.use(
      http.get('*/api/users/999', () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
    )

    const { result } = renderHookWithProviders(() =>
      useUserWithDashboard('999'),
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.user).toBeUndefined()
    expect(result.current.dashboard).toBeUndefined()
  })
})
