# features/dashboard/ - ダッシュボード機能

## この機能は何？

アプリケーションのトップページ（`/`）に表示される **ダッシュボード** です。
ユーザーの統計情報（総数、アクティブ数など）と最近のアクティビティを表示します。

## ディレクトリ構成

```
dashboard/
├── services/
│   ├── dashboard.service.interface.ts  # サービスのインターフェース
│   ├── dashboard.service.ts            # API通信ロジック
│   └── dashboard.service.test.ts       # サービスのテスト
├── hooks/
│   ├── use-get-dashboard-stats.ts      # データ取得カスタムフック
│   └── use-get-dashboard-stats.test.ts # フックのテスト
├── components/
│   ├── DashboardPage.tsx               # ページコンポーネント
│   ├── DashboardPage.test.tsx          # コンポーネントのテスト
│   └── StatCard.tsx                    # 統計カードコンポーネント
└── README.md                           # ← このファイル
```

## データの流れ

```
API (/api/dashboard)
    ↓ fetch
DashboardService.getDashboardData()     ← services/
    ↓ Promise<DashboardData>
useGetDashboardStats()                  ← hooks/ (useQuery でラップ)
    ↓ { data, isLoading, isError }
DashboardPage                           ← components/ (UIを描画)
    ├── StatCard (統計カード × 4)
    └── ActivityList (最近のアクティビティ)
```

## 使い方

### コンポーネントとして使う

```tsx
import { DashboardPage } from '@/features/dashboard/components/DashboardPage'

// ページ全体を表示（内部でデータ取得を行う）
<DashboardPage />
```

### フックだけ使う（別のコンポーネントでダッシュボードデータが必要な場合）

```tsx
import { useGetDashboardStats } from '@/features/dashboard/hooks/use-get-dashboard-stats'

function MyComponent() {
  const { data, isLoading, isError, refetch } = useGetDashboardStats()

  if (isLoading) return <p>読み込み中...</p>
  if (isError) return <p>エラー</p>

  return <p>総ユーザー数: {data.stats.totalUsers}</p>
}
```

### ルーティングでのプリフェッチ

TanStack Router の `loader` で事前にデータをキャッシュに入れることで、
ページ遷移時にローディング表示を見せずにデータを表示できます。

```tsx
// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getDashboardQueryOptions } from '@/features/dashboard/hooks/use-get-dashboard-stats'

export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getDashboardQueryOptions()),
  component: DashboardPage,
})
```

## テストの実行

```bash
# ダッシュボードのテストだけ実行
npx vitest run src/features/dashboard/

# 結果例:
# ✓ DashboardService > ダッシュボードデータを正常に取得できる
# ✓ DashboardService > 500エラー時にApiErrorをスローする
# ✓ DashboardService > ネットワークエラー時にエラーをスローする
# ✓ useGetDashboardStats > 初期状態はローディング中である
# ✓ useGetDashboardStats > ダッシュボードデータを正常に取得できる
# ✓ useGetDashboardStats > APIエラー時にエラー状態になる
# ✓ useGetDashboardStats > refetch関数でデータを再取得できる
# ✓ DashboardPage > データ取得中はローディング表示される
# ✓ DashboardPage > 統計カードに正しい値が表示される
# ✓ DashboardPage > 最近のアクティビティが表示される
# ✓ DashboardPage > APIエラー時にエラーメッセージが表示される
# ✓ DashboardPage > エラー時にリトライボタンが表示され、クリックで再取得する
# ✓ DashboardPage > アクティビティが空の場合は空メッセージが表示される
```

## API 仕様

### GET /api/dashboard

**レスポンス:**
```json
{
  "stats": {
    "totalUsers": 10,
    "activeUsers": 7,
    "newUsersToday": 1,
    "newUsersThisWeek": 3
  },
  "recentActivity": [
    {
      "id": "act-1",
      "action": "ユーザーを作成しました",
      "userName": "中村真理",
      "timestamp": "2026-04-04T09:00:00Z"
    }
  ]
}
```
