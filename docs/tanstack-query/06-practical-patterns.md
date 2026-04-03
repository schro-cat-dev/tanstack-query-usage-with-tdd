# 実践パターン集

TanStack Query v5 を実際のプロジェクトで使うための具体的なパターンとベストプラクティスを集めました。

---

## パターン1: Query Key Factory

### 問題

Query Key を文字列でハードコーディングすると、タイポや不整合が起きる。

### 解決策

```ts
// src/lib/query-keys.ts
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: UserSearchParams) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
} as const
```

### なぜ階層にするのか

```ts
// invalidateQueries は「前方一致」で動作する
// → queryKeys.users.lists() で無効化すると、すべての list キーが対象になる

queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
// ↓ これらがすべて無効化される
// ['users', 'list']
// ['users', 'list', { page: 1 }]
// ['users', 'list', { page: 2, query: '田中' }]

// ↓ これは無効化されない（'detail' なので）
// ['users', 'detail', '123']
```

---

## パターン2: queryOptions で Hook と Loader を共有

### 問題

Hook と Router Loader で同じ queryKey と queryFn を書くと DRY 違反。キーの不整合バグが起きる。

### 解決策

```ts
// 1. queryOptions 関数を export
export function searchUsersQueryOptions(params: UserSearchParams) {
  return queryOptions<PaginatedResponse<User>>({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.searchUsers(params),
    placeholderData: keepPreviousData,
  })
}

// 2. Hook で使う
export function useSearchUsers(params: UserSearchParams) {
  return useQuery(searchUsersQueryOptions(params))
}

// 3. Router Loader で使う
export const Route = createFileRoute('/users/')({
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(searchUsersQueryOptions(deps)),
})
```

---

## パターン3: Service クラス + DI（依存性注入）

### 問題

API呼び出しロジックがHookに直書きされていると、テストやAPIクライアントの差し替えが困難。

### 解決策

```ts
// 1. インターフェース定義
interface IUserService {
  searchUsers(params: UserSearchParams): Promise<PaginatedResponse<User>>
  createUser(data: CreateUserRequest): Promise<CreateUserResponse>
}

// 2. 実装クラス
class UserService implements IUserService {
  #apiClient: IApiClient

  constructor(apiClient: IApiClient) {
    this.#apiClient = apiClient
  }

  async searchUsers(params: UserSearchParams) {
    return this.#apiClient.get<PaginatedResponse<User>>('/api/users', toQueryParams(params))
  }
}

// 3. Hook から使用
const userService = new UserService(new ApiClient(window.location.origin))

export function useSearchUsers(params: UserSearchParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.searchUsers(params),
  })
}
```

**メリット:**
- テスト時に `IApiClient` のモック実装を注入できる
- API クライアントの変更（fetch→axios等）がService内で閉じる
- Hook は「何のデータを取るか」、Service は「どう取るか」に専念

---

## パターン4: Mutation 後のキャッシュ無効化

### 問題

データを作成/更新した後、一覧の表示が古いままになる。

### 解決策

```ts
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => userService.createUser(data),
    onSuccess: () => {
      // users.lists() で始まるキャッシュをすべて無効化
      // → 表示中の一覧が自動で再取得される
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}
```

### 無効化の粒度を選ぶ判断基準

| 状況 | 無効化範囲 | コード |
|------|-----------|-------|
| ユーザーの名前を更新した | そのユーザーの詳細 + 一覧 | `queryKeys.users.all` |
| ユーザーを新規作成した | 一覧だけ（詳細はまだない） | `queryKeys.users.lists()` |
| ユーザーの権限を変更した | すべてのユーザー関連 | `queryKeys.users.all` |
| ダッシュボードの設定変更 | ダッシュボードだけ | `queryKeys.dashboard.all` |

---

## パターン5: enabled による条件付きクエリ

### 問題

パラメータがまだない状態（ユーザーが選択していないなど）でクエリを実行したくない。

### 解決策

