import { QueryClient } from '@tanstack/react-query'

/**
 * テスト用のQueryClientを作成する
 * - retry: false (テストでリトライは不要)
 * - gcTime: 0 (テスト間でキャッシュを残さない)
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
