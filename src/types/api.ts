/**
 * API通信で使用する共通型定義
 */

/**
 * APIエラークラス
 * fetchのレスポンスがokでない場合にスローされる
 */
export class ApiError extends Error {
  readonly status: number
  readonly statusText: string
  readonly data: unknown

  constructor(status: number, statusText: string, data?: unknown) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}
