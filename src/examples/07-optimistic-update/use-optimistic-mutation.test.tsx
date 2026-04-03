import { describe, it, expect, vi } from 'vitest'
import { waitFor, act, renderHook } from '@testing-library/react'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/mocks/server.js'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers.js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOptimisticCreateUser } from './use-optimistic-mutation.js'
import { queryKeys } from '@/lib/query-keys.js'
import type { PaginatedResponse } from '@/types/api.js'
import type { User } from '@/types/user.js'
import { mockUsers } from '@/mocks/data/users.js'

// 楽観的更新テストではキャッシュが残る必要があるため gcTime を長めに設定
function createOptimisticTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 60_000 },
      mutations: { retry: false },
    },
  })
}

function renderWithOptimisticClient<T>(hook: () => T) {
  const queryClient = createOptimisticTestClient()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { ...renderHook(hook, { wrapper }), queryClient }
}

describe('07: 楽観的更新', () => {
  const listKey = queryKeys.users.list({ page: 1, perPage: 10 })
  const initialList: PaginatedResponse<User> = {
    data: mockUsers.slice(0, 3),
    total: 3,
    page: 1,
    perPage: 10,
  }

  it('mutation 前に一覧キャッシュが楽観的に更新される', async () => {
    server.use(
      http.post('*/api/users', async () => {
        await delay(500)
        return HttpResponse.json(
          { user: { id: '99', name: '新規', email: 'new@example.com', role: 'viewer', createdAt: '', updatedAt: '' } },
          { status: 201 },
        )
      }),
    )

    const { result, queryClient } = renderWithOptimisticClient(() =>
      useOptimisticCreateUser(),
    )

    queryClient.setQueryData(listKey, initialList)
    expect(queryClient.getQueryData<PaginatedResponse<User>>(listKey)?.total).toBe(3)

    act(() => {
      result.current.mutate({
        name: '楽観ユーザー',
        email: 'optimistic@example.com',
        role: 'viewer',
      })
    })

    await waitFor(() => {
      const cached = queryClient.getQueryData<PaginatedResponse<User>>(listKey)
      expect(cached?.total).toBe(4)
      expect(cached?.data[0].name).toBe('楽観ユーザー')
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('mutation 失敗時にロールバックされる', async () => {
    server.use(userErrorHandlers.createServerError)

    const { result, queryClient } = renderWithOptimisticClient(() =>
      useOptimisticCreateUser(),
    )

    queryClient.setQueryData(listKey, initialList)

    act(() => {
      result.current.mutate({
        name: '失敗ユーザー',
        email: 'fail@example.com',
        role: 'viewer',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    const cached = queryClient.getQueryData<PaginatedResponse<User>>(listKey)
    expect(cached?.total).toBe(3)
    expect(cached?.data[0].name).toBe(mockUsers[0].name)
  })

  it('成功時に onSettled で invalidateQueries が呼ばれる', async () => {
    const { result, queryClient } = renderWithOptimisticClient(() =>
      useOptimisticCreateUser(),
    )

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(listKey, initialList)

    act(() => {
      result.current.mutate({
        name: 'テスト',
        email: 'test@example.com',
        role: 'viewer',
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.users.lists() }),
    )
  })
})
