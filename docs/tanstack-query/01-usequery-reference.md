# useQuery 完全リファレンス

TanStack Query v5 の `useQuery` の全オプション・全返却値を、公式の型定義(`@tanstack/query-core`)から解析してまとめたものです。

---

## 型シグネチャ

```ts
function useQuery<
  TQueryFnData = unknown,       // queryFn が返すデータの型
  TError = DefaultError,        // エラーの型
  TData = TQueryFnData,         // select 適用後の最終データ型
  TQueryKey extends QueryKey = QueryKey  // queryKey の型
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient     // 省略時は Provider のものを使用
): UseQueryResult<TData, TError>
```

### ジェネリクスの意味

| 型パラメータ | 意味 | 例 |
|------------|------|-----|
| `TQueryFnData` | `queryFn` が返す生データの型 | `PaginatedResponse<User>` |
| `TError` | エラーオブジェクトの型 | `ApiError` |
| `TData` | `select` で変換後の型（省略時は `TQueryFnData` と同じ） | `User[]` |
| `TQueryKey` | `queryKey` の型 | `readonly ['users', 'list', UserSearchParams]` |

---

## 全オプション一覧

### 必須オプション

| オプション | 型 | 説明 |
|-----------|-----|------|
| `queryKey` | `TQueryKey` | キャッシュを識別する一意のキー。配列で指定する |

### データ取得

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `queryFn` | `(context) => Promise<TQueryFnData>` | — | データを取得する非同期関数 |
| `enabled` | `boolean \| (query) => boolean` | `true` | `false` にするとクエリを実行しない |
| `select` | `(data: TQueryFnData) => TData` | — | 取得したデータを変換する関数 |
| `initialData` | `TData \| () => TData` | — | キャッシュの初期値（キャッシュに入る） |
| `initialDataUpdatedAt` | `number \| () => number` | — | initialData の「取得日時」を設定 |
| `placeholderData` | `TData \| (prev) => TData` | — | ローディング中の仮データ（キャッシュには入らない） |

### キャッシュ制御

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `staleTime` | `number \| 'static' \| (query) => number` | `0` | データが「新鮮」とみなされる時間（ms） |
| `gcTime` | `number` | `300000` (5分) | 未使用キャッシュがメモリに残る時間（ms） |

### 自動再取得

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `refetchOnWindowFocus` | `boolean \| 'always'` | `true` | タブ復帰時に再取得するか |
| `refetchOnMount` | `boolean \| 'always'` | `true` | マウント時に再取得するか |
| `refetchOnReconnect` | `boolean \| 'always'` | `true` | ネットワーク復帰時に再取得するか |
| `refetchInterval` | `number \| false \| (query) => number \| false` | `false` | ポーリング間隔（ms） |
| `refetchIntervalInBackground` | `boolean` | `false` | バックグラウンドタブでもポーリングするか |

### リトライ

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `retry` | `boolean \| number \| (failureCount, error) => boolean` | `3` | リトライ回数 |
| `retryDelay` | `number \| (retryAttempt, error) => number` | 指数バックオフ | リトライ間隔 |
| `retryOnMount` | `boolean` | `true` | マウント時にエラー状態のクエリをリトライするか |

### エラー制御

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `throwOnError` | `boolean \| (error, query) => boolean` | `false` | `true` にすると Error Boundary にエラーを投げる |

### 高度なオプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `networkMode` | `'online' \| 'always' \| 'offlineFirst'` | `'online'` | ネットワーク状態に応じた動作 |
| `structuralSharing` | `boolean \| (old, new) => unknown` | `true` | 参照の安定化（不要な再レンダリング防止） |
| `notifyOnChangeProps` | `'all' \| string[]` | — | 変更監視するプロパティを限定（パフォーマンス最適化） |
| `queryKeyHashFn` | `(queryKey) => string` | — | カスタムキーハッシュ関数 |
| `meta` | `Record<string, unknown>` | — | クエリに付与するメタデータ |

---

## 返却値（UseQueryResult）一覧

