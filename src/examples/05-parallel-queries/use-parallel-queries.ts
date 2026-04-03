/**
 * サンプル05: useQueries — 複数クエリの並列実行
 *
 * 独立した複数のクエリを並列に実行し、まとめて結果を受け取る。
 * Promise.all と違い、1つが失敗しても他は続行する。
 */
import { useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import type { User } from '@/types/user.js'
import { ApiClient } from '@/lib/api/api-client.js'

const apiClient = new ApiClient(window.location.origin)

// ━━━ 複数ユーザーを並列取得 ━━━
export function useMultipleUsers(userIds: string[]) {
  return useQueries({
    queries: userIds.map((id) => ({
      queryKey: queryKeys.users.detail(id),
      queryFn: () => apiClient.get<User>(`/api/users/${id}`),
    })),
  })
}

// ━━━ combine で結果を変換 ━━━
export function useMultipleUsersCombined(userIds: string[]) {
  return useQueries({
    queries: userIds.map((id) => ({
      queryKey: queryKeys.users.detail(id),
      queryFn: () => apiClient.get<User>(`/api/users/${id}`),
    })),
    combine: (results) => ({
      users: results.map((r) => r.data).filter((d): d is User => d !== undefined),
      isAllLoading: results.every((r) => r.isLoading),
      isAnyLoading: results.some((r) => r.isLoading),
      isAnyError: results.some((r) => r.isError),
      errors: results.filter((r) => r.isError).map((r) => r.error),
      successCount: results.filter((r) => r.isSuccess).length,
      totalCount: results.length,
    }),
  })
}
