import { describe, it, expect } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useInfiniteUsers, flattenInfiniteUsers } from './use-infinite-users.js'

describe('09: useInfiniteQuery — 無限スクロール', () => {
  it('最初のページを取得できる', async () => {
    const { result } = renderHookWithProviders(() => useInfiniteUsers(3))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.pages).toHaveLength(1)
    expect(result.current.data?.pages[0].data).toHaveLength(3)
    expect(result.current.data?.pages[0].page).toBe(1)
  })

  it('次のページがある場合、hasNextPage が true', async () => {
    const { result } = renderHookWithProviders(() => useInfiniteUsers(3))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.hasNextPage).toBe(true)
  })

  it('fetchNextPage で次のページを追加取得できる', async () => {
    const { result } = renderHookWithProviders(() => useInfiniteUsers(3))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    act(() => {
      result.current.fetchNextPage()
    })

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2)
    })

    expect(result.current.data?.pages[1].page).toBe(2)
  })

  it('全ページ取得後は hasNextPage が false になる', async () => {
    const { result } = renderHookWithProviders(() => useInfiniteUsers(5))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.hasNextPage).toBe(true)

    act(() => {
      result.current.fetchNextPage()
    })

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2)
    })

    expect(result.current.hasNextPage).toBe(false)
  })

  it('flattenInfiniteUsers で全ユーザーをフラットに取得できる', async () => {
    const { result } = renderHookWithProviders(() => useInfiniteUsers(3))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    act(() => {
      result.current.fetchNextPage()
    })

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2)
    })

    const allUsers = flattenInfiniteUsers(result.current.data)
    expect(allUsers.length).toBe(6)
    expect(allUsers[0].id).toBeDefined()
  })
})
