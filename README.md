# TanStack Query Usage with TDD

TanStack Query v5 の実践的な使い方を、TDD（テスト駆動開発）で構築したユーザー管理SPAです。
**141テスト**で各機能の正常系・異常系・エッジケースを網羅しています。

## デモ起動

```bash
npm install
npm run dev
# → http://localhost:5173/
```

| URL | 画面 | 使っている TanStack Query 機能 |
|-----|------|------|
| `/` | ダッシュボード（統計カード + グラフ） | `useQueries` 並行取得, 独立キャッシュ |
| `/users` | ユーザー一覧（検索・ソート・ページネーション） | `queryOptions` + `keepPreviousData`, Router loader プリフェッチ |
| `/users/create` | ユーザー作成フォーム | `useMutation` + `invalidateQueries` |

---

## TanStack Query をどう使っているか

### 並行取得と独立キャッシュ（ダッシュボード）

```
GET /api/dashboard/stats    ─┐ useQueries で同時に取得
GET /api/dashboard/activity  ─┘ 各キャッシュが独立（stats=60秒, activity=30秒）
```

一方のAPIが遅くても他方は先に表示。統計だけ長くキャッシュし、アクティビティは頻繁に更新。

### queryOptions でHookとRouter Loaderを共有（ユーザー一覧）

```ts
// 1箇所で定義
export function searchUsersQueryOptions(params) {
  return queryOptions({ queryKey: queryKeys.users.list(params), queryFn: ... })
}

// Hook で使う
useQuery(searchUsersQueryOptions(params))

// Router loader で使う（ページ遷移前にプリフェッチ）
context.queryClient.ensureQueryData(searchUsersQueryOptions(deps))
```

キーの不整合が起きない。`keepPreviousData` で検索中も前の結果を表示し続ける。

### Mutation後のキャッシュ自動更新（ユーザー作成）

```ts
useMutation({
  mutationFn: (data) => userService.createUser(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    // → すべてのユーザー一覧キャッシュが自動で再取得される
  },
})
```

### キャッシュに乗せない設計判断（CSVダウンロード）

BlobはTanStack Queryを使わず `useState` + `useCallback` で管理。メモリ節約。

---

## プロジェクト構成

```
src/
├── types/                  ドメイン型定義（User, DashboardStats, ApiError）
├── lib/
│   ├── api/                汎用HTTPクライアント（IApiClient / ApiClient）
│   ├── query-keys.ts       Query Key Factory
│   └── query-client.ts     QueryClient 設定
├── mocks/                  MSW モックハンドラ + フィクスチャデータ
├── features/
│   ├── dashboard/          ダッシュボード機能
│   │   ├── services/       DashboardService（API通信）
│   │   ├── hooks/          useGetDashboardStats（useQueries並行取得）
│   │   └── components/     DashboardPage, StatCard, RoleChart, WeeklyChart
│   └── users/              ユーザー管理機能
│       ├── services/       UserService（検索・作成・CSV）
│       ├── hooks/          useSearchUsers, useCreateUser, useDownloadUsersCsv
│       └── components/     UsersPage, UserSearchForm, UserTable, CreateUserForm
├── routes/                 TanStack Router ファイルベースルーティング
├── examples/               TanStack Query 機能サンプル集（10種）
└── test/                   テストヘルパー（renderWithProviders等）
```

---

## 技術スタック

| カテゴリ | ライブラリ | バージョン |
|---------|-----------|-----------|
| Build | Vite | 8.0 |
| UI | React | 19.2 |
| Routing | TanStack Router | 1.168 |
| Data Fetching | TanStack Query | 5.96 |
| Charts | Recharts | 3.8 |
| Testing | Vitest + RTL + MSW | 4.1 / 16.3 / 2.12 |
| Language | TypeScript (strict) | 5.9 |

---

## テスト

```bash
npm run test:run     # 全141テスト実行
npm run test         # ウォッチモード
npm run test:coverage  # カバレッジ付き
```

| カテゴリ | テスト数 |
|---------|---------|
| APIクライアント | 7 |
| ダッシュボード（Service + Hook + Component） | 17 |
| ユーザー管理（Service + Hook + Component） | 66 |
| 結合テスト + スモークテスト | 13 |
| 機能サンプル（examples/） | 38 |
| **合計** | **141** |

---

## ドキュメント一覧

### アーキテクチャ・使い方ガイド（各ディレクトリ内 README）

| ファイル | 内容 |
|---------|------|
| [src/types/README.md](src/types/README.md) | 型定義の使い方（ApiError, PaginatedResponse, User） |
| [src/lib/README.md](src/lib/README.md) | 共通ライブラリ（QueryClient設定, Query Key Factory） |
| [src/lib/api/README.md](src/lib/api/README.md) | 汎用HTTPクライアント（IApiClient, ApiClient, エラーハンドリング） |
| [src/mocks/README.md](src/mocks/README.md) | MSWモック（ハンドラの書き方, server.use による上書き） |
| [src/test/README.md](src/test/README.md) | テストヘルパー（renderWithProviders, createTestQueryClient） |
| [src/routes/README.md](src/routes/README.md) | ルーティング（validateSearch, loader, ensureQueryData） |
| [src/features/dashboard/README.md](src/features/dashboard/README.md) | ダッシュボード機能（データフロー, API仕様） |
| [src/features/users/README.md](src/features/users/README.md) | ユーザー機能（検索・作成・CSV, キャッシュ制御設計） |

