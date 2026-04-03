import { describe, it, expect } from 'vitest'
import { server } from '@/mocks/server.js'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers.js'
import { mockUsers } from '@/mocks/data/users.js'
import { UserService } from './user.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import { ApiError } from '@/types/api.js'

const apiClient = new ApiClient('http://localhost')
const service = new UserService(apiClient)

describe('UserService', () => {
  describe('searchUsers', () => {
    it('ページネーション付きでユーザー一覧を取得できる', async () => {
      const result = await service.searchUsers({ page: 1, perPage: 10 })

      expect(result.data).toBeInstanceOf(Array)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.total).toBe(mockUsers.length)
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
    })

    it('検索クエリでフィルタリングされる', async () => {
      const result = await service.searchUsers({ query: '田中' })

      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('田中太郎')
    })

    it('ロールでフィルタリングされる', async () => {
      const result = await service.searchUsers({ role: 'admin' })

      expect(result.data.every((u) => u.role === 'admin')).toBe(true)
    })

    it('500エラー時にApiErrorをスローする', async () => {
      server.use(userErrorHandlers.listServerError)

      await expect(service.searchUsers({})).rejects.toThrow(ApiError)
      try {
        await service.searchUsers({})
      } catch (error) {
        expect((error as ApiError).status).toBe(500)
      }
    })

    it('結果が0件の場合は空配列を返す', async () => {
      const result = await service.searchUsers({ query: '存在しないユーザー名' })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('ソートパラメータが正しく送信される', async () => {
      const result = await service.searchUsers({
        sortBy: 'name',
        sortOrder: 'asc',
      })

      expect(result.data.length).toBeGreaterThan(1)
      // asc ソートなので最初のユーザー名が後のものより辞書順で小さい
      const names = result.data.map((u) => u.name)
      const sorted = [...names].sort((a, b) => a.localeCompare(b))
      expect(names).toEqual(sorted)
    })
  })

  describe('createUser', () => {
    it('新しいユーザーを作成できる', async () => {
      const result = await service.createUser({
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'viewer',
      })

      expect(result.user).toBeDefined()
      expect(result.user.name).toBe('テストユーザー')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.role).toBe('viewer')
      expect(result.user.id).toBeDefined()
    })

    it('バリデーションエラー時に400エラーをスローする', async () => {
      server.use(userErrorHandlers.createValidationError)

      await expect(
        service.createUser({
          name: 'test',
          email: 'duplicate@example.com',
          role: 'viewer',
        }),
      ).rejects.toThrow(ApiError)

      try {
        await service.createUser({
          name: 'test',
          email: 'duplicate@example.com',
          role: 'viewer',
        })
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(400)
        expect(apiError.data).toEqual({
          message: 'Email already exists',
          field: 'email',
        })
      }
    })

    it('サーバーエラー時に500エラーをスローする', async () => {
      server.use(userErrorHandlers.createServerError)

      await expect(
        service.createUser({
          name: 'test',
          email: 'test@example.com',
          role: 'viewer',
        }),
      ).rejects.toThrow(ApiError)
    })
  })

  describe('downloadUsersCsv', () => {
    it('CSVデータをBlobとして取得できる', async () => {
      const blob = await service.downloadUsersCsv()
      const text = await blob.text()

      expect(text).toContain('id,name,email,role')
      expect(text).toContain('田中太郎')
    })

    it('フィルタパラメータを送信できる', async () => {
      const blob = await service.downloadUsersCsv({ query: '田中' })
      const text = await blob.text()

      expect(text).toContain('田中太郎')
      // 田中以外のユーザーはCSVに含まれない
      expect(text).not.toContain('佐藤花子')
    })

    it('サーバーエラー時にApiErrorをスローする', async () => {
      server.use(userErrorHandlers.csvServerError)

      await expect(service.downloadUsersCsv()).rejects.toThrow(ApiError)
    })
  })
})
