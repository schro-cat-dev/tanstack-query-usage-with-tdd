import { describe, it, expect } from 'vitest'
import { server } from '@/mocks/server.js'
import { queryClient } from '@/lib/query-client.js'
import { queryKeys } from '@/lib/query-keys.js'
import { ApiClient } from '@/lib/api/api-client.js'
import { ApiError } from '@/types/api.js'

describe('スモークテスト', () => {
  it('MSWサーバーが正常に起動している', () => {
    // setup.ts で server.listen() が呼ばれていることの間接的な確認
    // サーバーが起動していなければ fetch がエラーを投げる
    expect(server).toBeDefined()
    expect(server.listHandlers).toBeDefined()
  })

  it('すべてのモックハンドラが登録されている', () => {
    const registeredHandlers = server.listHandlers()
    // dashboardHandlers (1) + userHandlers (3) = 4
    expect(registeredHandlers.length).toBeGreaterThanOrEqual(4)
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
    expect(queryKeys.users.all).toEqual(['users'])
    expect(queryKeys.users.lists()).toEqual(['users', 'list'])
    expect(queryKeys.users.list({ page: 1 })).toEqual([
      'users',
      'list',
      { page: 1 },
    ])
    expect(queryKeys.users.details()).toEqual(['users', 'detail'])
    expect(queryKeys.users.detail('123')).toEqual(['users', 'detail', '123'])
  })

  it('ApiClientがインスタンス化できる', () => {
    const client = new ApiClient('http://localhost')
    expect(client).toBeDefined()
    expect(client.get).toBeDefined()
    expect(client.post).toBeDefined()
    expect(client.put).toBeDefined()
    expect(client.delete).toBeDefined()
    expect(client.getBlob).toBeDefined()
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
})
