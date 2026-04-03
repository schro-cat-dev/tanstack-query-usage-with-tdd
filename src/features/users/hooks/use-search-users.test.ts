import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { server } from '@/mocks/server.js'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers.js'
import { mockUsers } from '@/mocks/data/users.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useSearchUsers } from './use-search-users.js'

describe('useSearchUsers', () => {
  it('初期状態はローディング中である', () => {
    const { result } = renderHookWithProviders(() =>
      useSearchUsers({ page: 1, perPage: 10 }),
    )
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('ユーザー一覧を正常に取得できる', async () => {
    const { result } = renderHookWithProviders(() =>
      useSearchUsers({ page: 1, perPage: 10 }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.data).toHaveLength(mockUsers.length)
    expect(result.current.data?.total).toBe(mockUsers.length)
    expect(result.current.data?.page).toBe(1)
  })

  it('検索パラメータでフィルタリングされたデータを取得できる', async () => {
    const { result } = renderHookWithProviders(() =>
      useSearchUsers({ query: '田中', page: 1, perPage: 10 }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0].name).toBe('田中太郎')
  })

  it('ロールフィルタが正しく適用される', async () => {
    const { result } = renderHookWithProviders(() =>
      useSearchUsers({ role: 'admin', page: 1, perPage: 10 }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.data.every((u) => u.role === 'admin')).toBe(true)
  })

  it('APIエラー時にエラー状態になる', async () => {
    server.use(userErrorHandlers.listServerError)

    const { result } = renderHookWithProviders(() =>
      useSearchUsers({ page: 1, perPage: 10 }),
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('検索結果が0件の場合は空配列を返す', async () => {
    const { result } = renderHookWithProviders(() =>
      useSearchUsers({ query: '存在しないユーザー名', page: 1, perPage: 10 }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.data).toEqual([])
    expect(result.current.data?.total).toBe(0)
  })
})
