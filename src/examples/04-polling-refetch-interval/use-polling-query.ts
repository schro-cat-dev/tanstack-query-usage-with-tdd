/**
 * サンプル04: refetchInterval — ポーリングによるリアルタイム更新
 *
 * TanStack Query はプルベースなので、データは「勝手に更新されない」。
 * refetchInterval を使うと一定間隔で自動再取得できる。
 */
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import { DashboardService } from '@/features/dashboard/services/dashboard.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import type { DashboardData } from '@/types/dashboard.js'

const dashboardService = new DashboardService(new ApiClient(window.location.origin))

// ━━━ 固定間隔のポーリング ━━━
export function usePollingDashboard(intervalMs: number = 30_000) {
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: intervalMs,             // 指定ミリ秒ごとに再取得
    refetchIntervalInBackground: false,      // バックグラウンドタブでは停止
  })
}

// ━━━ 条件付きポーリング（特定の状態で停止）━━━
export function useConditionalPolling() {
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: (query) => {
      // アクティブユーザーが0なら更新不要 → ポーリング停止
      const data = query.state.data
      if (data && data.stats.activeUsers === 0) return false
      return 10_000  // 10秒ごと
    },
  })
}
