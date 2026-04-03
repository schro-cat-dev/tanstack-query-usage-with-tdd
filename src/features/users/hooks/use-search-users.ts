import { useQuery, queryOptions, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import { UserService } from '../services/user.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import type { PaginatedResponse } from '@/types/api.js'
import type { User, UserSearchParams } from '@/types/user.js'

const userService = new UserService(new ApiClient(window.location.origin))

/**
 * ユーザー検索のqueryOptionsを生成する
 * Route loaderとhookの両方で共有してキャッシュキーの一貫性を保つ
 */
export function searchUsersQueryOptions(params: UserSearchParams) {
  return queryOptions<PaginatedResponse<User>>({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.searchUsers(params),
    placeholderData: keepPreviousData,
  })
}

/**
 * ユーザー一覧を検索・取得するカスタムフック
 *
 * - 検索パラメータが変わると自動で再フェッチ
 * - keepPreviousData でパラメータ変更時も前のデータを表示し続ける
 * - Query Key Factory でキャッシュキーを管理
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSearchUsers({ query: '田中', page: 1, perPage: 10 })
 * ```
 */
export function useSearchUsers(params: UserSearchParams) {
  return useQuery(searchUsersQueryOptions(params))
}
