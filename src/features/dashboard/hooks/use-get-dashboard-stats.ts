import { useQuery, queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import { DashboardService } from '../services/dashboard.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import type { DashboardData } from '@/types/dashboard.js'

const dashboardService = new DashboardService(
  new ApiClient(window.location.origin),
)

/**
 * queryOptions で定義することで、useQuery と ensureQueryData の両方で
 * 型安全に共有できる。DataTag による型推論も有効になる。
 */
export function getDashboardQueryOptions() {
  return queryOptions<DashboardData>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getDashboardData(),
  })
}

/**
 * ダッシュボード統計データを取得するカスタムフック
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useGetDashboardStats()
 * if (isLoading) return <LoadingSkeleton />
 * if (isError) return <ErrorMessage />
 * return <Dashboard stats={data.stats} />
 * ```
 */
export function useGetDashboardStats() {
  return useQuery(getDashboardQueryOptions())
}
