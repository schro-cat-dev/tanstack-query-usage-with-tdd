import { useState, useCallback } from 'react'
import { UserService } from '../services/user.service.js'
import { ApiClient } from '@/lib/api/api-client.js'
import type { UserSearchParams } from '@/types/user.js'

const userService = new UserService(new ApiClient(window.location.origin))

/**
 * CSVダウンロードフック
 *
 * TanStack Query のキャッシュを使わない（Blobは一時的なデータであり、キャッシュに乗せるべきでない）。
 * useState + useCallback のシンプルなパターンで実装する。
 *
 * @example
 * ```tsx
 * const { download, isDownloading, error } = useDownloadUsersCsv()
 *
 * <button onClick={() => download({ query: '田中' })} disabled={isDownloading}>
 *   {isDownloading ? 'ダウンロード中...' : 'CSVダウンロード'}
 * </button>
 * ```
 */
export function useDownloadUsersCsv() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const download = useCallback(
    async (params?: Pick<UserSearchParams, 'query' | 'role'>) => {
      setIsDownloading(true)
      setError(null)

      try {
        const blob = await userService.downloadUsersCsv(params)

        // ブラウザにダウンロードを発火させる
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'users.csv'
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsDownloading(false)
      }
    },
    [],
  )

  return { download, isDownloading, error }
}
