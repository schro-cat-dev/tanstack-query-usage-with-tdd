# TanStack Query v5 使い方ガイド（Usage Reference）

本プロジェクトで実際に使われている TanStack Query v5 のパターンを、完全初心者向けに体系的に解説します。
各パターンには「何をするものか」「どう書くか」「テストのしかた」「実際のファイルパス」を含みます。

---

## 目次

1. [QueryClient の設定](#1-queryclient-の設定)
2. [QueryClientProvider の配置](#2-queryclientprovider-の配置)
3. [Query Key Factory パターン](#3-query-key-factory-パターン)
4. [useQuery — データ取得の基本](#4-usequery--データ取得の基本)
5. [queryOptions — Hook と Router Loader の共有](#5-queryoptions--hook-と-router-loader-の共有)
6. [keepPreviousData — 検索時の UX 向上](#6-keeppreviousdata--検索時の-ux-向上)
7. [useMutation — データの作成・更新・削除](#7-usemutation--データの作成更新削除)
8. [invalidateQueries — キャッシュの無効化](#8-invalidatequeries--キャッシュの無効化)
9. [ensureQueryData — Router Loader でのプリフェッチ](#9-ensurequerydata--router-loader-でのプリフェッチ)
10. [useQueryClient — コンポーネント内でキャッシュ操作](#10-usequeryClient--コンポーネント内でキャッシュ操作)
11. [キャッシュに乗せないデータの扱い方](#11-キャッシュに乗せないデータの扱い方)
12. [テストの書き方](#12-テストの書き方)
13. [よくある間違いとトラブルシューティング](#13-よくある間違いとトラブルシューティング)
14. [パターン早見表](#14-パターン早見表)

---

## 1. QueryClient の設定

### これは何？

`QueryClient` は TanStack Query の中心的なオブジェクトで、すべてのキャッシュとデフォルト設定を管理します。
アプリ全体で **1つだけ** 作成し、共有します。

### 実装ファイル

`src/lib/query-client.ts`

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,         // 30秒: データ取得後30秒は「新鮮」として扱う
      gcTime: 5 * 60 * 1000,        // 5分: 使われなくなったキャッシュは5分後に削除
      refetchOnWindowFocus: true,    // タブに戻ったとき自動で再取得
      retry: 1,                      // 失敗時に1回リトライ
    },
  },
})
```

### 各設定の意味

| 設定 | 値 | 効果 |
|------|-----|------|
| `staleTime` | 30秒 | 30秒以内の同じリクエストはAPIを叩かずキャッシュを返す |
| `gcTime` | 5分 | コンポーネントがアンマウントされても5分間キャッシュを保持 |
| `refetchOnWindowFocus` | true | 別タブから戻ったときに最新データを取得 |
| `retry` | 1 | ネットワークエラー時に1回だけ自動リトライ |

### テスト用との違い

テストでは異なる設定を使います（`src/test/helpers/create-query-client.ts`）：

```ts
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,   // テストでリトライすると遅くなる
        gcTime: 0,      // テスト間でキャッシュが残らない
      },
      mutations: {
        retry: false,
      },
    },
  })
}
```

**なぜ分けるの？** テストでリトライが有効だと、エラーテストが遅くなります。gcTime: 0 にすることでテスト間のキャッシュ汚染を防ぎます。

---

## 2. QueryClientProvider の配置

### これは何？

`QueryClientProvider` は React の Context Provider で、配下のすべてのコンポーネントから `useQuery` / `useMutation` を使えるようにします。

### 実装ファイル

`src/routes/__root.tsx`

```tsx
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

// TanStack Router と統合するための Context 型
export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <header>...</header>
      <main>
        <Outlet />   {/* ← 子ルートのコンポーネントがここに描画される */}
      </main>
    </QueryClientProvider>
  )
}
```

### ポイント

- **アプリのルート** に1つだけ配置する
- `RouterContext` に `queryClient` を含めることで、Router の `loader` 関数内でもキャッシュにアクセスできる
- `main.tsx` でルーターに context を渡す：
  ```ts
  const router = createRouter({ routeTree, context: { queryClient } })
  ```

---

## 3. Query Key Factory パターン

### これは何？

TanStack Query はデータを **配列のキー** で識別します。このキーを一元管理するのが Query Key Factory です。

### なぜ必要？

```ts
// NG: マジックストリング — タイポに気づけない
useQuery({ queryKey: ['users', 'list', { page: 1 }] })
// 別の場所で 'user' と書き間違えると、別のキャッシュになってしまう！

// OK: Factory で一元管理
useQuery({ queryKey: queryKeys.users.list({ page: 1 }) })
```

### 実装ファイル

`src/lib/query-keys.ts`

```ts
import type { UserSearchParams } from '@/types/user'

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: UserSearchParams) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
} as const
```

### キーの階層構造

```
users
├── all: ['users']                              ← すべてのユーザー関連キャッシュ
├── lists: ['users', 'list']                    ← すべてのリストキャッシュ
│   └── list({ page: 1 }): ['users', 'list', { page: 1 }]  ← 特定パラメータのリスト
├── details: ['users', 'detail']                ← すべての詳細キャッシュ
│   └── detail('123'): ['users', 'detail', '123']   ← 特定ユーザーの詳細
```

### 活用例

```ts
const queryClient = useQueryClient()

// パターン1: 特定パラメータのリストだけ無効化
queryClient.invalidateQueries({ queryKey: queryKeys.users.list({ page: 1 }) })

// パターン2: すべてのリストを無効化（ページ1も2も3も全部）
queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })

