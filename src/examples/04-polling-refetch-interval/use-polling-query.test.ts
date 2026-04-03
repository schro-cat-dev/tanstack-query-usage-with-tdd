import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { usePollingDashboard } from './use-polling-query.js'

describe('04: refetchInterval — ポーリング', () => {
  it('ダッシュボードデータを取得できる', async () => {
    const { result } = renderHookWithProviders(() => usePollingDashboard(60_000))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.stats.totalUsers).toBe(10)
  })

  it('refetchInterval が設定されている場合、isFetching が周期的に true になる', async () => {
    const { result } = renderHookWithProviders(() => usePollingDashboard(500))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // 短い間隔でポーリングが発火する。dataUpdatedAt が更新されるのを確認
    const firstUpdatedAt = result.current.dataUpdatedAt

    await waitFor(
      () => {
        expect(result.current.dataUpdatedAt).toBeGreaterThan(firstUpdatedAt)
      },
      { timeout: 3000 },
    )
  })
})
