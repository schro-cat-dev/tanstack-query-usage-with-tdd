/**
 * ユーザードメインの型定義
 */

/** ユーザーロール */
export const USER_ROLES = ['admin', 'editor', 'viewer'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** ユーザーモデル */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

/** ユーザー検索パラメータ */
export interface UserSearchParams {
  query?: string
  role?: UserRole
  page?: number
  perPage?: number
  sortBy?: keyof User
  sortOrder?: 'asc' | 'desc'
}

/** ユーザー作成リクエスト */
export interface CreateUserRequest {
  name: string
  email: string
  role: UserRole
}

/** ユーザー作成レスポンス */
export interface CreateUserResponse {
  user: User
}