// パターン3: リストも詳細も含む、ユーザー関連キャッシュを全部無効化
queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
```

---

## 4. useQuery — データ取得の基本

### これは何？

API からデータを取得し、**ローディング・成功・エラー** の状態を自動で管理するフックです。

### 基本形

```ts
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, isSuccess, isError, error, refetch } = useQuery({
  queryKey: ['unique-key'],  // このキーでキャッシュされる
  queryFn: () => fetchData(),  // データを取得する関数
})
```

### 実装例

`src/features/dashboard/hooks/use-get-dashboard-stats.ts`

```ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import type { DashboardData } from '@/types/dashboard'

export function useGetDashboardStats() {
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard.stats(),   // ['dashboard', 'stats']
    queryFn: () => dashboardService.getDashboardData(),
  })
}
```

### コンポーネントでの使い方

`src/features/dashboard/components/DashboardPage.tsx`

```tsx
export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboardStats()

  // ステップ1: ローディング中の表示
  if (isLoading) {
    return <div>読み込み中...</div>
  }

  // ステップ2: エラー時の表示（リトライボタン付き）
  if (isError) {
    return (
      <div>
        <p>データの取得に失敗しました</p>
        <button onClick={() => refetch()}>リトライ</button>
      </div>
    )
  }

  // ステップ3: 成功時のデータ表示
  return (
    <div>
      <h1>ダッシュボード</h1>
      <p>総ユーザー数: {data.stats.totalUsers}</p>
    </div>
  )
}
```

### useQuery が返すプロパティ

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `data` | `T \| undefined` | 取得したデータ（ローディング中は undefined） |
| `isLoading` | `boolean` | 初回のデータ取得中かどうか |
| `isSuccess` | `boolean` | データ取得が成功したか |
| `isError` | `boolean` | エラーが発生したか |
| `error` | `Error \| null` | エラーオブジェクト |
| `refetch` | `() => Promise` | 手動でデータを再取得する関数 |
| `isFetching` | `boolean` | バックグラウンドで再取得中（初回ではない） |

---

## 5. queryOptions — Hook と Router Loader の共有

### これは何？

`queryOptions` は、`useQuery` に渡すオプションを **関数として切り出す** ユーティリティです。
Hook と Router Loader の両方で同じオプション（特に queryKey と queryFn）を共有でき、DRY（繰り返しを避ける）になります。

### なぜ必要？

```ts
// NG: Hook と Router Loader で同じ queryKey/queryFn を2回書く
// hooks/use-search-users.ts
useQuery({ queryKey: ['users', 'list', params], queryFn: () => fetchUsers(params) })

// routes/users/index.tsx
context.queryClient.ensureQueryData({
  queryKey: ['users', 'list', params],  // ← 同じものを2回書いている！
  queryFn: () => fetchUsers(params),
})

// OK: queryOptions で共有
const options = searchUsersQueryOptions(params)
useQuery(options)                            // Hook
context.queryClient.ensureQueryData(options)  // Router Loader
```

### 実装例

`src/features/users/hooks/use-search-users.ts`

```ts
import { useQuery, queryOptions, keepPreviousData } from '@tanstack/react-query'

