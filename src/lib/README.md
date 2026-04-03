# src/lib/ - 共通ライブラリ

## このディレクトリは何？

アプリケーション全体で共有する **共通ユーティリティ・設定** が置かれています。
特定の機能（ダッシュボード、ユーザー管理など）に依存しない、汎用的なコードです。

## ディレクトリ構成

```
lib/
├── api/
│   ├── interfaces.ts      # IApiClient インターフェース
│   ├── api-client.ts       # ApiClient クラス（HTTP通信）
│   ├── api-client.test.ts  # テスト
│   └── README.md           # 詳細ドキュメント
├── query-keys.ts           # Query Key Factory
├── query-client.ts         # QueryClient 設定
└── README.md               # ← このファイル
```

## 各ファイルの役割

### query-keys.ts - Query Key Factory

TanStack Query のキャッシュキーを一元管理するオブジェクトです。

**なぜ必要？**
TanStack Query はキャッシュキー（配列）でデータを管理します。
キーを文字列で直書きすると、タイポや不整合が起きやすいです。

```ts
// NG: マジックストリング（文字列直書き）
useQuery({ queryKey: ['users', 'list', { page: 1 }] })
// 別の場所で 'user' と書いてしまうとキャッシュが効かない！

// OK: Query Key Factory を使う
import { queryKeys } from '@/lib/query-keys'
useQuery({ queryKey: queryKeys.users.list({ page: 1 }) })
```

**使い方:**

```ts
import { queryKeys } from '@/lib/query-keys'

// ダッシュボード
queryKeys.dashboard.all        // ['dashboard']
queryKeys.dashboard.stats()    // ['dashboard', 'stats']

// ユーザー
queryKeys.users.all            // ['users']
queryKeys.users.lists()        // ['users', 'list']
queryKeys.users.list({ page: 1 })  // ['users', 'list', { page: 1 }]
queryKeys.users.details()      // ['users', 'detail']
queryKeys.users.detail('123')  // ['users', 'detail', '123']
```

**キャッシュの無効化にも使える:**

```ts
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

const queryClient = useQueryClient()

// ユーザーの一覧キャッシュをすべて無効化
queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })

// 特定のユーザーのキャッシュだけ無効化
queryClient.invalidateQueries({ queryKey: queryKeys.users.detail('123') })
```

### query-client.ts - QueryClient 設定

TanStack Query の `QueryClient` を設定・エクスポートしています。
アプリ全体で1つのインスタンスを共有します。

```ts
import { queryClient } from '@/lib/query-client'

// アプリのエントリーポイント（main.tsx）で使う
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**デフォルト設定:**

| 設定 | 値 | 意味 |
|------|-----|------|
| `staleTime` | 30秒 | データ取得後30秒間はキャッシュを再利用 |
| `gcTime` | 5分 | 使われなくなったキャッシュは5分後に削除 |
| `refetchOnWindowFocus` | true | ブラウザタブに戻ったら再取得 |
| `retry` | 1回 | 失敗したら1回だけリトライ |

## よくある間違い

### 1. テスト用と本番用の QueryClient を間違える

```ts
// NG: テストで本番用 QueryClient を使う（リトライが入って遅くなる）
import { queryClient } from '@/lib/query-client'

// OK: テスト用ヘルパーを使う（リトライなし、キャッシュなし）
import { createTestQueryClient } from '@/test/helpers/create-query-client'
```

### 2. Query Key を直書きする

```ts
// NG
useQuery({ queryKey: ['users', 'list'] })

// OK
useQuery({ queryKey: queryKeys.users.lists() })
```
