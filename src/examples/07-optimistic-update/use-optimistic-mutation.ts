/**
 * サンプル07: 楽観的更新（Optimistic Update）
 *
 * UI を先に更新し、API 応答後に確定する。失敗時はロールバック。
 * ユーザー体験が大幅に向上する（操作が即座に反映される）。
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import type { PaginatedResponse } from '@/types/api.js'
import type { User, CreateUserRequest, CreateUserResponse } from '@/types/user.js'
import { UserService } from '@/features/users/services/user.service.js'
import { ApiClient } from '@/lib/api/api-client.js'

const userService = new UserService(new ApiClient(window.location.origin))

interface OptimisticContext {
  previousList: PaginatedResponse<User> | undefined
}

/**
 * 楽観的更新付きのユーザー作成フック
 *
 * 1. onMutate: 一覧キャッシュに仮データを追加（即座にUIに反映）
 * 2. onError: 失敗時に元のデータにロールバック
 * 3. onSettled: 常にキャッシュを再取得して確実に最新にする
 */
export function useOptimisticCreateUser() {
  const queryClient = useQueryClient()
  const listKey = queryKeys.users.list({ page: 1, perPage: 10 })

  return useMutation<CreateUserResponse, Error, CreateUserRequest, OptimisticContext>({
    mutationFn: (data) => userService.createUser(data),

    onMutate: async (newUserData) => {
      // 1. 進行中のフェッチをキャンセル（競合防止）
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })

      // 2. 現在のキャッシュを保存（ロールバック用）
      const previousList = queryClient.getQueryData<PaginatedResponse<User>>(listKey)

      // 3. キャッシュを楽観的に更新
      if (previousList) {
        const optimisticUser: User = {
          id: `temp-${Date.now()}`,
          name: newUserData.name,
          email: newUserData.email,
          role: newUserData.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        queryClient.setQueryData<PaginatedResponse<User>>(listKey, {
          ...previousList,
          data: [optimisticUser, ...previousList.data],
          total: previousList.total + 1,
        })
      }

      return { previousList }
    },

    onError: (_error, _variables, context) => {
      // 4. 失敗時: 元のデータに戻す
      if (context?.previousList) {
        queryClient.setQueryData(listKey, context.previousList)
      }
    },

    onSettled: () => {
      // 5. 常に: サーバーの真のデータで上書き
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}