```ts
function UserDetail({ userId }: { userId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.detail(userId!),
    queryFn: () => userService.getUser(userId!),
    enabled: !!userId,   // userId が null/undefined のとき実行しない
  })

  if (!userId) return <p>ユーザーを選択してください</p>
  if (isLoading) return <p>読み込み中...</p>
  return <p>{data?.name}</p>
}
```

### skipToken を使う方法（v5 推奨）

```ts
import { useQuery, skipToken } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: queryKeys.users.detail(userId ?? ''),
  queryFn: userId ? () => userService.getUser(userId) : skipToken,
})
```

`enabled` より **型安全** です（queryFn の引数で null チェックが不要）。

---

## パターン6: select によるデータ変換

### 問題

API レスポンスの一部だけをコンポーネントで使いたい。全体を渡すと不要な再レンダリングが起きる。

### 解決策

```ts
// API は PaginatedResponse<User> を返すが、コンポーネントは User[] だけ必要
function useUserNames(params: UserSearchParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.searchUsers(params),
    select: (response) => response.data.map(u => u.name),
    //              ↑ PaginatedResponse<User> → string[]
  })
}
```

**select は参照安定性が重要:**

```ts
// NG: 毎回新しい関数が作られ、structuralSharing が効かない場合がある
select: (data) => data.users.filter(u => u.active)

// OK: useCallback でメモ化
const selectActive = useCallback(
  (data: PaginatedResponse<User>) => data.data.filter(u => u.role === 'admin'),
  [],
)
useQuery({ ..., select: selectActive })
```

---

## パターン7: refetchInterval でポーリング

### 問題

リアルタイム性が求められるデータ（ダッシュボード、ステータスなど）を定期更新したい。

### 解決策

```ts
function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: 30_000,                // 30秒ごとにポーリング
    refetchIntervalInBackground: false,     // バックグラウンドタブではポーリングしない
  })
}
```

### 条件付きポーリング

```ts
useQuery({
  queryKey: ['job', jobId],
  queryFn: () => fetchJobStatus(jobId),
  refetchInterval: (query) => {
    // ジョブが完了したらポーリング停止
    if (query.state.data?.status === 'completed') return false
    return 5_000  // 5秒ごと
  },
})
```

---

## パターン8: キャッシュに乗せないデータ

### 問題

Blob（CSV, PDF, 画像）はキャッシュに入れるとメモリを浪費する。

### 解決策: useState + useCallback

```ts
// TanStack Query を使わない
export function useDownloadUsersCsv() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const download = useCallback(async (params?) => {
    setIsDownloading(true)
    setError(null)
    try {
      const blob = await userService.downloadUsersCsv(params)
      triggerBrowserDownload(blob, 'users.csv')
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return { download, isDownloading, error }
}
```

### 判断基準

| データの性質 | 使うもの |
|------------|---------|
| 何度も参照する（一覧、詳細） | `useQuery` |
| 1回限りの副作用（作成、更新） | `useMutation` |
| Blob/ファイル/巨大データ | `useState` + `useCallback` |

---

## パターン9: エラーハンドリング戦略

### レイヤーごとの戦略

```
API Client    → ApiError をスロー（status, data を保持）
Service       → そのまま再スロー（加工しない）
Hook (Query)  → error に ApiError が入る
Component     → isError で判定、error.status で分岐
```

### コンポーネントでのエラー表示

```tsx
function ErrorDisplay({ error }: { error: Error }) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400: return <p>入力に誤りがあります: {(error.data as any)?.message}</p>
      case 403: return <p>権限がありません</p>
      case 404: return <p>データが見つかりません</p>
      default: return <p>サーバーエラーが発生しました</p>
    }
  }
  return <p>予期しないエラーが発生しました</p>
}
```

---

## パターン10: テスト用 QueryClient の分離

### 問題

本番用の QueryClient をテストで使うと、retry でテストが遅くなり、gcTime でキャッシュが残る。

### 解決策

```ts
// テスト専用の QueryClient 生成関数
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

// テストヘルパー: 毎テストで新しい QueryClient を作成
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
) {
  const queryClient = createTestQueryClient()

  return {
    ...renderHook(hook, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    }),
    queryClient,  // テスト内でキャッシュ操作できるよう返す
  }
}
```
