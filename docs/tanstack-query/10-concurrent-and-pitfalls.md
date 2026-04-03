# 並行処理・注意点・落とし穴

TanStack Query を使う際に遭遇しやすい問題と、その回避策をまとめます。

---

## 1. 並行リクエストの扱い

### TanStack Query のデデュプリケーション（重複排除）

同じ `queryKey` で複数のコンポーネントが `useQuery` を使った場合、**APIは1回だけ** 呼ばれます。

```tsx
// Component A
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

// Component B（同じページに同時に存在）
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

// → fetchUsers は1回だけ呼ばれ、結果はキャッシュ経由で両方に提供される
```

### useQueries による明示的な並列実行

**異なるキー** のクエリを並列で実行する場合は `useQueries` を使います。

```tsx
const results = useQueries({
  queries: [
    { queryKey: queryKeys.dashboard.stats(), queryFn: fetchDashboardStats },
    { queryKey: queryKeys.users.lists(), queryFn: () => fetchUsers({}) },
  ],
})

const [dashboardResult, usersResult] = results
const isAllLoading = results.some(r => r.isLoading)
```

### Promise.all との違い

```tsx
// useQueries: 1つが失敗しても他は続行。個別に状態を持つ。
const [a, b] = useQueries({ queries: [queryA, queryB] })
// a.isError === true でも b.isSuccess === true は可能

// Promise.all: 1つが失敗すると全体が reject
const [a, b] = await Promise.all([fetchA(), fetchB()])
// 1つでも失敗するとエラーになり、成功した結果も得られない
```

---

## 2. レースコンディション

### 問題: 古いレスポンスが新しいレスポンスを上書きする

```
ユーザーが「田中」と入力 → リクエストA 開始（レスポンスに3秒かかる）
ユーザーが「佐藤」と入力 → リクエストB 開始（レスポンスに1秒で完了）

1秒後: リクエストB完了 → 「佐藤」の結果を表示
3秒後: リクエストA完了 → 「田中」の結果を表示 ← バグ！「佐藤」を検索したのに！
```

### TanStack Query の解決策

TanStack Query はこの問題を **自動的に解決** します。

1. **queryKey が変わると、前のクエリの結果は無視される**
   - `['users', 'list', { query: '田中' }]` と `['users', 'list', { query: '佐藤' }]` は別のキー
   - `佐藤` のキーが active な間に `田中` のレスポンスが来ても、表示は更新されない

2. **AbortSignal による自動キャンセル**
   - queryFn に `signal` を渡していれば、古いリクエストは自動的にキャンセルされる

```ts
useQuery({
  queryKey: queryKeys.users.list(params),
  queryFn: ({ signal }) =>
    fetch(`/api/users?q=${params.query}`, { signal }).then(r => r.json()),
})
```

### 注意: 自前の fetch でレースコンディションを起こさないために

```ts
// NG: signal を使っていない → 古いリクエストが完了してしまう
queryFn: () => fetch('/api/users').then(r => r.json())

// OK: signal を渡す → キー変更時に古いリクエストがキャンセルされる
queryFn: ({ signal }) => fetch('/api/users', { signal }).then(r => r.json())
```

本プロジェクトでは `ApiClient` が `fetch` を内部で呼んでおり、signal の明示的な受け渡しはしていません。TanStack Query のデデュプリケーションとキーの管理により、実質的にレースコンディションは防がれています。

---

## 3. メモリリーク

### 問題: 不要なキャッシュが蓄積する

大量の異なるキーでクエリを発行すると、キャッシュエントリが際限なく増える。

```tsx
// 例: ユーザーが検索を100回行うと、100個のキャッシュエントリが作られる
queryKeys.users.list({ query: '田中' })
queryKeys.users.list({ query: '佐藤' })
queryKeys.users.list({ query: '鈴木' })
// ... 100個
```

### 解決策: gcTime を適切に設定

```ts
// gcTime: 300000 (5分, デフォルト)
// → コンポーネントがアンマウントされてから5分後にキャッシュ削除
// → 100個のエントリも5分後には消える
```

### 問題: Blob データをキャッシュに入れてしまう

```ts
// NG: 10MB の CSV がキャッシュに残り続ける
useQuery({
  queryKey: ['csv-download'],
  queryFn: () => fetch('/api/export/csv').then(r => r.blob()),
})

// OK: TanStack Query を使わない
const blob = await fetch('/api/export/csv').then(r => r.blob())
URL.createObjectURL(blob)
// 使い終わったら URL.revokeObjectURL() で解放
```

---

## 4. 「データが勝手に更新されない」問題

### 症状

ユーザーAがデータを編集したが、ユーザーBの画面に反映されない。

### 原因

TanStack Query は **プルベース** のキャッシュです。サーバー側の変更を自動的に検知する仕組みはありません。

### 対策一覧

| 対策 | 適用場面 | コード |
|------|---------|-------|
| refetchOnWindowFocus | タブ切り替えの多い環境 | `refetchOnWindowFocus: true` (デフォルト) |
| refetchInterval | 変更頻度が高いデータ | `refetchInterval: 10_000` |
| invalidateQueries | 自分自身のアクション後 | `onSuccess: () => invalidateQueries(...)` |
| WebSocket + invalidate | リアルタイム要件 | 後述 |

