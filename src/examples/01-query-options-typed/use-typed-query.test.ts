import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { userDetailOptions, useUserDetail } from './use-typed-query.js'
import type { User } from '@/types/user.js'

const mockUser: User = {
  id: '1',
  name: '田中太郎',
  email: 'tanaka@example.com',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('01: queryOptions による型安全な共有', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/users/1', () => HttpResponse.json(mockUser)),
    )
  })

  it('queryOptions が正しいキーと設定を返す', () => {
    const options = userDetailOptions('1')
    expect(options.queryKey).toEqual(['users', 'detail', '1'])
    expect(options.staleTime).toBe(60_000)
    expect(options.queryFn).toBeDefined()
  })

  it('useUserDetail で型安全にデータを取得できる', async () => {
    const { result } = renderHookWithProviders(() => useUserDetail('1'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // data は User 型として推論される
    expect(result.current.data?.name).toBe('田中太郎')
    expect(result.current.data?.role).toBe('admin')
  })

  it('getQueryData でキャッシュから型安全にデータを読める', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useUserDetail('1'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // queryClient.getQueryData に queryOptions のキーを渡すと型が推論される
    const cached = queryClient.getQueryData(userDetailOptions('1').queryKey)
    expect(cached?.name).toBe('田中太郎')
  })

  it('ensureQueryData でも同じ queryOptions を使える', async () => {
    const { queryClient } = renderHookWithProviders(() => useUserDetail('1'))

    // ensureQueryData に queryOptions を渡す（Router loader と同じパターン）
    const data = await queryClient.ensureQueryData(userDetailOptions('1'))
    expect(data.name).toBe('田中太郎')
  })
})
