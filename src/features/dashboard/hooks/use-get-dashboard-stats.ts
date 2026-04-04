import { useQueries, queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import { DashboardService } from '../services/dashboard.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import type { DashboardStats, ActivityEntry } from '@/types/dashboard.js'

const dashboardService = new DashboardService(
  new ApiClient(window.location.origin),
)

/** 統計データの queryOptions */
export function dashboardStatsOptions() {
  return queryOptions<DashboardStats>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getStats(),
    staleTime: 60_000, // 統計は1分キャッシュ
  })
}

/** アクティビティの queryOptions */
export function dashboardActivityOptions() {
  return queryOptions<ActivityEntry[]>({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: () => dashboardService.getActivity(),
    staleTime: 30_000, // アクティビティは30秒キャッシュ
  })
}

/**
 * ダッシュボードの統計とアクティビティを **並行取得** するフック
 *
 * - 2つのAPIを独立して呼び出し、それぞれ独立したキャッシュを持つ
 * - 一方が失敗しても他方のデータは表示できる
 * - combine で使いやすい形に変換
 */
export function useGetDashboardStats() {
  return useQueries({
    queries: [
      dashboardStatsOptions(),
      dashboardActivityOptions(),
    ],
    combine: ([statsQuery, activityQuery]) => ({
      stats: statsQuery.data,
      recentActivity: activityQuery.data,
      isLoading: statsQuery.isLoading || activityQuery.isLoading,
      isError: statsQuery.isError || activityQuery.isError,
      error: statsQuery.error ?? activityQuery.error,
      refetch: () => {
        statsQuery.refetch()
        activityQuery.refetch()
      },
      // 個別の状態にもアクセス可能
      statsStatus: statsQuery.status,
      activityStatus: activityQuery.status,
    }),
  })
}

/** Router loader 用: 両方をプリフェッチ */
export function getDashboardQueryOptions() {
  return dashboardStatsOptions()
}
