# 型カタログ — TanStack Query v5 の全型定義

`@tanstack/query-core` および `@tanstack/react-query` からエクスポートされる主要な型をすべてカタログ化します。

---

## ステータス型

### QueryStatus — クエリの基本状態

```ts
type QueryStatus = 'pending' | 'error' | 'success'
```

| 値 | 意味 |
|---|------|
| `'pending'` | データがまだない（初回ロード前、またはデータなしでの再ロード中） |
| `'error'` | 最後のフェッチがエラーで終了した |
| `'success'` | データが正常に取得されている |

### FetchStatus — フェッチの進行状態

```ts
type FetchStatus = 'fetching' | 'paused' | 'idle'
```

| 値 | 意味 |
|---|------|
| `'fetching'` | クエリ関数が実行中 |
| `'paused'` | フェッチしようとしたがオフラインのため一時停止 |
| `'idle'` | クエリ関数が実行されていない |

### MutationStatus — ミューテーションの状態

```ts
type MutationStatus = 'idle' | 'pending' | 'success' | 'error'
```

### QueryStatus と FetchStatus の2軸マトリクス

```
                 fetchStatus
                 fetching    paused      idle
status  pending  初回ロード中  オフライン待機  enabled:false
        error    再取得中     オフライン待機  エラー確定
        success  バックグラウンド更新  —     通常（データあり）
```

---

## キー型

### QueryKey

```ts
type QueryKey = ReadonlyArray<unknown>
```

```ts
// 使用例
const key1: QueryKey = ['users']
const key2: QueryKey = ['users', 'list', { page: 1, perPage: 10 }]
const key3: QueryKey = ['users', 'detail', '123']
```

**ルール:**
- 必ず配列
- 要素はどんな型でもOK（文字列、数値、オブジェクトなど）
- オブジェクトは **深い比較** される（キーの順序は無関係）
- `['users', { page: 1, q: 'test' }]` と `['users', { q: 'test', page: 1 }]` は **同じキー**

### MutationKey

```ts
type MutationKey = ReadonlyArray<unknown>
```

QueryKeyと同じ構造。Mutationの識別に使うが、省略されることが多い。

---

## 関数型

### QueryFunction — queryFn の型

```ts
type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never
> = (context: QueryFunctionContext<TQueryKey, TPageParam>) => T | Promise<T>
```

### QueryFunctionContext — queryFn に渡されるコンテキスト

```ts
interface QueryFunctionContext<TQueryKey extends QueryKey = QueryKey, TPageParam = never> {
  queryKey: TQueryKey          // このクエリのキー
  signal: AbortSignal          // キャンセル用シグナル
  meta: QueryMeta | undefined  // メタデータ
  client: QueryClient          // QueryClient インスタンス
  pageParam?: TPageParam       // Infinite Query のページパラメータ
}
```

### MutationFunction — mutationFn の型

```ts
type MutationFunction<TData = unknown, TVariables = unknown> =
  (variables: TVariables, context: MutationFunctionContext) => Promise<TData>
```

### MutationFunctionContext

```ts
interface MutationFunctionContext {
  client: QueryClient
  meta: MutationMeta | undefined
  mutationKey?: MutationKey
}
```

---

## フィルター型

### QueryFilters — クエリを絞り込む条件

```ts
interface QueryFilters {
  queryKey?: QueryKey        // 前方一致でキーを絞り込む
  exact?: boolean            // true なら完全一致
  type?: 'all' | 'active' | 'inactive'  // アクティブ状態で絞り込む
  stale?: boolean            // stale 状態で絞り込む
  fetchStatus?: FetchStatus  // fetchStatus で絞り込む
  predicate?: (query: Query) => boolean  // カスタム条件
}
```

```ts
// 使用例
queryClient.invalidateQueries({ queryKey: ['users'], exact: false })  // 前方一致
queryClient.invalidateQueries({ queryKey: ['users', 'list', { page: 1 }], exact: true })  // 完全一致
queryClient.cancelQueries({ predicate: (q) => q.state.fetchStatus === 'fetching' })
```

### InvalidateQueryFilters — invalidateQueries のフィルター

```ts
interface InvalidateQueryFilters extends QueryFilters {
  refetchType?: 'active' | 'inactive' | 'all' | 'none'
}
```

### MutationFilters — ミューテーションを絞り込む条件

```ts
interface MutationFilters {
  mutationKey?: MutationKey
  exact?: boolean
  status?: MutationStatus
  predicate?: (mutation: Mutation) => boolean
}
```

---

## データ構造型

### InfiniteData — 無限スクロール用のデータ構造

```ts
interface InfiniteData<TData, TPageParam = unknown> {
  pages: Array<TData>            // 取得した各ページのデータ配列
  pageParams: Array<TPageParam>  // 各ページのパラメータ配列
}
```

### PaginatedResponse（本プロジェクト独自）

```ts
interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}
```

---

## 設定型

### StaleTime

```ts
type StaleTime = number | 'static'
// 'static' を指定すると永遠に stale にならない
```

### NetworkMode

```ts
type NetworkMode = 'online' | 'always' | 'offlineFirst'
```

| モード | 動作 |
|-------|------|
| `'online'` | オンラインのときだけフェッチ |
| `'always'` | ネットワーク状態に関係なく常にフェッチ |
| `'offlineFirst'` | まずフェッチ試行、失敗したらオフラインキューに入れる |

### RetryValue

```ts
type RetryValue<TError> = boolean | number | ((failureCount: number, error: TError) => boolean)
```

```ts
// 使用例
retry: 3                        // 3回リトライ
retry: false                    // リトライしない
retry: (count, error) => {      // 条件付きリトライ
  if (error.status === 404) return false  // 404 はリトライしない
  return count < 3
}
```

### Enabled

```ts
type Enabled<TQueryFnData, TError, TData, TQueryKey> =
  boolean | ((query: Query<TQueryFnData, TError, TData, TQueryKey>) => boolean)
```

```ts
// 使用例
enabled: !!userId              // userId がある場合のみ実行
enabled: (query) => !query.state.data  // データがない場合のみ実行
```

### ThrowOnError

```ts
type ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey> =
  boolean | ((error: TError, query: Query) => boolean)
```

```ts
// 使用例
throwOnError: true                              // すべてのエラーを Error Boundary へ
throwOnError: (error) => error.status >= 500    // 500系だけ Error Boundary へ
```

### NotifyOnChangeProps

```ts
type NotifyOnChangeProps =
  Array<keyof QueryObserverResult> | 'all' | undefined |
  (() => Array<keyof QueryObserverResult> | 'all' | undefined)
```

```ts
// 使用例: data と error だけ変化を監視（他のフラグ変更では再レンダリングしない）
notifyOnChangeProps: ['data', 'error']
```

---

## センチネル値

### keepPreviousData

```ts
function keepPreviousData<T>(previousData: T | undefined): T | undefined
```

`placeholderData` に渡すと、新しいキーでのフェッチ中に前のキーのデータを表示し続けます。

### skipToken

```ts
declare const skipToken: unique symbol
```

`queryFn` に渡すと、そのクエリは実行されません（`enabled: false` の代替）。

```ts
useQuery({
  queryKey: ['user', userId],
  queryFn: userId ? () => fetchUser(userId) : skipToken,
})
```

---

## メタ型

### QueryMeta / MutationMeta

```ts
type QueryMeta = Record<string, unknown>
type MutationMeta = Record<string, unknown>
```

クエリやミューテーションに任意のメタデータを付与できます。QueryCache のグローバルコールバックで参照できます。

```ts
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  meta: { source: 'dashboard', priority: 'high' },
})
```
