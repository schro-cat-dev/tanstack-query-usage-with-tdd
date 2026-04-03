# src/routes/ - TanStack Router ルーティング定義

## このディレクトリは何？

TanStack Router の **ファイルベースルーティング** の定義ファイルが置かれています。
ファイルの位置とファイル名がそのまま URL パスになります。

## ルート一覧

| ファイル | URL | 説明 |
|---------|-----|------|
| `__root.tsx` | - | ルートレイアウト（ナビゲーション、Provider） |
| `index.tsx` | `/` | ダッシュボード |
| `users/index.tsx` | `/users` | ユーザー一覧（検索パラメータ対応） |
| `users/create.tsx` | `/users/create` | ユーザー作成フォーム |

## ファイルベースルーティングの仕組み

```
src/routes/
├── __root.tsx          → すべてのルートの親（レイアウト）
├── index.tsx           → /
└── users/
    ├── index.tsx       → /users
    └── create.tsx      → /users/create
```

TanStack Router の Vite プラグインがこれらのファイルを検出し、
`src/routeTree.gen.ts` を自動生成します。

## 各ルートファイルの構造

### 基本形

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/')({
  component: UsersPage,          // 表示するコンポーネント
  loader: ({ context }) => ...,  // データのプリフェッチ（任意）
  validateSearch: (search) => ..., // URLパラメータのバリデーション（任意）
})
```

### __root.tsx の役割

すべてのルートの親。以下を提供します：

1. **QueryClientProvider** - TanStack Query のキャッシュをアプリ全体で共有
2. **ナビゲーション** - ヘッダーにリンクを配置
3. **Outlet** - 子ルートのコンポーネントがここに描画される

```tsx
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <header><nav>...</nav></header>
      <main><Outlet /></main>  {/* ← 子ルートがここに入る */}
    </QueryClientProvider>
  )
}
```

### Router Context

`__root.tsx` で `RouterContext` を定義し、`queryClient` を注入しています。
これにより、すべてのルートの `loader` 関数で `context.queryClient` が使えます。

```tsx
interface RouterContext {
  queryClient: QueryClient
}
```

## Loader によるプリフェッチ

ルートの `loader` 関数で `ensureQueryData` を使い、
ページ遷移前にデータをキャッシュに入れておきます。

```tsx
export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getDashboardQueryOptions()),
  component: DashboardPage,
})
```

**メリット:** ユーザーがリンクをクリックした瞬間にデータが表示される（ゼロ・レイテンシ）

## Search Params（URLパラメータ）の型安全な扱い

`/users` ルートでは `validateSearch` で URL パラメータを型安全にバリデーションしています。

```tsx
export const Route = createFileRoute('/users/')({
  validateSearch: (search): UserSearchParams => ({
    query: (search.query as string) || undefined,
    role: (search.role as UserRole) || undefined,
    page: Number(search.page) || 1,
    perPage: Number(search.perPage) || 10,
  }),
  // search パラメータが変わったら loader を再実行
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(searchUsersQueryOptions(deps)),
})
```

**使い方（コンポーネント側）:**
```tsx
function UsersRouteComponent() {
  const search = Route.useSearch()  // 型安全！ UserSearchParams 型
  const navigate = Route.useNavigate()

  // URL パラメータを更新（ブラウザの履歴も更新される）
  navigate({ search: { ...search, page: 2 } })
}
```

## routeTree.gen.ts について

- **自動生成ファイル** - 手動で編集しない
- Vite 開発サーバー起動時に自動生成・更新される
- `.gitignore` に追加してもOK（ビルド時に再生成される）
- ルートファイルを追加・削除したら、`npm run dev` で再生成

## よくある間違い

### 1. ルートファイルのパスと createFileRoute のパスが一致しない

```tsx
// NG: ファイルが users/index.tsx なのにパスが違う
export const Route = createFileRoute('/user')({ ... })

// OK: ファイルパスと一致させる
export const Route = createFileRoute('/users/')({ ... })
```

### 2. loader で直接 fetch する

```tsx
// NG: loader で直接 fetch する（キャッシュが効かない）
loader: async () => {
  const res = await fetch('/api/dashboard')
  return res.json()
},

// OK: ensureQueryData でキャッシュを経由する
loader: ({ context }) =>
  context.queryClient.ensureQueryData(getDashboardQueryOptions()),
```

### 3. routeTree.gen.ts を手動編集する

→ 次回 Vite 起動時に上書きされるので意味がありません。
ルートファイルを正しい場所に配置すれば自動で反映されます。