### WebSocket と組み合わせる場合

```tsx
function useRealtimeInvalidation() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/ws')

    ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data)

      switch (type) {
        case 'USER_CREATED':
        case 'USER_UPDATED':
        case 'USER_DELETED':
          queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
          break
        case 'DASHBOARD_UPDATED':
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
          break
      }
    }

    return () => ws.close()
  }, [queryClient])
}
```

---

## 5. よくあるバグパターン

### バグ1: staleTime を設定したのにデータが更新されない

```ts
// 問題: staleTime: 5分にしたら、5分間新しいデータが取れない
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,
})
```

**解決:** staleTime は「自動再取得のトリガーを抑制する」だけ。手動 `refetch()` や `invalidateQueries` は staleTime に関係なく動作します。

### バグ2: useMutation の onSuccess でデータが古い

```tsx
// 問題: onSuccess 内の data が古い
const { data: users } = useSearchUsers(params)
const { mutate } = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    console.log(users)  // ← この時点の users は更新前のデータ！
    // invalidateQueries した後の新しいデータではない
  },
})
```

**解決:** `invalidateQueries` は非同期。最新データが必要なら `await` する。

```ts
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
  const freshData = queryClient.getQueryData(queryKeys.users.lists())
}
```

### バグ3: queryKey にオブジェクトを渡しているが更新されない

```tsx
// 問題: params オブジェクトの参照は変わるが中身は同じ
const params = { page: 1, query: '' }  // 毎レンダリングで新しいオブジェクト

const { data } = useQuery({
  queryKey: ['users', params],  // ← TanStack Query は深い比較をするのでこれはOK
  queryFn: () => fetchUsers(params),
})
// 実はこれはバグにならない。TanStack Query はオブジェクトを深い比較する。
```

### バグ4: enabled: false のクエリが最初のデータを取得しない

```tsx
const [userId, setUserId] = useState<string | null>(null)

const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId!),
  enabled: !!userId,
})

// userId がセットされた後も data が undefined のまま...
```

**原因:** `enabled` が `false` → `true` に変わったとき、クエリは自動で実行されます。これが動かない場合は `queryKey` に `userId` が含まれていることを確認してください。`userId` が `null` のときのキーと `'123'` のときのキーは別物で、`true` になった時点で新しいキーとして扱われます。

### バグ5: テストで retry が走って遅い

```ts
// 問題: エラーテストが3回リトライされて遅い
const { result } = renderHookWithProviders(() => useSearchUsers(params))
server.use(errorHandler)
// 3回リトライされるため3秒以上かかる

// 解決: テスト用 QueryClient で retry: false
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}
```

---

## 6. パフォーマンス注意点

### 不要な再レンダリングを避ける

```tsx
// 問題: data が変わるたびに全コンポーネントが再レンダリング
function App() {
  const { data, isLoading, error, isFetching, ... } = useSearchUsers(params)
  // data が変わってなくても、isFetching が変わるだけで再レンダリング
}
```

**解決: notifyOnChangeProps**

```tsx
const { data, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  notifyOnChangeProps: ['data', 'error'],  // data と error の変更のみ通知
})
```

### select で派生データを返すときのメモ化

```tsx
// 問題: 毎回新しい配列を返すので、structuralSharing が効いても再レンダリング
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  select: (data) => data.filter(u => u.active),  // ← 毎回新しい配列
})

// 解決: useCallback でメモ化
const selectActive = useCallback(
  (data: User[]) => data.filter(u => u.active),
  [],
)
const { data } = useQuery({ ..., select: selectActive })
```

---

## 7. SSR / Hydration の注意点

本プロジェクトはSPAですが、SSR を導入する場合の注意点です。

### dehydrate / hydrate

```tsx
// サーバー側
const queryClient = new QueryClient()
await queryClient.prefetchQuery({ queryKey: ['users'], queryFn: fetchUsers })
const dehydratedState = dehydrate(queryClient)

// クライアント側
<HydrationBoundary state={dehydratedState}>
  <App />
</HydrationBoundary>
```

### 注意: staleTime を設定しないとHydration直後に再フェッチが走る

```ts
// 問題: サーバーで取得したデータが、クライアントで即座に再フェッチされる
// staleTime: 0 (デフォルト) → SSR データは即stale → マウント時に再フェッチ

// 解決: 適切な staleTime を設定
queries: { staleTime: 30_000 }
```

---

## チェックリスト

プロジェクトに TanStack Query を導入したら確認すべき項目:

- [ ] テスト用 QueryClient は `retry: false`, `gcTime: 0` になっているか
- [ ] queryKey はすべて Query Key Factory 経由か（マジックストリング排除）
- [ ] Mutation 成功時に関連クエリを `invalidateQueries` しているか
- [ ] Blob/ファイルデータは useQuery に入れていないか
- [ ] `staleTime` と `gcTime` の値は妥当か（`staleTime <= gcTime`）
- [ ] select 関数は `useCallback` でメモ化しているか（複雑な変換の場合）
- [ ] queryFn で `signal` を利用する場合、正しく渡しているか
- [ ] エラー型は適切か（ApiError のインスタンスチェックができるか）
- [ ] Hook と Router Loader で `queryOptions` を共有しているか
