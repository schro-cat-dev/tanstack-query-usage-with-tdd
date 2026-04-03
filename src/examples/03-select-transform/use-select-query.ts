/**
 * サンプル03: select オプション — レスポンスを変換して部分データだけ取得
 *
 * select を使うと:
 * 1. キャッシュにはフルデータが保存される
 * 2. コンポーネントには変換後のデータだけ渡る
 * 3. 変換結果が変わった場合のみ再レンダリング
 */
import { useQuery } from '@tanstack/react-query'
import { searchUsersQueryOptions } from '@/features/users/hooks/use-search-users.js'
import type { PaginatedResponse } from '@/types/api.js'
import type { User, UserSearchParams, UserRole } from '@/types/user.js'

// ━━━ ユーザー名だけ取得する ━━━
export function useUserNames(params: UserSearchParams) {
  return useQuery({
    ...searchUsersQueryOptions(params),
    select: (response: PaginatedResponse<User>) =>
      response.data.map((u) => u.name),
    // 戻り値の data は string[] になる（PaginatedResponse<User> ではない）
  })
}

// ━━━ 特定ロールのユーザーだけフィルタして取得 ━━━
export function useUsersByRole(params: UserSearchParams, role: UserRole) {
  return useQuery({
    ...searchUsersQueryOptions(params),
    select: (response: PaginatedResponse<User>) => ({
      users: response.data.filter((u) => u.role === role),
      count: response.data.filter((u) => u.role === role).length,
      totalBeforeFilter: response.total,
    }),
  })
}

// ━━━ 統計サマリーだけ取得する ━━━
export function useUserStats(params: UserSearchParams) {
  return useQuery({
    ...searchUsersQueryOptions(params),
    select: (response: PaginatedResponse<User>) => {
      const roleCount = response.data.reduce(
        (acc, u) => {
          acc[u.role] = (acc[u.role] || 0) + 1
          return acc
        },
        {} as Record<UserRole, number>,
      )
      return {
        total: response.total,
        roleCount,
        emails: response.data.map((u) => u.email),
      }
    },
  })
}