// 1. queryOptions を関数として定義（exportして共有）
export function searchUsersQueryOptions(params: UserSearchParams) {
  return queryOptions<PaginatedResponse<User>>({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.searchUsers(params),
    placeholderData: keepPreviousData,
  })
}

// 2. Hook 内で使う
export function useSearchUsers(params: UserSearchParams) {
  return useQuery(searchUsersQueryOptions(params))
}
```

`src/routes/users/index.tsx`（Router Loader で同じ options を使う）

```ts
export const Route = createFileRoute('/users/')({
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(searchUsersQueryOptions(deps)),
})
```

### ポイント

- `queryOptions` は型推論を強化する（ジェネリクスが自動で伝播する）
- Hook と Loader で **キーの不整合** が起きなくなる
- パラメータを引数にした関数にすることで、動的なキーにも対応

---

## 6. keepPreviousData — 検索時の UX 向上

### これは何？

検索パラメータが変わったとき、新しいデータを取得する間 **前のデータを表示し続ける** 機能です。

### なぜ必要？

```
通常の動作:
  「田中」で検索 → データ表示
  「佐藤」に変更 → 画面が空白（ローディング中...）→ データ表示

keepPreviousData 有効時:
  「田中」で検索 → データ表示
  「佐藤」に変更 → 「田中」の結果を表示したまま裏で取得 → 完了したら「佐藤」の結果に切り替え
```

### 実装例

```ts
import { queryOptions, keepPreviousData } from '@tanstack/react-query'

export function searchUsersQueryOptions(params: UserSearchParams) {
  return queryOptions<PaginatedResponse<User>>({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.searchUsers(params),
    placeholderData: keepPreviousData,   // ← これを追加するだけ
  })
}
```

### コンポーネント側での判定

```tsx
const { data, isFetching, isPlaceholderData } = useSearchUsers(params)

return (
  <div style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
    {/* isPlaceholderData が true のとき、前のデータを表示中 */}
    <UserTable users={data.data} />
    {isFetching && <span>更新中...</span>}
  </div>
)
```

---

## 7. useMutation — データの作成・更新・削除

### これは何？

データを **変更（作成・更新・削除）** するためのフックです。
`useQuery`（読み取り）の対になるもので、副作用（POST/PUT/DELETE）を管理します。

### 基本形

```ts
const { mutate, mutateAsync, isPending, isSuccess, isError, error, data, isIdle, reset } =
  useMutation({
    mutationFn: (variables) => apiCall(variables),
    onSuccess: (data, variables) => { /* 成功時の処理 */ },
    onError: (error, variables) => { /* エラー時の処理 */ },
  })
