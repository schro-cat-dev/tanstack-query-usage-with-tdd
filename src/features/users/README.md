# features/users/ - ユーザー管理機能

## この機能は何？

ユーザー管理に関する機能を提供します：
- **検索付きユーザー一覧** (`/users`) - 名前・メール・ロールで検索、ページネーション、ソート
- **ユーザー作成** (`/users/create`) - フォーム入力、バリデーション、キャッシュ自動更新
- **CSVダウンロード** - フィルタ条件を維持したまま一括ダウンロード

## ディレクトリ構成

```
users/
├── services/
│   ├── user.service.interface.ts   # IUserService インターフェース
│   ├── user.service.ts             # UserService 実装クラス
│   └── user.service.test.ts        # 12テストケース
├── hooks/
│   ├── use-search-users.ts         # 一覧取得 (useQuery)
│   ├── use-search-users.test.ts    # 6テストケース
│   ├── use-create-user.ts          # 作成 (useMutation)
│   ├── use-create-user.test.ts     # 7テストケース
│   ├── use-download-users-csv.ts   # CSVダウンロード (useState)
│   └── use-download-users-csv.test.ts # 6テストケース
├── components/
│   ├── UsersPage.tsx               # 一覧ページ
│   ├── UsersPage.test.tsx          # 7テストケース
│   ├── UserSearchForm.tsx          # 検索フォーム
│   ├── UserSearchForm.test.tsx     # 5テストケース
│   ├── UserTable.tsx               # テーブル+ページネーション
│   ├── UserTable.test.tsx          # 9テストケース
│   ├── CreateUserForm.tsx          # 作成フォーム
│   ├── CreateUserForm.test.tsx     # 8テストケース
│   ├── CsvDownloadButton.tsx       # CSVダウンロードボタン
│   └── CsvDownloadButton.test.tsx  # 6テストケース
└── README.md                       # ← このファイル
```

## データの流れ

### 一覧取得
```
URL params (/users?query=田中&role=admin&page=1)
    ↓ TanStack Router validateSearch
UserSearchParams (型安全なオブジェクト)
    ↓
useSearchUsers(params)  → UserService.searchUsers() → GET /api/users?query=田中&...
    ↓ { data, isLoading, isError }
UsersPage → UserSearchForm + UserTable + Pagination
```

### ユーザー作成
```
CreateUserForm (フォーム入力)
    ↓ handleSubmit
useCreateUser().mutate(data)  → UserService.createUser() → POST /api/users
    ↓ onSuccess
queryClient.invalidateQueries(queryKeys.users.lists())
    ↓ 自動
一覧のデータが再フェッチされ最新状態に
```

### CSVダウンロード
```
CsvDownloadButton
    ↓ onClick
useDownloadUsersCsv().download(filters)  → UserService.downloadUsersCsv() → GET /api/users/export/csv
    ↓ Blob
URL.createObjectURL → <a>.click() → ブラウザダウンロード
    ↓
URL.revokeObjectURL（メモリ解放）
```

## 使い方

### 一覧取得フック

```tsx
import { useSearchUsers } from '@/features/users/hooks/use-search-users'

function MyComponent() {
  const { data, isLoading, isError } = useSearchUsers({
    query: '田中',
    role: 'admin',
    page: 1,
    perPage: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  if (isLoading) return <p>読み込み中...</p>
  if (isError) return <p>エラー</p>

  return (
    <ul>
      {data.data.map(user => (
        <li key={user.id}>{user.name} ({user.role})</li>
      ))}
    </ul>
  )
}
```

### 作成フック

```tsx
import { useCreateUser } from '@/features/users/hooks/use-create-user'

function MyComponent() {
  const { mutate, isPending, isError, error } = useCreateUser()

  const handleSubmit = () => {
    mutate(
      { name: '田中太郎', email: 'tanaka@example.com', role: 'viewer' },
      {
        onSuccess: (data) => console.log('作成完了:', data.user),
        onError: (error) => console.error('失敗:', error),
      }
    )
  }
}
```

### CSVダウンロードフック

```tsx
import { useDownloadUsersCsv } from '@/features/users/hooks/use-download-users-csv'

function MyComponent() {
  const { download, isDownloading, error } = useDownloadUsersCsv()

  return (
    <button onClick={() => download({ role: 'admin' })} disabled={isDownloading}>
      {isDownloading ? 'ダウンロード中...' : 'CSVダウンロード'}
    </button>
  )
}
```

## キャッシュ制御の設計判断

| 操作 | キャッシュ戦略 | 理由 |
|------|-------------|------|
| 一覧取得 | `useQuery` + `keepPreviousData` | 検索パラメータ切替時にUIがちらつかない |
| ユーザー作成 | `useMutation` + `invalidateQueries` | 作成成功時に一覧を自動更新 |
| CSVダウンロード | `useState` (キャッシュなし) | Blobは一時的データ。メモリ節約のためキャッシュに乗せない |

## テストの実行

```bash
npx vitest run src/features/users/
```

## API 仕様

### GET /api/users
| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|----------|------|
| query | string | - | 名前/メールの部分一致検索 |
| role | 'admin'/'editor'/'viewer' | - | ロールフィルタ |
| page | number | 1 | ページ番号 |
| perPage | number | 10 | 1ページあたりの件数 |
| sortBy | string | 'createdAt' | ソートカラム |
| sortOrder | 'asc'/'desc' | 'desc' | ソート順 |

### POST /api/users
**Request Body:** `{ name: string, email: string, role: UserRole }`
**Response:** `{ user: User }` (201)
**Errors:** 400 (バリデーション), 500 (サーバーエラー)

### GET /api/users/export/csv
**Response:** text/csv Blob
