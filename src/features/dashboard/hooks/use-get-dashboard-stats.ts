import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import { DashboardService } from '../services/dashboard.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import type { DashboardData } from '@/types/dashboard.js'

const dashboardService = new DashboardService(
  new ApiClient(window.location.origin),
)

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
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getDashboardData(),
  })
}

/** queryOptions を export して Router loader でも使えるようにする */
export function getDashboardQueryOptions() {
  return {
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getDashboardData(),
  }
}
