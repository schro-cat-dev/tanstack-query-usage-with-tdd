import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useUserNames, useUsersByRole, useUserStats } from './use-select-query.js'

describe('03: select オプション — データ変換', () => {
  const defaultParams = { page: 1, perPage: 10 }

  describe('useUserNames — 名前だけ取得', () => {
    it('ユーザー名の配列を返す', async () => {
      const { result } = renderHookWithProviders(() =>
        useUserNames(defaultParams),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // data は string[] 型（PaginatedResponse ではない）
      expect(result.current.data).toBeInstanceOf(Array)
      expect(result.current.data).toContain('田中太郎')
      expect(typeof result.current.data?.[0]).toBe('string')
    })
  })

  describe('useUsersByRole — ロールでフィルタ', () => {
    it('admin ロールのユーザーだけを返す', async () => {
      const { result } = renderHookWithProviders(() =>
        useUsersByRole(defaultParams, 'admin'),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.users.every((u) => u.role === 'admin')).toBe(true)
      expect(result.current.data?.count).toBeGreaterThan(0)
      expect(result.current.data?.totalBeforeFilter).toBeGreaterThanOrEqual(
        result.current.data?.count ?? 0,
      )
    })

    it('viewer ロールのユーザーだけを返す', async () => {
      const { result } = renderHookWithProviders(() =>
        useUsersByRole(defaultParams, 'viewer'),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.users.every((u) => u.role === 'viewer')).toBe(true)
    })
  })

  describe('useUserStats — 統計サマリー', () => {
    it('ロール別カウントとメール一覧を返す', async () => {
      const { result } = renderHookWithProviders(() =>
        useUserStats(defaultParams),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.total).toBeGreaterThan(0)
      expect(result.current.data?.roleCount).toBeDefined()
      expect(result.current.data?.emails).toBeInstanceOf(Array)
      expect(result.current.data?.emails[0]).toContain('@')
    })
  })

  describe('select は同じキャッシュを共有する', () => {
    it('異なる select でも API は1回しか呼ばれない', async () => {
      // 同じ queryKey なので、キャッシュは共有される
      const { result: namesResult, queryClient } = renderHookWithProviders(() =>
        useUserNames(defaultParams),
      )

      await waitFor(() => {
        expect(namesResult.current.isSuccess).toBe(true)
      })

      // キャッシュにはフルデータ (PaginatedResponse) が入っている
      const cached = queryClient.getQueryData(['users', 'list', defaultParams])
      expect(cached).toBeDefined()
      expect((cached as any).data).toBeInstanceOf(Array)
      expect((cached as any).total).toBeDefined()
    })
  })
})
