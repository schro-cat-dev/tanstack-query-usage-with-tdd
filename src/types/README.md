# src/types/ - ドメイン型定義

## このディレクトリは何？

アプリケーション全体で共有する **TypeScript の型定義** を置く場所です。
API のリクエスト・レスポンスの形状や、アプリ内で使うデータモデルの「設計図」がここにあります。

## ファイル一覧

| ファイル | 説明 |
|---------|------|
| `api.ts` | API 通信の共通型（`ApiError`, `PaginatedResponse<T>`） |
| `user.ts` | ユーザーに関する型（`User`, `UserSearchParams`, `CreateUserRequest`） |
| `dashboard.ts` | ダッシュボードに関する型（`DashboardStats`, `ActivityEntry`） |
| `index.ts` | 上記すべてをまとめて re-export するバレルファイル |

## 使い方

### 基本的なインポート

```ts
// 型だけを使う場合は import type を使う（TypeScript の規約）
import type { User, UserSearchParams } from '@/types'

// クラス（実行時に使う値）は通常の import
import { ApiError } from '@/types'
```

### ApiError クラス

API からエラーレスポンス（404, 500 など）が返ってきた場合にスローされるエラークラスです。

```ts
import { ApiError } from '@/types'

try {
  const data = await apiClient.get('/api/users')
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status)     // 404, 500 など
    console.log(error.statusText) // "Not Found" など
    console.log(error.data)       // サーバーが返したエラー詳細
  }
}
```

### PaginatedResponse<T>

ページネーション付きの API レスポンスの型です。`T` の部分に実際のデータの型を入れます。

```ts
import type { PaginatedResponse, User } from '@/types'

// 例: ユーザー一覧 API のレスポンス
const response: PaginatedResponse<User> = {
  data: [{ id: '1', name: '田中', ... }],
  total: 100,  // 全件数
  page: 1,     // 現在のページ
  perPage: 10, // 1ページあたりの件数
}
```

### User 型

```ts
import type { User } from '@/types'

const user: User = {
  id: '1',
  name: '田中太郎',
  email: 'tanaka@example.com',
  role: 'admin',      // 'admin' | 'editor' | 'viewer' のいずれか
  createdAt: '2026-01-15T09:00:00Z',
  updatedAt: '2026-03-20T14:30:00Z',
}
```

### UserRole（ユーザーロール）

```ts
import { USER_ROLES } from '@/types'
import type { UserRole } from '@/types'

// USER_ROLES は配列: ['admin', 'editor', 'viewer']
// セレクトボックスの選択肢などに使える
USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)

// UserRole は型: 'admin' | 'editor' | 'viewer'
const role: UserRole = 'admin'
```

## よくある間違い

### 1. `import` と `import type` の使い分け

```ts
// NG: ApiError はクラス（実行時に使う）なので import type にすると動かない
import type { ApiError } from '@/types'
// error instanceof ApiError  → エラー！

// OK: クラスは通常の import
import { ApiError } from '@/types'
```

### 2. `enum` は使えない

このプロジェクトでは TypeScript の `erasableSyntaxOnly: true` 設定を使っているため、`enum` は使えません。代わりに `as const` を使います。

```ts
// NG
enum Role { Admin = 'admin', Editor = 'editor' }

// OK
const USER_ROLES = ['admin', 'editor', 'viewer'] as const
type UserRole = (typeof USER_ROLES)[number]
```
