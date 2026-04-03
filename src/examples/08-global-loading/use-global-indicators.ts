/**
 * サンプル08: useIsFetching / useIsMutating — グローバルなインジケータ
 *
 * アプリ全体で進行中のクエリ/ミューテーションの数を監視し、
 * グローバルなローディングバーや「保存中...」表示を実現する。
 */
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys.js'

// ━━━ 全体のフェッチ状態 ━━━
export function useGlobalFetchingCount() {
  return useIsFetching()
}

// ━━━ ユーザー関連だけのフェッチ状態 ━━━
export function useUsersFetchingCount() {
  return useIsFetching({ queryKey: queryKeys.users.all })
}

// ━━━ 全体のミューテーション状態 ━━━
export function useGlobalMutatingCount() {
  return useIsMutating()
}

// ━━━ 複合インジケータ ━━━
export function useAppActivity() {
  const fetching = useIsFetching()
  const mutating = useIsMutating()

  return {
    isFetching: fetching > 0,
    isMutating: mutating > 0,
    isActive: fetching > 0 || mutating > 0,
    fetchingCount: fetching,
    mutatingCount: mutating,
  }
}