```

### 実装例

`src/features/users/hooks/use-create-user.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<CreateUserResponse, Error, CreateUserRequest>({
    //                 ↑ レスポンス型     ↑ エラー型 ↑ リクエスト型
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      // 成功したら一覧キャッシュを無効化（自動で再取得される）
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
    // ※ onError は未定義 → エラー時はキャッシュに影響しない
  })
}
```

### コンポーネントでの使い方

`src/features/users/components/CreateUserForm.tsx`

```tsx
export function CreateUserForm({ onSuccess }: Props) {
  const { mutate, isPending, isSuccess, isError, error, reset } = useCreateUser()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    mutate(
      { name, email, role },        // ← mutationFn に渡される
      {
        onSuccess: () => {
          setName('')')               // フォームリセット
          reset()                    // mutation の状態をリセット
          onSuccess?.()              // 親コンポーネントに通知
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {isSuccess && <div>ユーザーを作成しました</div>}
      {isError && <div>{(error as ApiError).data?.message}</div>}
      <button disabled={isPending}>
        {isPending ? '作成中...' : '作成'}
      </button>
    </form>
  )
}
```

### useMutation が返すプロパティ

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `mutate` | `(variables) => void` | 非同期で mutation を実行 |
| `mutateAsync` | `(variables) => Promise` | Promise を返す版（await できる） |
| `isPending` | `boolean` | 実行中かどうか |
| `isIdle` | `boolean` | まだ実行されていない状態 |
| `isSuccess` | `boolean` | 成功したか |
| `isError` | `boolean` | エラーが発生したか |
| `error` | `Error \| null` | エラーオブジェクト |
| `data` | `T \| undefined` | レスポンスデータ |
| `reset` | `() => void` | 状態をリセットしてidleに戻す |

### mutate と mutateAsync の使い分け

```ts
// mutate: コールバックで後処理（フォーム送信に最適）
mutate(data, {
  onSuccess: () => { /* 成功時 */ },
  onError: (error) => { /* エラー時 */ },
})

// mutateAsync: await で制御（直列実行が必要な場合）
try {
  const result = await mutateAsync(data)
  console.log(result)
} catch (error) {
  console.error(error)
}
```

---

## 8. invalidateQueries — キャッシュの無効化

### これは何？

キャッシュに保存されたデータを「古い」とマークし、次にそのデータが必要になったとき（またはその場で）自動的に再取得させます。

### いつ使う？

- ユーザーを **作成・更新・削除** した後、一覧データを最新にしたいとき
- あるアクションの結果、別のデータが変わる可能性があるとき

### 実装例

```ts
// useMutation の onSuccess 内で使う
const queryClient = useQueryClient()

return useMutation({
  mutationFn: (data) => userService.createUser(data),
  onSuccess: () => {
    // ↓ 「users」「list」で始まるすべてのキャッシュを無効化
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
  },
})
```

### 無効化の粒度

Query Key Factory の **階層構造** を活用して、無効化の範囲を細かく制御できます。

```ts
// 細かい: page=1 のリストだけ無効化
queryClient.invalidateQueries({
  queryKey: queryKeys.users.list({ page: 1, perPage: 10 }),
})

// 中間: すべてのリストを無効化（page=1 も page=2 も全部）
queryClient.invalidateQueries({
  queryKey: queryKeys.users.lists(),
})

// 広い: ユーザー関連のキャッシュをすべて無効化（リストも詳細も）
queryClient.invalidateQueries({
  queryKey: queryKeys.users.all,
})
```

### ポイント

- `invalidateQueries` は **前方一致** でキーをマッチする
- `['users', 'list']` を指定すると `['users', 'list', { page: 1 }]` も `['users', 'list', { page: 2 }]` も無効化される
- 無効化されたデータが画面に表示中なら、自動で再取得が走る
- 画面に表示されていなければ、次に表示されるときに再取得される

---

## 9. ensureQueryData — Router Loader でのプリフェッチ

### これは何？

ページ遷移 **前に** データをキャッシュに入れておく機能です。
ユーザーがリンクをクリックした瞬間にデータが表示される「ゼロ・レイテンシ」を実現します。

### 仕組み

```
1. ユーザーが /users をクリック
2. Router が loader 関数を実行
3. loader 内の ensureQueryData がキャッシュを確認
   - キャッシュが新鮮 → そのまま返す（APIは叩かない）
   - キャッシュがない/古い → APIを叩いてキャッシュに入れる
4. ページが表示される（useQuery はキャッシュからデータを取得）
```

### 実装例

#### 単純なプリフェッチ（ダッシュボード）

`src/routes/index.tsx`

```ts
export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getDashboardQueryOptions()),
  component: DashboardPage,
})
```

#### パラメータ付きプリフェッチ（ユーザー一覧）

`src/routes/users/index.tsx`

```ts
export const Route = createFileRoute('/users/')({
  // URL パラメータを型安全にバリデーション
  validateSearch: (search): UserSearchParams => ({
    query: (search.query as string) || undefined,
    role: (search.role as UserRole) || undefined,
    page: Number(search.page) || 1,
    perPage: Number(search.perPage) || 10,
  }),
  // search パラメータが変わったら loader を再実行
  loaderDeps: ({ search }) => search,
  // バリデーション済みパラメータで ensureQueryData
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(searchUsersQueryOptions(deps)),
  component: UsersRouteComponent,
})
```

### ensureQueryData vs prefetchQuery

| メソッド | 戻り値 | エラー時 | 用途 |
|---------|--------|---------|------|
| `ensureQueryData` | `Promise<TData>` | throw する | Loader（エラーをハンドリングしたい） |
| `prefetchQuery` | `Promise<void>` | 握りつぶす | 先読み（失敗しても画面は出す） |

---

## 10. useQueryClient — コンポーネント内でキャッシュ操作

### これは何？

コンポーネント内から `QueryClient` のインスタンスにアクセスするフックです。
キャッシュの読み取り・書き込み・無効化などに使います。

### 使い方

```ts
import { useQueryClient } from '@tanstack/react-query'