### データ

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `data` | `TData \| undefined` | 取得したデータ。初回ローディング中は `undefined` |
| `error` | `TError \| null` | エラーオブジェクト |
| `dataUpdatedAt` | `number` | データが最後に更新された時刻（タイムスタンプ） |
| `errorUpdatedAt` | `number` | エラーが最後に発生した時刻（タイムスタンプ） |

### ステータスフラグ

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `status` | `'pending' \| 'error' \| 'success'` | クエリの基本状態 |
| `fetchStatus` | `'fetching' \| 'paused' \| 'idle'` | フェッチの状態 |

### boolean フラグ（status と fetchStatus の組み合わせ）

| プロパティ | 条件 | 意味 |
|-----------|------|------|
| `isLoading` | `isPending && isFetching` | 初回のデータ取得中（キャッシュなし） |
| `isPending` | `status === 'pending'` | データがまだない状態 |
| `isSuccess` | `status === 'success'` | データ取得が成功した |
| `isError` | `status === 'error'` | エラーが発生した |
| `isFetching` | `fetchStatus === 'fetching'` | いずれかのフェッチが進行中 |
| `isRefetching` | `isFetching && !isLoading` | バックグラウンド再取得中 |
| `isStale` | — | データが staleTime を超えて古い |
| `isPaused` | `fetchStatus === 'paused'` | オフラインで一時停止中 |
| `isPlaceholderData` | — | 表示中のデータが placeholderData である |
| `isFetched` | — | 1回以上フェッチが完了した |
| `isFetchedAfterMount` | — | マウント後にフェッチが完了した |
| `isLoadingError` | — | 初回ロードでエラーが発生 |
| `isRefetchError` | — | 再取得でエラーが発生 |

### メソッド

| メソッド | 型 | 説明 |
|---------|------|------|
| `refetch` | `(options?) => Promise<QueryObserverResult>` | 手動でデータを再取得する |

---

## isLoading vs isPending vs isFetching の違い

これは最もよく混乱するポイントです。

```
初回ロード:
  isPending = true   ← データがまだない
  isFetching = true  ← フェッチ中
  isLoading = true   ← isPending AND isFetching

バックグラウンド再取得（データあり）:
  isPending = false  ← データはある（前のキャッシュ）
  isFetching = true  ← 裏で新しいデータを取得中
  isLoading = false  ← isPending が false なので false

enabled: false（未実行）:
  isPending = true   ← データがまだない
  isFetching = false ← フェッチしていない
  isLoading = false  ← isFetching が false なので false
```

**使い分け:**
- 初回ローディングスケルトンを出したい → `isLoading`
- バックグラウンド更新中を示したい → `isFetching && !isLoading`
- データがあるかないかだけ知りたい → `isPending`

---

## queryFn の context パラメータ

`queryFn` は第1引数に `QueryFunctionContext` を受け取ります。

```ts
interface QueryFunctionContext<TQueryKey, TPageParam = never> {
  queryKey: TQueryKey      // 実行中のクエリキー
  signal: AbortSignal      // キャンセル用シグナル
  meta: QueryMeta | undefined  // メタデータ
  client: QueryClient      // QueryClient インスタンス
  pageParam?: TPageParam   // Infinite Query 用
}
```

**活用例: キャンセル対応**

```ts
useQuery({
  queryKey: queryKeys.users.list(params),
  queryFn: async ({ signal }) => {
    const response = await fetch('/api/users', { signal })
    return response.json()
  },
})
```

同じキーで新しいリクエストが発生すると、古いリクエストの `signal` が abort され、不要なレスポンスの処理を回避できます。

---

## 実践例: 本プロジェクトでの使用

### 基本形（ダッシュボード）

```ts
// src/features/dashboard/hooks/use-get-dashboard-stats.ts
export function useGetDashboardStats() {
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getDashboardData(),
  })
}
```

### queryOptions + keepPreviousData（ユーザー検索）

```ts
// src/features/users/hooks/use-search-users.ts
export function searchUsersQueryOptions(params: UserSearchParams) {
  return queryOptions<PaginatedResponse<User>>({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.searchUsers(params),
    placeholderData: keepPreviousData,
  })
}

export function useSearchUsers(params: UserSearchParams) {
  return useQuery(searchUsersQueryOptions(params))
}
```
