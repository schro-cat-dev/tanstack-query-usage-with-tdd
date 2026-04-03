# src/mocks/ - MSW (Mock Service Worker) モック定義

## このディレクトリは何？

**MSW (Mock Service Worker)** を使った API モックの定義が置かれています。
テスト時に実際のサーバーなしで API レスポンスをシミュレートします。

## ディレクトリ構成

```
mocks/
├── handlers/
│   ├── index.ts                # 全ハンドラを集約
│   ├── dashboard.handlers.ts   # ダッシュボード API のモック
│   └── user.handlers.ts        # ユーザー API のモック
├── data/
│   ├── users.ts                # ユーザーのフィクスチャデータ
│   └── dashboard.ts            # ダッシュボードのフィクスチャデータ
├── server.ts                   # テスト用 MSW サーバー
├── browser.ts                  # 開発用 MSW ワーカー
└── README.md                   # ← このファイル
```

## MSW とは？

MSW は **ネットワークレベルで API をモックする** ライブラリです。
`fetch` や `XMLHttpRequest` の通信を途中でインターセプトして、事前に定義したレスポンスを返します。

```
コンポーネント → fetch('/api/users') → MSW がインターセプト → モックデータを返す
```

## 使い方

### 1. テストでの利用（自動セットアップ済み）

`src/test/setup.ts` で MSW サーバーが自動的に起動されるため、テストファイルでは特別な設定は不要です。

```ts
// テストファイルでは、ハンドラが自動で有効になっている
it('ユーザー一覧を取得できる', async () => {
  // fetch('/api/users') は自動的に mockUsers を返す
  const result = await apiClient.get('/api/users')
  expect(result.data).toHaveLength(10)
})
```

### 2. テストでエラーケースをシミュレート

特定のテストだけハンドラを上書きできます（`server.use()`）。

```ts
import { server } from '@/mocks/server'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers'

it('サーバーエラー時にエラーメッセージを表示する', async () => {
  // このテストだけ 500 エラーを返すように上書き
  server.use(userErrorHandlers.listServerError)

  // ... テストコード
})
// テスト後に自動で元のハンドラに戻る（setup.ts の resetHandlers）
```

### 3. 開発サーバーでの利用

ブラウザでの開発時にも MSW を使えます。`main.tsx` で以下のように設定します：

```ts
import { worker } from '@/mocks/browser'

if (import.meta.env.DEV) {
  await worker.start({ onUnhandledRequest: 'bypass' })
}
```

## ハンドラの書き方

### 正常系ハンドラ

```ts
import { http, HttpResponse } from 'msw'

export const userHandlers = [
  // GET /api/users - ユーザー一覧
  http.get('/api/users', () => {
    return HttpResponse.json({
      data: mockUsers,
      total: mockUsers.length,
      page: 1,
      perPage: 10,
    })
  }),

  // POST /api/users - ユーザー作成
  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ user: { id: '99', ...body } }, { status: 201 })
  }),
]
```

### エラー系ハンドラ

```ts
export const userErrorHandlers = {
  // 500 サーバーエラー
  listServerError: http.get('/api/users', () => {
    return HttpResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    )
  }),

  // 400 バリデーションエラー
  createValidationError: http.post('/api/users', () => {
    return HttpResponse.json(
      { message: 'Email already exists', field: 'email' },
      { status: 400 },
    )
  }),
}
```

### 遅延レスポンス（ローディング状態のテスト用）

```ts
import { http, HttpResponse, delay } from 'msw'

const delayedHandler = http.get('/api/users', async () => {
  await delay(2000) // 2秒待つ
  return HttpResponse.json({ data: mockUsers })
})
```

## フィクスチャデータ

`data/` ディレクトリにテスト用の固定データがあります。

```ts
import { mockUsers } from '@/mocks/data/users'
import { mockDashboardData } from '@/mocks/data/dashboard'

// テストで直接使うこともできる
expect(result).toEqual(mockDashboardData)
```

## よくある間違い

### 1. `server.use()` で上書きしたハンドラが他のテストに影響する

→ `setup.ts` で `afterEach(() => server.resetHandlers())` しているので大丈夫です。

### 2. MSW v2 と v1 の API を間違える

```ts
// NG (v1 の書き方)
rest.get('/api/users', (req, res, ctx) => {
  return res(ctx.json({ data: [] }))
})

// OK (v2 の書き方)
http.get('/api/users', () => {
  return HttpResponse.json({ data: [] })
})
```

### 3. `onUnhandledRequest: 'error'` で意図しないエラー

テストセットアップでは未定義のリクエストをエラーにしています。
新しい API エンドポイントを追加したら、必ず対応するハンドラも追加してください。
