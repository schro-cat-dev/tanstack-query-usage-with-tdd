/**
 * サンプル09: useInfiniteQuery — 「もっと見る」型の無限スクロール
 *
 * ページネーションを「次のページを追加読み込み」形式で実現する。
 * 全ページのデータが pages 配列に蓄積される。
 */
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import type { PaginatedResponse } from '@/types/api.js'
import type { User } from '@/types/user.js'
import { ApiClient } from '@/lib/api/api-client.js'

const apiClient = new ApiClient(window.location.origin)

export function useInfiniteUsers(perPage: number = 3) {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'] as const,
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedResponse<User>>('/api/users', {
        page: String(pageParam),
        perPage: String(perPage),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<User>) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.perPage)
      if (lastPage.page >= totalPages) return undefined
      return lastPage.page + 1
    },
  })
}

/**
 * 全ページのデータをフラットに展開するヘルパー
 */
export function flattenInfiniteUsers(
  data: InfiniteData<PaginatedResponse<User>> | undefined,
): User[] {
  return data?.pages.flatMap((page) => page.data) ?? []
}
