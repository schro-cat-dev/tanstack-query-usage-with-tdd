# その他の Hook リファレンス

useQuery / useMutation 以外の TanStack Query v5 の Hook を網羅します。

---

## useInfiniteQuery — 無限スクロール

ページネーションを「次のページを読み込む」形式で実現するフックです。

### 型シグネチャ

```ts
function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
): UseInfiniteQueryResult<TData, TError>
```

### useQuery との違い（追加オプション）

| オプション | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `initialPageParam` | `TPageParam` | **必須** | 最初のページのパラメータ |
| `getNextPageParam` | `(lastPage, allPages, lastPageParam, allPageParams) => TPageParam \| undefined \| null` | **必須** | 次のページパラメータを計算（`undefined`/`null` で最終ページ） |
| `getPreviousPageParam` | 同上 | 任意 | 前のページパラメータを計算 |
| `maxPages` | `number` | 任意 | メモリに保持する最大ページ数 |

### 追加の返却値

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `data.pages` | `TQueryFnData[]` | 取得した全ページの配列 |
| `data.pageParams` | `TPageParam[]` | 各ページのパラメータ配列 |
| `fetchNextPage` | `() => Promise` | 次のページを取得 |
| `fetchPreviousPage` | `() => Promise` | 前のページを取得 |
| `hasNextPage` | `boolean` | 次のページがあるか |
| `hasPreviousPage` | `boolean` | 前のページがあるか |
| `isFetchingNextPage` | `boolean` | 次のページ取得中 |
| `isFetchingPreviousPage` | `boolean` | 前のページ取得中 |

### 実践例

```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) =>
    fetch(`/api/posts?cursor=${pageParam}`).then(r => r.json()),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
})

// 全ページのデータをフラットに展開
const allPosts = data?.pages.flatMap(page => page.items) ?? []

return (
  <div>
    {allPosts.map(post => <PostCard key={post.id} post={post} />)}
    <button
      onClick={() => fetchNextPage()}
      disabled={!hasNextPage || isFetchingNextPage}
    >
      {isFetchingNextPage ? '読み込み中...' : hasNextPage ? 'もっと見る' : '全件表示済み'}
    </button>
  </div>
)
```

---

## useSuspenseQuery — React Suspense 対応

React の Suspense と連携し、ローディング状態を Suspense boundary で処理します。

### 型シグネチャ

```ts
function useSuspenseQuery<TQueryFnData, TError, TData, TQueryKey>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseSuspenseQueryResult<TData, TError>
```

### useQuery との違い

| 項目 | useQuery | useSuspenseQuery |
|------|---------|-----------------|
| `data` の型 | `TData \| undefined` | `TData`（常に存在） |
| `isLoading` | あり | なし（Suspense が処理） |
| `enabled` オプション | あり | **なし** |
| `placeholderData` | あり | **なし** |
| エラー処理 | `isError` で判定 | Error Boundary にスロー |

### 実践例

```tsx
// コンポーネント側: data は常に存在する（undefined にならない）
function UserProfile({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  // data は TData 型（undefined ではない）
  return <h1>{data.name}</h1>
}

// 親コンポーネント: Suspense と ErrorBoundary でラップ
function App() {
  return (
    <ErrorBoundary fallback={<p>エラー</p>}>
      <Suspense fallback={<p>読み込み中...</p>}>
        <UserProfile userId="123" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

**useSuspenseInfiniteQuery** も同様に存在します。

---

## useQueries — 並列クエリ

複数のクエリを並列に実行し、すべての結果をまとめて受け取ります。

### 型シグネチャ

```ts
function useQueries<T extends Array<any>, TCombinedResult>(options: {
  queries: readonly [...QueriesOptions<T>]
  combine?: (result: QueriesResults<T>) => TCombinedResult
}): TCombinedResult
```

### 実践例

```tsx
// 複数ユーザーのデータを並列取得
const results = useQueries({
  queries: userIds.map(id => ({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getUser(id),
  })),
})

// results: UseQueryResult[] — 各クエリの結果の配列
const isAllLoading = results.some(r => r.isLoading)
const users = results.map(r => r.data).filter(Boolean)
```

### combine で結果を変換

```tsx
const { totalCount, users } = useQueries({
  queries: userIds.map(id => ({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getUser(id),
  })),
  combine: (results) => ({
    totalCount: results.length,
    users: results.map(r => r.data).filter(Boolean),
  }),
})
```

---

## usePrefetchQuery — コンポーネント内プリフェッチ

コンポーネントのレンダリング時にバックグラウンドでデータをプリフェッチします。

```ts
function usePrefetchQuery(options: UsePrefetchQueryOptions): void
```

### 実践例

```tsx
// マウスホバーでプリフェッチ（ではなく）、レンダリング時にプリフェッチ
function UserListItem({ userId }: { userId: string }) {
  // このコンポーネントが表示されたら、ユーザー詳細をプリフェッチ
  usePrefetchQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => userService.getUser(userId),
  })

  return <Link to={`/users/${userId}`}>ユーザー詳細</Link>
}
```

---

## useIsFetching — 取得中クエリの数

```ts
function useIsFetching(filters?: QueryFilters): number
```

### 実践例

```tsx
function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()

  return isFetching > 0 ? <Spinner /> : null
}

// 特定のキーに絞り込み
function UsersLoadingIndicator() {
  const isFetching = useIsFetching({ queryKey: queryKeys.users.all })

  return isFetching > 0 ? <p>ユーザーデータ更新中...</p> : null
}
```

---

## useIsMutating — 実行中ミューテーションの数

```ts
function useIsMutating(filters?: MutationFilters): number
```

### 実践例

```tsx
function SaveIndicator() {
  const isMutating = useIsMutating()

  return isMutating > 0 ? <p>保存中...</p> : null
}
```

---

## useQueryClient — QueryClient へのアクセス

```ts
function useQueryClient(): QueryClient
```

コンポーネント内から QueryClient のメソッドにアクセスするためのフックです。

```tsx
function LogoutButton() {
  const queryClient = useQueryClient()

  const handleLogout = () => {
    queryClient.clear()    // 全キャッシュクリア
    navigate('/login')
  }

  return <button onClick={handleLogout}>ログアウト</button>
}
```

---

## queryOptions / mutationOptions — オプション定義ヘルパー

### queryOptions

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryOptions & { queryKey: DataTag<TQueryKey, TQueryFnData, TError> }
```

型推論を強化し、`useQuery` と `ensureQueryData` で同じオプションを安全に共有するためのヘルパー関数です。

```ts
// 定義（1箇所）
export const userDetailOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getUser(id),
  })

// Hook で使用
useQuery(userDetailOptions('123'))

// Router Loader で使用
context.queryClient.ensureQueryData(userDetailOptions('123'))

// getQueryData で使用（型が自動推論される）
const data = queryClient.getQueryData(userDetailOptions('123').queryKey)
// data の型は User | undefined と推論される（DataTag のおかげ）
```

### mutationOptions

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>
): UseMutationOptions
```

useMutation 用の同等のヘルパーです。

---

## QueryClientProvider

```tsx
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>
```

| Prop | 型 | 説明 |
|------|-----|------|
| `client` | `QueryClient` | 使用する QueryClient インスタンス |
| `children` | `React.ReactNode` | 子コンポーネント |
