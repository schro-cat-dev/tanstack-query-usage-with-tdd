import { describe, it, expect, vi } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/mocks/server.js'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useCreateUser } from './use-create-user.js'
import { queryKeys } from '@/lib/query-keys.js'
import { ApiError } from '@/types/api.js'

describe('useCreateUser', () => {
  it('初期状態はidleである', () => {
    const { result } = renderHookWithProviders(() => useCreateUser())
    expect(result.current.isIdle).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('ユーザー作成が成功する', async () => {
    const { result } = renderHookWithProviders(() => useCreateUser())

    act(() => {
      result.current.mutate({
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'viewer',
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.user.name).toBe('テストユーザー')
    expect(result.current.data?.user.email).toBe('test@example.com')
    expect(result.current.data?.user.role).toBe('viewer')
    expect(result.current.data?.user.id).toBeDefined()
  })

  it('mutation中はpending状態になる', async () => {
    // 遅延レスポンスでpending状態を捕捉
    server.use(
      http.post('*/api/users', async () => {
        await delay(500)
        return HttpResponse.json(
          { user: { id: '99', name: 'test', email: 'test@example.com', role: 'viewer', createdAt: '', updatedAt: '' } },
          { status: 201 },
        )
      }),
    )

    const { result } = renderHookWithProviders(() => useCreateUser())

    act(() => {
      result.current.mutate({
        name: 'テスト',
        email: 'test@example.com',
        role: 'viewer',
      })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('バリデーションエラー時にApiErrorを返す', async () => {
    server.use(userErrorHandlers.createValidationError)

    const { result } = renderHookWithProviders(() => useCreateUser())

    act(() => {
      result.current.mutate({
        name: 'テスト',
        email: 'duplicate@example.com',
        role: 'viewer',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(400)
    expect((result.current.error as ApiError).data).toEqual({
      message: 'Email already exists',
      field: 'email',
    })
  })

  it('サーバーエラー時にApiErrorを返す', async () => {
    server.use(userErrorHandlers.createServerError)

    const { result } = renderHookWithProviders(() => useCreateUser())

    act(() => {
      result.current.mutate({
        name: 'テスト',
        email: 'test@example.com',
        role: 'viewer',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect((result.current.error as ApiError).status).toBe(500)
  })

  it('成功時にユーザー一覧キャッシュが無効化される', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useCreateUser())

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

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

    // invalidateQueries が users.lists() キーで呼ばれたことを検証
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.users.lists(),
      }),
    )
  })

  it('エラー時にはキャッシュが無効化されない', async () => {
    server.use(userErrorHandlers.createServerError)

    const { result, queryClient } = renderHookWithProviders(() => useCreateUser())

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    act(() => {
      result.current.mutate({
        name: 'テスト',
        email: 'test@example.com',
        role: 'viewer',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // エラー時は invalidateQueries が呼ばれない
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
