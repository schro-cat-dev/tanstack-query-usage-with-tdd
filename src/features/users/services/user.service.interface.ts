import type { PaginatedResponse } from '@/types/api.js'
import type {
  User,
  UserSearchParams,
  CreateUserRequest,
  CreateUserResponse,
} from '@/types/user.js'

/**
 * ユーザーサービスのインターフェース
 * 他プロジェクトでも同様のインターフェースを定義することで、
 * API通信の実装を差し替え可能にする
 */
export interface IUserService {
  /** ユーザー一覧取得（検索・ページネーション・ソート対応） */
  searchUsers(params: UserSearchParams): Promise<PaginatedResponse<User>>

  /** ユーザー作成 */
  createUser(data: CreateUserRequest): Promise<CreateUserResponse>

  /** ユーザーCSVダウンロード */
  downloadUsersCsv(params?: Pick<UserSearchParams, 'query' | 'role'>): Promise<Blob>
}
