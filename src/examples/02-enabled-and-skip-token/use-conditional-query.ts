/**
 * サンプル02: enabled と skipToken — 条件付きクエリの2つの書き方
 *
 * enabled: boolean で制御する方法と、skipToken で queryFn 自体を無効化する方法。
 * skipToken の方が型安全（queryFn 内で null チェック不要）。
 */
import { useQuery, skipToken, queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import type { User } from '@/types/user.js'
import { ApiClient } from '@/lib/api/api-client.js'

const apiClient = new ApiClient(window.location.origin)

// ━━━ 方法1: enabled オプション ━━━
export function useUserDetailWithEnabled(userId: string | null) {
  return useQuery<User>({
    queryKey: queryKeys.users.detail(userId ?? '__disabled__'),
    queryFn: () => apiClient.get<User>(`/api/users/${userId!}`), // ! が必要（型的に安全でない）
    enabled: !!userId,   // false ならクエリは実行されない
  })
}

// ━━━ 方法2: skipToken（v5 推奨）━━━
export function useUserDetailWithSkipToken(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId ?? '__disabled__'),
    queryFn: userId
      ? () => apiClient.get<User>(`/api/users/${userId}`)  // userId は string（null でない）
      : skipToken,   // queryFn 自体がスキップされる
  })
}

// ━━━ 方法3: queryOptions + skipToken の組み合わせ ━━━
export function conditionalUserOptions(userId: string | null) {
  return queryOptions({
    queryKey: queryKeys.users.detail(userId ?? '__disabled__'),
    queryFn: userId
      ? () => apiClient.get<User>(`/api/users/${userId}`)
      : skipToken,
  })
}

export function useUserDetailConditional(userId: string | null) {
  return useQuery(conditionalUserOptions(userId))
}
