import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useMultipleUsers, useMultipleUsersCombined } from './use-parallel-queries.js'
import { mockUsers } from '@/mocks/data/users.js'

describe('05: useQueries — 並列クエリ', () => {
  beforeEach(() => {
    // 個別ユーザー取得のハンドラ
    mockUsers.forEach((user) => {
      server.use(
        http.get(`*/api/users/${user.id}`, () => HttpResponse.json(user)),
      )
    })
  })

  describe('useMultipleUsers — 並列取得', () => {
    it('複数のユーザーを並列に取得できる', async () => {
      const { result } = renderHookWithProviders(() =>
        useMultipleUsers(['1', '2', '3']),
      )

      await waitFor(() => {
        expect(result.current.every((r) => r.isSuccess)).toBe(true)
      })

      expect(result.current).toHaveLength(3)
      expect(result.current[0].data?.name).toBe('田中太郎')
      expect(result.current[1].data?.name).toBe('佐藤花子')
      expect(result.current[2].data?.name).toBe('鈴木一郎')
    })

    it('1つが失敗しても他のクエリは成功する', async () => {
      server.use(
        http.get('*/api/users/2', () =>
          HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
        ),
      )

      const { result } = renderHookWithProviders(() =>
        useMultipleUsers(['1', '2', '3']),
      )

      await waitFor(() => {
        expect(result.current[0].isSuccess).toBe(true)
        expect(result.current[1].isError).toBe(true)
        expect(result.current[2].isSuccess).toBe(true)
      })

      expect(result.current[0].data?.name).toBe('田中太郎')
      expect(result.current[1].error).toBeDefined()
      expect(result.current[2].data?.name).toBe('鈴木一郎')
    })
  })

  describe('useMultipleUsersCombined — combine で集約', () => {
    it('成功したユーザーだけをまとめて返す', async () => {
      const { result } = renderHookWithProviders(() =>
        useMultipleUsersCombined(['1', '2', '3']),
      )

      await waitFor(() => {
        expect(result.current.isAnyLoading).toBe(false)
      })

      expect(result.current.users).toHaveLength(3)
      expect(result.current.successCount).toBe(3)
      expect(result.current.totalCount).toBe(3)
      expect(result.current.isAnyError).toBe(false)
    })

    it('エラーがあっても成功分は取得できる', async () => {
      server.use(
        http.get('*/api/users/2', () =>
          HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
        ),
      )

      const { result } = renderHookWithProviders(() =>
        useMultipleUsersCombined(['1', '2', '3']),
      )

      await waitFor(() => {
        expect(result.current.isAnyLoading).toBe(false)
      })

      expect(result.current.users).toHaveLength(2)
      expect(result.current.isAnyError).toBe(true)
      expect(result.current.errors).toHaveLength(1)
      expect(result.current.successCount).toBe(2)
    })
  })
})
