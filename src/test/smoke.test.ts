import { describe, it, expect } from 'vitest'
import { server } from '@/mocks/server.js'
import { queryClient } from '@/lib/query-client.js'
import { queryKeys } from '@/lib/query-keys.js'
import { ApiClient } from '@/lib/api/api-client.js'
import { ApiError } from '@/types/api.js'

describe('スモークテスト', () => {
  it('MSWサーバーがリクエストを実際にインターセプトする', async () => {
    // サーバーが本当に動いているか、実際にfetchして確認
    const response = await fetch('http://localhost/api/dashboard/stats')
    const data = await response.json()
    expect(data.totalUsers).toBe(10)
  })

  it('すべてのモックハンドラが登録されている', () => {
    const registeredHandlers = server.listHandlers()
    // dashboard: stats, activity, all(3) + users: csv, list, post(3) = 6
    expect(registeredHandlers.length).toBeGreaterThanOrEqual(6)
  })

  it('QueryClientのデフォルト設定が正しい', () => {
    const defaults = queryClient.getDefaultOptions()

    expect(defaults.queries?.staleTime).toBe(30_000)
    expect(defaults.queries?.gcTime).toBe(300_000)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true)
    expect(defaults.queries?.retry).toBe(1)
  })

  it('Query Key Factoryがすべてのキーを正しく生成する', () => {
    expect(queryKeys.dashboard.all).toEqual(['dashboard'])
    expect(queryKeys.dashboard.stats()).toEqual(['dashboard', 'stats'])
    expect(queryKeys.dashboard.activity()).toEqual(['dashboard', 'activity'])
    expect(queryKeys.users.all).toEqual(['users'])
    expect(queryKeys.users.lists()).toEqual(['users', 'list'])
    expect(queryKeys.users.list({ page: 1 })).toEqual([
      'users',
      'list',
      { page: 1 },
    ])
    expect(queryKeys.users.details()).toEqual(['users', 'detail'])
    expect(queryKeys.users.detail('123')).toEqual(['users', 'detail', '123'])

    // 階層構造: list キーは lists のプレフィックスを持つ
    const listKey = queryKeys.users.list({ page: 1 })
    const listsPrefix = queryKeys.users.lists()
    expect(listKey.slice(0, listsPrefix.length)).toEqual(listsPrefix)
  })

  it('ApiClientのメソッドが実際にHTTPリクエストを送信する', async () => {
    const client = new ApiClient('http://localhost')
    // 実際にGETリクエストを送信して結果を検証
    const data = await client.get<{ totalUsers: number }>('/api/dashboard/stats')
    expect(data.totalUsers).toBe(10)
  })

  it('ApiErrorクラスが正しくインスタンス化される', () => {
    const error = new ApiError(404, 'Not Found', { message: 'test' })

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.statusText).toBe('Not Found')
    expect(error.data).toEqual({ message: 'test' })
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('API Error: 404 Not Found')
  })

  it('ApiClientがエラーレスポンスで正しくApiErrorをスローする', async () => {
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.get('*/api/test-error', () =>
        HttpResponse.json({ message: 'test error' }, { status: 500 }),
      ),
    )

    const client = new ApiClient('http://localhost')
    try {
      await client.get('/api/test-error')
      expect.fail('エラーが発生するべき')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const apiError = error as ApiError
      expect(apiError.status).toBe(500)
      expect(apiError.data).toEqual({ message: 'test error' })
    }
  })
})
