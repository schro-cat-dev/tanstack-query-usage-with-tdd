/**
 * サンプル06: 依存クエリ — クエリAの結果を使ってクエリBを実行
 *
 * あるクエリの結果（例: ユーザーのチームID）を使って
 * 次のクエリ（チーム詳細）を実行するパターン。
 */
import { useQuery, skipToken } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import type { User } from '@/types/user.js'
import type { DashboardData } from '@/types/dashboard.js'
import { ApiClient } from '@/lib/api/api-client.js'

const apiClient = new ApiClient(window.location.origin)

// ━━━ 依存クエリ: ユーザー → そのユーザーの所属ダッシュボード ━━━
export function useUserWithDashboard(userId: string | null) {
  // クエリ1: ユーザー取得
  const userQuery = useQuery({
    queryKey: queryKeys.users.detail(userId ?? '__disabled__'),
    queryFn: userId
      ? () => apiClient.get<User>(`/api/users/${userId}`)
      : skipToken,
  })

  // クエリ2: ユーザーのロールに基づいてダッシュボードを取得
  // → userQuery が成功するまで実行されない
  const dashboardQuery = useQuery({
    queryKey: [...queryKeys.dashboard.all, 'by-role', userQuery.data?.role],
    queryFn: userQuery.data?.role
      ? () => apiClient.get<DashboardData>('/api/dashboard')
      : skipToken,
    // userQuery.data が undefined なら skipToken → クエリ実行されない
  })

  return {
    user: userQuery.data,
    dashboard: dashboardQuery.data,
    isLoading: userQuery.isLoading || (userQuery.isSuccess && dashboardQuery.isLoading),
    isError: userQuery.isError || dashboardQuery.isError,
    error: userQuery.error ?? dashboardQuery.error,
  }
}