function MyComponent() {
  const queryClient = useQueryClient()

  // キャッシュを無効化
  queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })

  // キャッシュからデータを直接読み取り
  const cachedData = queryClient.getQueryData(queryKeys.users.list({ page: 1 }))

  // キャッシュにデータを直接書き込み（楽観的更新など）
  queryClient.setQueryData(queryKeys.users.detail('123'), updatedUser)
}
```

### 主なメソッド

| メソッド | 用途 |
|---------|------|
| `invalidateQueries({ queryKey })` | キャッシュを無効化（再取得を促す） |
| `getQueryData(queryKey)` | キャッシュからデータを取得（APIは叩かない） |
| `setQueryData(queryKey, data)` | キャッシュにデータを書き込み |
| `ensureQueryData(options)` | キャッシュがなければ取得、あれば返す |
| `cancelQueries({ queryKey })` | 進行中のクエリをキャンセル |

---

## 11. キャッシュに乗せないデータの扱い方

### いつキャッシュに乗せない？

- **Blob データ**（CSV、画像、PDF） → メモリを大量に消費する
- **一度きりの操作**（ファイルダウンロード） → 再利用しない
- **巨大なデータ** → キャッシュに入れるとメモリ不足の原因に

### 実装例（CSV ダウンロード）

`src/features/users/hooks/use-download-users-csv.ts`

```ts
import { useState, useCallback } from 'react'  // ← TanStack Query は使わない！

