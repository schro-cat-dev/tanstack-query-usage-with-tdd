# src/test/ - テストヘルパーとセットアップ

## このディレクトリは何？

テスト実行時に必要な **セットアップ** と **ヘルパー関数** が置かれています。
テストファイル自体はここに置きません（テストはテスト対象のファイルと同じ場所に置く）。

## ディレクトリ構成

```
test/
├── setup.ts                     # Vitest グローバルセットアップ
├── helpers/
│   ├── create-query-client.ts   # テスト用 QueryClient 生成
│   └── render.tsx               # Provider 込みカスタム render
└── README.md                    # ← このファイル
```

## 各ファイルの説明

### setup.ts - グローバルセットアップ

すべてのテストファイルの実行前に自動で読み込まれます（`vitest.config.ts` の `setupFiles` で設定）。

**やっていること:**
1. `@testing-library/jest-dom` のカスタムマッチャーを追加（`toBeInTheDocument()` など）
2. MSW サーバーの起動（`beforeAll`）
3. テスト間のクリーンアップ（`afterEach`）
4. MSW サーバーの終了（`afterAll`）

### helpers/create-query-client.ts

テスト専用の `QueryClient` を生成する関数です。

**なぜ本番用と分けるの？**

| 設定 | 本番 | テスト |
|------|------|--------|
| `retry` | 1回 | なし（テストが遅くなるため） |
| `gcTime` | 5分 | 0（テスト間でキャッシュを残さない） |
| `staleTime` | 30秒 | 0（常に新鮮なデータを取得） |

```ts
import { createTestQueryClient } from '@/test/helpers/create-query-client'

const queryClient = createTestQueryClient()
```

### helpers/render.tsx

React Testing Library の `render` と `renderHook` をラップした関数です。
テストに必要な Provider（`QueryClientProvider` など）を自動で付与します。

## 使い方

### コンポーネントのテスト

```tsx
import { renderWithProviders } from '@/test/helpers/render'
import { screen } from '@testing-library/react'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage'

it('ダッシュボードにタイトルが表示される', async () => {
  renderWithProviders(<DashboardPage />)

  // waitFor は非同期データの読み込みを待つ
  expect(await screen.findByText('ダッシュボード')).toBeInTheDocument()
})
```

### カスタムフック（useQuery/useMutation）のテスト

```tsx
import { renderHookWithProviders } from '@/test/helpers/render'
import { waitFor } from '@testing-library/react'
import { useGetDashboardStats } from '@/features/dashboard/hooks/use-get-dashboard-stats'

it('ダッシュボードデータを取得できる', async () => {
  const { result } = renderHookWithProviders(() => useGetDashboardStats())

  // 最初はローディング状態
  expect(result.current.isLoading).toBe(true)

  // データが取得されるまで待つ
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })

  // データの内容を確認
  expect(result.current.data?.stats.totalUsers).toBe(10)
})
```

### エラーケースのテスト

```tsx
import { server } from '@/mocks/server'
import { dashboardErrorHandlers } from '@/mocks/handlers/dashboard.handlers'

it('エラー時にエラー状態になる', async () => {
  // このテストだけ 500 エラーを返すように上書き
  server.use(dashboardErrorHandlers.serverError)

  const { result } = renderHookWithProviders(() => useGetDashboardStats())

  await waitFor(() => {
    expect(result.current.isError).toBe(true)
  })
})
```

## テストの実行方法

```bash
# 全テスト実行
npm run test:run

# ウォッチモード（ファイル変更時に自動再実行）
npm test

# 特定のファイルだけ実行
npx vitest run src/lib/api/api-client.test.ts

# カバレッジ付きで実行
npm run test:coverage
```

## よくある間違い

### 1. `renderWithProviders` を使わずに直接 `render` する

```tsx
// NG: QueryClientProvider がないのでエラーになる
import { render } from '@testing-library/react'
render(<DashboardPage />)

// OK: Provider 込みの render を使う
import { renderWithProviders } from '@/test/helpers/render'
renderWithProviders(<DashboardPage />)
```

### 2. 非同期データの待ち方

```tsx
// NG: 即座にチェックするとローディング中のため失敗
renderWithProviders(<DashboardPage />)
expect(screen.getByText('10')).toBeInTheDocument()

// OK: findByText や waitFor で待つ
renderWithProviders(<DashboardPage />)
expect(await screen.findByText('10')).toBeInTheDocument()
```

### 3. テスト間のキャッシュ汚染

`renderWithProviders` は毎回新しい `QueryClient` を生成するので心配不要です。
ただし、`server.use()` で上書きしたハンドラも `afterEach` で自動リセットされます。
