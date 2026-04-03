# QueryClient 完全リファレンス

`QueryClient` はキャッシュの管理、デフォルト設定、およびすべてのクエリ/ミューテーション操作の中心です。

---

## コンストラクタ

```ts
const queryClient = new QueryClient({
  queryCache?: QueryCache,
  mutationCache?: MutationCache,
  defaultOptions?: DefaultOptions,
})
```

### DefaultOptions の型

```ts
interface DefaultOptions {
  queries?: {
    staleTime?: number          // デフォルト: 0
    gcTime?: number             // デフォルト: 300000 (5分)
    retry?: number | boolean    // デフォルト: 3
    refetchOnWindowFocus?: boolean  // デフォルト: true
    refetchOnMount?: boolean    // デフォルト: true
    refetchOnReconnect?: boolean  // デフォルト: true
    // ... その他全 UseQueryOptions
  }
  mutations?: {
    retry?: number | boolean    // デフォルト: 0
    gcTime?: number             // デフォルト: 300000
    // ... その他全 UseMutationOptions
  }
}
```

---

## キャッシュ読み取りメソッド

### getQueryData — キャッシュからデータを取得

```ts
const data = queryClient.getQueryData<User[]>(queryKeys.users.list({ page: 1 }))
// data: User[] | undefined
```

APIは叩かず、キャッシュに存在するデータだけを返します。存在しなければ `undefined`。

### getQueryState — クエリの内部状態を取得

```ts
const state = queryClient.getQueryState(queryKeys.users.list({ page: 1 }))
// state: QueryState | undefined
```

```ts
interface QueryState<TData, TError> {
  data: TData | undefined
  dataUpdateCount: number
  dataUpdatedAt: number        // 最後のデータ更新時刻
  error: TError | null
  errorUpdateCount: number
  errorUpdatedAt: number       // 最後のエラー時刻
  fetchFailureCount: number    // 連続失敗回数
  fetchFailureReason: TError | null
  fetchMeta: FetchMeta | null
  isInvalidated: boolean       // 無効化されているか
  status: 'pending' | 'error' | 'success'
  fetchStatus: 'fetching' | 'paused' | 'idle'
}
```

### getQueriesData — 複数クエリのデータを一括取得

```ts
const allUserData = queryClient.getQueriesData({
  queryKey: queryKeys.users.all,
})
// Array<[QueryKey, TData | undefined]>
```

---

## キャッシュ書き込みメソッド

### setQueryData — キャッシュにデータを書き込む

```ts
// 直接値をセット
queryClient.setQueryData(queryKeys.users.detail('123'), updatedUser)

// 前の値を元に更新（Updater 関数）
queryClient.setQueryData(queryKeys.users.detail('123'), (old) => ({
  ...old,
  name: '新しい名前',
}))
```

**用途:** 楽観的更新、ローカルでの即座のUI反映

### setQueriesData — 複数クエリを一括更新

```ts
queryClient.setQueriesData(
  { queryKey: queryKeys.users.lists() },
  (old) => old ? { ...old, /* 更新 */ } : old,
)
```

---

## キャッシュ無効化・再取得メソッド

### invalidateQueries — キャッシュを無効化

```ts
await queryClient.invalidateQueries({
  queryKey: queryKeys.users.lists(),  // 前方一致
  exact: false,                       // デフォルト: false（前方一致）
  refetchType: 'active',             // 'active'(デフォルト) | 'inactive' | 'all' | 'none'
})
```

| `refetchType` | 動作 |
|--------------|------|
| `'active'`(デフォルト) | 現在表示中のクエリだけ即座に再取得 |
| `'inactive'` | 非表示のクエリだけ再取得 |
| `'all'` | すべて再取得 |
| `'none'` | 無効化だけして再取得しない（次に表示されたとき再取得） |

### refetchQueries — 再取得を強制

```ts
await queryClient.refetchQueries({
  queryKey: queryKeys.users.lists(),
  type: 'active',   // 'all' | 'active' | 'inactive'
})
```

`invalidateQueries` と違い、staleTime に関係なく強制的に再取得します。

### cancelQueries — 進行中のフェッチをキャンセル

```ts
await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
```

楽観的更新の前に使い、競合するフェッチを止めます。

### removeQueries — キャッシュから完全に削除

```ts
queryClient.removeQueries({ queryKey: queryKeys.users.detail('123') })
```

キャッシュからエントリ自体を削除します。GCを待たずに即座にメモリ解放。

### resetQueries — 初期状態にリセット

```ts
await queryClient.resetQueries({ queryKey: queryKeys.users.all })
```

`initialData` が設定されていればその値に、なければ `undefined` に戻します。

---

## データ取得メソッド（コンポーネント外で使う）

### ensureQueryData — データがなければ取得

```ts
const data = await queryClient.ensureQueryData({
  queryKey: queryKeys.dashboard.stats(),
  queryFn: () => dashboardService.getDashboardData(),
  staleTime: 30_000,  // キャッシュが新鮮なら API を叩かない
})
```

**Router Loader での利用（本プロジェクトの実装）:**

```ts
// src/routes/index.tsx
loader: ({ context }) =>
  context.queryClient.ensureQueryData(getDashboardQueryOptions())
```

### prefetchQuery — バックグラウンドでプリフェッチ

```ts
await queryClient.prefetchQuery({
  queryKey: queryKeys.users.detail('123'),
  queryFn: () => userService.getUser('123'),
})
```

`ensureQueryData` との違い: 戻り値が `void`（エラーは握りつぶされる）。

### fetchQuery — 必ずAPIを叩いてデータ取得

```ts
const data = await queryClient.fetchQuery({
  queryKey: queryKeys.users.detail('123'),
  queryFn: () => userService.getUser('123'),
})
```

キャッシュの有無に関係なく常にAPIを呼びます。

---

## 設定メソッド

### setDefaultOptions / getDefaultOptions

```ts
// 全体のデフォルトを変更
queryClient.setDefaultOptions({
  queries: { staleTime: 60_000 },
})

const defaults = queryClient.getDefaultOptions()
```

### setQueryDefaults / getQueryDefaults

特定のキーに対するデフォルトを設定します。

```ts
// 'users' で始まるすべてのクエリに staleTime: 60秒を設定
queryClient.setQueryDefaults(queryKeys.users.all, {
  staleTime: 60_000,
})
```

### setMutationDefaults / getMutationDefaults

```ts
queryClient.setMutationDefaults(['createUser'], {
  retry: 2,
})
```

---

## ステータスメソッド

### isFetching — 取得中のクエリ数を返す

```ts
const count = queryClient.isFetching()           // 全体
const count = queryClient.isFetching({            // フィルタ付き
  queryKey: queryKeys.users.all,
})
```

### isMutating — 実行中のミューテーション数を返す

```ts
const count = queryClient.isMutating()
```

---

## キャッシュ・ライフサイクル

### getQueryCache / getMutationCache

```ts
const queryCache = queryClient.getQueryCache()
const allQueries = queryCache.getAll()     // すべてのクエリエントリ

const mutationCache = queryClient.getMutationCache()
```

### clear — すべてのキャッシュを削除

```ts
queryClient.clear()
```

ログアウト時などに全キャッシュをクリアするのに使います。

---

## 本プロジェクトでの設定

```ts
// src/lib/query-client.ts（本番用）
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

// src/test/helpers/create-query-client.ts（テスト用）
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}
```