export function useDownloadUsersCsv() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const download = useCallback(async (params?) => {
    setIsDownloading(true)
    setError(null)

    try {
      const blob = await userService.downloadUsersCsv(params)

      // ブラウザにダウンロードさせる
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'users.csv'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)  // メモリ解放
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return { download, isDownloading, error }
}
```

### テストでキャッシュに乗っていないことを確認

```ts
it('TanStack Query キャッシュを使用しない', async () => {
  const { result, queryClient } = renderHookWithProviders(() => useDownloadUsersCsv())

  await act(async () => { await result.current.download() })

  // QueryClient にCSV関連のキャッシュが存在しないことを確認
  const allQueries = queryClient.getQueryCache().getAll()
  const csvQueries = allQueries.filter(q =>
    q.queryKey.some(k => typeof k === 'string' && k.includes('csv'))
  )
  expect(csvQueries).toHaveLength(0)
})
```

---

## 12. テストの書き方

### テスト用ヘルパー

すべてのテストで共通のヘルパーを使います（`src/test/helpers/render.tsx`）。

```ts
import { renderHookWithProviders } from '@/test/helpers/render'
import { renderWithProviders } from '@/test/helpers/render'
```

### パターンA: useQuery のテスト

```ts
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '@/test/helpers/render'
import { server } from '@/mocks/server'
import { dashboardErrorHandlers } from '@/mocks/handlers/dashboard.handlers'
import { useGetDashboardStats } from './use-get-dashboard-stats'

describe('useGetDashboardStats', () => {
  // 1. ローディング状態のテスト
  it('初期状態はローディング中である', () => {
    const { result } = renderHookWithProviders(() => useGetDashboardStats())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  // 2. 成功時のテスト
  it('データを正常に取得できる', async () => {
    const { result } = renderHookWithProviders(() => useGetDashboardStats())

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.stats.totalUsers).toBe(10)
  })

  // 3. エラー時のテスト（MSWハンドラを上書き）
  it('APIエラー時にエラー状態になる', async () => {
    server.use(dashboardErrorHandlers.serverError)

    const { result } = renderHookWithProviders(() => useGetDashboardStats())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
```

### パターンB: useMutation のテスト

```ts
import { waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'

describe('useCreateUser', () => {
  // 1. idle 状態のテスト
  it('初期状態はidleである', () => {
    const { result } = renderHookWithProviders(() => useCreateUser())
    expect(result.current.isIdle).toBe(true)
  })

  // 2. 成功時のテスト
  it('ユーザー作成が成功する', async () => {
    const { result } = renderHookWithProviders(() => useCreateUser())

    act(() => {
      result.current.mutate({ name: 'テスト', email: 'test@example.com', role: 'viewer' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.user.name).toBe('テスト')
  })

  // 3. キャッシュ無効化のテスト（スパイを使う）
  it('成功時にキャッシュが無効化される', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useCreateUser())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    act(() => {
      result.current.mutate({ name: 'テスト', email: 'test@example.com', role: 'viewer' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.users.lists() })
    )
  })
})
```

### パターンC: コンポーネントの結合テスト

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/helpers/render'
import { server } from '@/mocks/server'

describe('DashboardPage', () => {
  it('ローディング → データ表示の遷移', async () => {
    renderWithProviders(<DashboardPage />)

    // ローディング中
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()

    // データ表示
    expect(await screen.findByText('10')).toBeInTheDocument()
  })

  it('エラー時にリトライできる', async () => {
    server.use(dashboardErrorHandlers.serverError)
    const user = userEvent.setup()

    renderWithProviders(<DashboardPage />)

    const retryButton = await screen.findByRole('button', { name: 'リトライ' })
    server.resetHandlers()   // リトライ時は正常系に戻す
    await user.click(retryButton)

    expect(await screen.findByText('10')).toBeInTheDocument()
  })
})
```

---

## 13. よくある間違いとトラブルシューティング

### 1. テストでデータが取得できない

**原因:** テスト用 `QueryClient` の `retry` が有効のままだと、エラーテストが遅延する。

```ts
// NG: retry がデフォルトのまま（テストが遅くなる）
const queryClient = new QueryClient()

// OK: retry を無効化
const queryClient = createTestQueryClient()
```

### 2. テスト間でキャッシュが干渉する

**原因:** 同じ `QueryClient` を複数テストで共有している。

```ts
// NG: 同じ QueryClient を共有
const queryClient = new QueryClient()

// OK: テストごとに新しい QueryClient を作成
// renderHookWithProviders / renderWithProviders は毎回新しいのを作る
```

### 3. mutate の直後に状態をチェックして失敗

**原因:** `mutate` は非同期。直後の状態は更新されていない場合がある。

```ts
// NG
result.current.mutate(data)
expect(result.current.isPending).toBe(true)  // まだ false かもしれない

// OK
act(() => { result.current.mutate(data) })
await waitFor(() => { expect(result.current.isPending).toBe(true) })
```

### 4. invalidateQueries が効かない

**原因:** Query Key が一致していない。

```ts
// NG: キーの階層が合っていない
queryClient.invalidateQueries({ queryKey: ['users'] })  // あいまい

// OK: Query Key Factory を使う
queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
```

### 5. useQuery のデータが undefined のまま

**原因:** `QueryClientProvider` がない。

```tsx
// NG: Provider なし
render(<DashboardPage />)

// OK: renderWithProviders を使う
renderWithProviders(<DashboardPage />)
```

---

## 14. パターン早見表

| やりたいこと | 使うもの | 実装ファイル |
|-------------|---------|-------------|
| データを取得したい | `useQuery` | `hooks/use-get-dashboard-stats.ts` |
| 検索パラメータ付きで取得 | `useQuery` + `queryOptions` + `keepPreviousData` | `hooks/use-search-users.ts` |
| データを作成/更新/削除したい | `useMutation` | `hooks/use-create-user.ts` |
| 成功後にキャッシュを更新 | `invalidateQueries` in `onSuccess` | `hooks/use-create-user.ts` |
| ページ遷移前にデータ取得 | `ensureQueryData` in Router `loader` | `routes/index.tsx`, `routes/users/index.tsx` |
| Hook と Loader でオプション共有 | `queryOptions` 関数 | `hooks/use-search-users.ts` |
| キャッシュキーの一元管理 | Query Key Factory | `lib/query-keys.ts` |
| キャッシュに乗せないデータ | `useState` + `useCallback`（Query不使用） | `hooks/use-download-users-csv.ts` |
| テストでフック検証 | `renderHookWithProviders` | `test/helpers/render.tsx` |
| テストでコンポーネント検証 | `renderWithProviders` | `test/helpers/render.tsx` |
| エラーケースのテスト | `server.use(errorHandler)` | 各 `.test.ts` ファイル |
