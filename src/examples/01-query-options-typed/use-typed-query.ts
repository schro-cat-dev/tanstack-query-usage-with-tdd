/**
 * サンプル01: queryOptions による型安全な共有
 *
 * queryOptions() で定義すると:
 * 1. useQuery と ensureQueryData で同じ型が推論される
 * 2. getQueryData で DataTag 経由の型推論が効く
 * 3. queryKey と queryFn の不整合を防げる
 */
import { useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import type { User } from '@/types/user.js'
import { ApiClient } from '@/lib/api/api-client.js'

const apiClient = new ApiClient(window.location.origin)

// ━━━ queryOptions で型付きオプションを定義 ━━━
export function userDetailOptions(userId: string) {
  return queryOptions<User>({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => apiClient.get<User>(`/api/users/${userId}`),
    staleTime: 60_000,
  })
}

// ━━━ useQuery に渡す（型が自動推論される）━━━
export function useUserDetail(userId: string) {
  return useQuery(userDetailOptions(userId))
  // 戻り値の data は User | undefined と推論される
}

// ━━━ getQueryData でも型が推論される ━━━
export function useCachedUserName(userId: string): string | undefined {
  const queryClient = useQueryClient()
  // DataTag のおかげで data は User | undefined と推論される
  const data = queryClient.getQueryData(userDetailOptions(userId).queryKey)
  return data?.name
}
