import { QueryClient } from '@tanstack/react-query'

/**
 * アプリケーション全体で使用するQueryClientインスタンス
 * staleTime: 30秒 → 30秒以内の再レンダリングではキャッシュを再利用
 * gcTime: 5分 → 使われなくなったキャッシュは5分後に破棄
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})
