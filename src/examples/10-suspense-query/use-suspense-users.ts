/**
 * サンプル10: useSuspenseQuery — React Suspense との統合
 *
 * useSuspenseQuery を使うと:
 * 1. data は常に存在（undefined にならない）
 * 2. ローディング状態は <Suspense> の fallback で処理
 * 3. エラーは <ErrorBoundary> で処理
 * → コンポーネント内で isLoading/isError の分岐が不要になる
 */
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import type { PaginatedResponse } from '@/types/api.js'
import type { User, UserSearchParams } from '@/types/user.js'
import { UserService } from '@/features/users/services/user.service.js'
import { ApiClient } from '@/lib/api/api-client.js'

const userService = new UserService(new ApiClient(window.location.origin))

export function useSuspenseUsers(params: UserSearchParams) {
  return useSuspenseQuery<PaginatedResponse<User>>({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.searchUsers(params),
  })
  // 戻り値の data は PaginatedResponse<User>（undefined にならない）
}