### TanStack Query 使い方リファレンス

| ファイル | 内容 |
|---------|------|
| [src/lib/TANSTACK_QUERY_USAGE.md](src/lib/TANSTACK_QUERY_USAGE.md) | 本プロジェクトでの具体的な使い方一覧（パターン早見表付き） |

### TanStack Query v5 完全ガイド（型解析 + 実践 + 設計）

| ファイル | 内容 |
|---------|------|
| [docs/tanstack-query/INDEX.md](docs/tanstack-query/INDEX.md) | **入り口** — 読者レベル別ナビゲーション |
| [docs/tanstack-query/01-usequery-reference.md](docs/tanstack-query/01-usequery-reference.md) | useQuery 全オプション・全返却値（isLoading/isPending/isFetching の違い図解） |
| [docs/tanstack-query/02-usemutation-reference.md](docs/tanstack-query/02-usemutation-reference.md) | useMutation ライフサイクル・楽観的更新パターン |
| [docs/tanstack-query/03-queryclient-reference.md](docs/tanstack-query/03-queryclient-reference.md) | QueryClient 全メソッド（invalidate/ensure/set/get） |
| [docs/tanstack-query/04-types-catalog.md](docs/tanstack-query/04-types-catalog.md) | 型カタログ（QueryKey, FetchStatus, RetryValue 等） |
| [docs/tanstack-query/05-other-hooks-reference.md](docs/tanstack-query/05-other-hooks-reference.md) | useInfiniteQuery, useSuspenseQuery, useQueries 等 |
| [docs/tanstack-query/06-practical-patterns.md](docs/tanstack-query/06-practical-patterns.md) | 実践パターン10選（Key Factory, enabled, select, polling 等） |
| [docs/tanstack-query/07-cache-behavior.md](docs/tanstack-query/07-cache-behavior.md) | キャッシュ完全解説（データが「勝手に更新されない」理由と対策） |
| [docs/tanstack-query/08-react-hooks-integration.md](docs/tanstack-query/08-react-hooks-integration.md) | React Hooks連携（useState/useEffect/useMemo との使い分け） |
| [docs/tanstack-query/09-responsibility-design.md](docs/tanstack-query/09-responsibility-design.md) | 責務設計（Service/Hook/Component の境界線） |
| [docs/tanstack-query/10-concurrent-and-pitfalls.md](docs/tanstack-query/10-concurrent-and-pitfalls.md) | 並行処理・レースコンディション・よくあるバグ |

### TanStack Query 機能サンプル集（TDD付き）

| ディレクトリ | 機能 | テスト数 |
|------------|------|---------|
| [src/examples/01-query-options-typed/](src/examples/01-query-options-typed/) | queryOptions + DataTag 型安全共有 | 4 |
| [src/examples/02-enabled-and-skip-token/](src/examples/02-enabled-and-skip-token/) | enabled / skipToken 条件付きクエリ | 6 |
| [src/examples/03-select-transform/](src/examples/03-select-transform/) | select によるデータ変換 | 5 |
| [src/examples/04-polling-refetch-interval/](src/examples/04-polling-refetch-interval/) | refetchInterval ポーリング | 2 |
| [src/examples/05-parallel-queries/](src/examples/05-parallel-queries/) | useQueries 並列クエリ + combine | 4 |
| [src/examples/06-dependent-queries/](src/examples/06-dependent-queries/) | 依存クエリ（skipToken連携） | 3 |
| [src/examples/07-optimistic-update/](src/examples/07-optimistic-update/) | 楽観的更新（onMutate / onError / onSettled） | 3 |
| [src/examples/08-global-loading/](src/examples/08-global-loading/) | useIsFetching / useIsMutating | 3 |
| [src/examples/09-infinite-query/](src/examples/09-infinite-query/) | useInfiniteQuery 無限スクロール | 5 |
| [src/examples/10-suspense-query/](src/examples/10-suspense-query/) | useSuspenseQuery Suspense統合 | 3 |

---

## 責務分離アーキテクチャ

```
Route        URL管理 + validateSearch + loader prefetch
  ↓
Component    UI描画 + useState（フォーム状態）
  ↓
Hook         useQuery / useMutation + queryKey + キャッシュ戦略
  ↓
Service      APIクライアントを通じたHTTP通信（インターフェース分離）
  ↓
ApiClient    fetch ラップ + ApiError ハンドリング
```

各レイヤーは上位への依存がなく、テストも独立して実行可能。

---

## TanStack Query なしとの比較

```ts
// TanStack Query なしの場合（各コンポーネントに書く）
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
useEffect(() => {
  let cancelled = false
  fetchUsers(params)
    .then(d => { if (!cancelled) setData(d) })
    .catch(e => { if (!cancelled) setError(e) })
    .finally(() => { if (!cancelled) setLoading(false) })
  return () => { cancelled = true }
}, [params])
// → キャッシュなし、重複排除なし、レースコンディション対策が自前

// TanStack Query ありの場合
const { data, isLoading, error } = useQuery({ queryKey, queryFn })
// → キャッシュ・重複排除・リトライ・レースコンディション防止が自動
```

---

## License

MIT
