import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'
import { UserService } from '../services/user.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import type { CreateUserRequest, CreateUserResponse } from '@/types/user.js'

const userService = new UserService(new ApiClient(window.location.origin))

/**
 * ユーザー作成ミューテーションフック
 *
 * - 成功時にユーザー一覧キャッシュを自動で無効化（再フェッチ）
 * - エラー時はキャッシュに影響しない
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error } = useCreateUser()
 *
 * const handleSubmit = (data: CreateUserRequest) => {
 *   mutate(data, {
 *     onSuccess: (result) => {
 *       console.log('作成完了:', result.user)
 *     },
 *   })
 * }
 * ```
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<CreateUserResponse, Error, CreateUserRequest>({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      // ユーザー一覧のキャッシュを無効化 → 自動で再フェッチされる
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}
