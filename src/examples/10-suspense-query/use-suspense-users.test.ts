import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useSuspenseUsers } from './use-suspense-users.js'

describe('10: useSuspenseQuery — Suspense 統合', () => {
  it('データが取得され、data は undefined にならない', async () => {
    // useSuspenseQuery は Suspense boundary 内で使う前提
    // renderHook では Suspense が自動で解決される
    const { result } = renderHookWithProviders(() =>
      useSuspenseUsers({ page: 1, perPage: 10 }),
    )

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    // data は常に PaginatedResponse<User>（undefined ではない）
    expect(result.current.data.data).toBeInstanceOf(Array)
    expect(result.current.data.data.length).toBeGreaterThan(0)
    expect(result.current.data.total).toBeGreaterThan(0)
  })

  it('isSuccess は常に true（Suspense 解決後）', async () => {
    const { result } = renderHookWithProviders(() =>
      useSuspenseUsers({ page: 1, perPage: 10 }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // useSuspenseQuery では isLoading は存在しない（Suspense が処理）
    // isPending は常に false（Suspense 解決後なので）
    expect(result.current.status).toBe('success')
  })

  it('検索パラメータでフィルタリングされたデータを取得する', async () => {
    const { result } = renderHookWithProviders(() =>
      useSuspenseUsers({ query: '田中', page: 1, perPage: 10 }),
    )

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(result.current.data.data).toHaveLength(1)
    expect(result.current.data.data[0].name).toBe('田中太郎')
  })
})
