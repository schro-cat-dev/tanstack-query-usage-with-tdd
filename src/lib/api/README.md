# src/lib/api/ - 汎用 HTTP クライアント

## このディレクトリは何？

外部 API と通信するための **汎用的な HTTP クライアント** が置かれています。
`fetch` API を直接使う代わりに、このクライアントを使うことで以下のメリットがあります：

- **型安全**: レスポンスの型を指定できる（`get<User>('/api/users/1')`）
- **エラーハンドリング**: HTTP エラー時に自動で `ApiError` をスローする
- **一元管理**: ベース URL やヘッダーの設定が1箇所で済む

## ファイル一覧

| ファイル | 説明 |
|---------|------|
| `interfaces.ts` | `IApiClient` インターフェース（API クライアントの「契約」） |
| `api-client.ts` | `ApiClient` クラス（インターフェースの実装） |
| `api-client.test.ts` | API クライアントのテスト |

## 使い方

### 基本的な GET リクエスト

```ts
import { apiClient } from '@/lib/api/api-client'
import type { User } from '@/types'

// ジェネリクス <User[]> でレスポンスの型を指定
const users = await apiClient.get<User[]>('/api/users')
// users の型は User[] になる
```

### クエリパラメータ付き GET

```ts
const users = await apiClient.get<PaginatedResponse<User>>('/api/users', {
  query: '田中',
  page: '1',
  perPage: '10',
})
// → GET /api/users?query=田中&page=1&perPage=10
```

### POST リクエスト

```ts
import type { CreateUserRequest, CreateUserResponse } from '@/types'

const newUser = await apiClient.post<CreateUserResponse>('/api/users', {
  name: '田中太郎',
  email: 'tanaka@example.com',
  role: 'admin',
})
// newUser.user が作成されたユーザー
```

### ファイルダウンロード（Blob）

```ts
const blob = await apiClient.getBlob('/api/users/export/csv', {
  query: '田中',
})
// blob を使ってブラウザにダウンロードさせる
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'users.csv'
a.click()
URL.revokeObjectURL(url)
```

### エラーハンドリング

```ts
import { ApiError } from '@/types'

try {
  await apiClient.get('/api/users')
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        console.log('入力が正しくありません:', error.data)
        break
      case 404:
        console.log('見つかりませんでした')
        break
      case 500:
        console.log('サーバーエラーが発生しました')
        break
    }
  }
}
```

## アーキテクチャ解説

### なぜインターフェースがあるの？

`IApiClient` インターフェースは「API クライアントが持つべきメソッド」を定義しています。
これにより：

1. **テスト時にモックに差し替えやすい**（同じインターフェースを満たすモッククラスを作れる）
2. **実装を変更しても呼び出し側は変わらない**（例: fetch → axios に変更しても）

```
IApiClient (インターフェース = 契約)
    │
    └── ApiClient (具象クラス = 実装)
         └── fetch を使って通信する
```

### メソッド一覧

| メソッド | HTTP メソッド | 戻り値 | 用途 |
|---------|-------------|--------|------|
| `get<T>(path, params?)` | GET | `Promise<T>` | データ取得 |
| `post<T>(path, body)` | POST | `Promise<T>` | データ作成 |
| `put<T>(path, body)` | PUT | `Promise<T>` | データ更新 |
| `delete<T>(path)` | DELETE | `Promise<T>` | データ削除 |
| `getBlob(path, params?)` | GET | `Promise<Blob>` | ファイルダウンロード |

## よくある間違い

### 1. ジェネリクスを忘れる

```ts
// NG: 戻り値の型が unknown になる
const data = await apiClient.get('/api/users')

// OK: 型を指定する
const data = await apiClient.get<User[]>('/api/users')
```

### 2. パラメータの値は文字列

```ts
// NG: number を渡すと型エラー
apiClient.get('/api/users', { page: 1 })

// OK: 文字列に変換する
apiClient.get('/api/users', { page: '1' })
```

### 3. 直接 fetch を使わない

```ts
// NG: 直接 fetch を使うとエラーハンドリングが漏れる
const res = await fetch('/api/users')

// OK: apiClient を使う（エラーハンドリングが自動で行われる）
const data = await apiClient.get<User[]>('/api/users')
```
