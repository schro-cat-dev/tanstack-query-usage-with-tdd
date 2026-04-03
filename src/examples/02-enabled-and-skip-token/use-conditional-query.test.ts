import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import {
  useUserDetailWithEnabled,
  useUserDetailWithSkipToken,
  useUserDetailConditional,
} from './use-conditional-query.js'
import type { User } from '@/types/user.js'

const mockUser: User = {
  id: '1',
  name: '田中太郎',
  email: 'tanaka@example.com',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('02: enabled と skipToken — 条件付きクエリ', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/users/1', () => HttpResponse.json(mockUser)),
    )
  })

  describe('enabled パターン', () => {
    it('userId が null の場合、クエリを実行しない', () => {
      const { result } = renderHookWithProviders(() =>
        useUserDetailWithEnabled(null),
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toBeUndefined()
      // isPending は true（データがまだない状態）
      expect(result.current.isPending).toBe(true)
    })

    it('userId がある場合、データを取得する', async () => {
      const { result } = renderHookWithProviders(() =>
        useUserDetailWithEnabled('1'),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(result.current.data?.name).toBe('田中太郎')
    })
  })

  describe('skipToken パターン', () => {
    it('userId が null の場合、クエリを実行しない', () => {
      const { result } = renderHookWithProviders(() =>
        useUserDetailWithSkipToken(null),
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('userId がある場合、データを取得する', async () => {
      const { result } = renderHookWithProviders(() =>
        useUserDetailWithSkipToken('1'),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(result.current.data?.name).toBe('田中太郎')
    })
  })

  describe('queryOptions + skipToken パターン', () => {
    it('userId が null の場合、クエリを実行しない', () => {
      const { result } = renderHookWithProviders(() =>
        useUserDetailConditional(null),
      )

      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('userId がある場合、データを取得する', async () => {
      const { result } = renderHookWithProviders(() =>
        useUserDetailConditional('1'),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(result.current.data?.name).toBe('田中太郎')
    })
  })
})
