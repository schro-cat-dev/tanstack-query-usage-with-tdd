# 責務設計ガイド

TanStack Query を使うアプリケーションで、**どのレイヤーに何の責務を持たせるか** を明確にします。

---

## レイヤー構成

```
┌─────────────────────────────────────────┐
│  UI Layer (Component)                    │
│  - データの表示                           │
│  - ユーザー入力の受付                      │
│  - ローディング/エラー/成功状態の出し分け    │
├─────────────────────────────────────────┤
│  State & Cache Layer (Custom Hook)       │
│  - useQuery / useMutation のラップ        │
│  - queryKey の指定                        │
│  - キャッシュ戦略(staleTime等)の決定       │
│  - キャッシュ無効化のタイミング決定          │
├─────────────────────────────────────────┤
│  Service Layer (Class)                   │
│  - API呼び出しロジックのカプセル化          │
│  - リクエストパラメータの組み立て            │
│  - レスポンスの型変換                      │
├─────────────────────────────────────────┤
│  API Client (Generic Class)              │
│  - HTTP 通信の実行(fetch)                 │
│  - エラーハンドリング(ApiError)             │
│  - ヘッダー/ベースURL管理                  │
├─────────────────────────────────────────┤
│  Type Definitions                        │
│  - リクエスト/レスポンスの型               │
│  - ドメインモデル                          │
│  - エラー型                               │
└─────────────────────────────────────────┘
```

---

## 各レイヤーの責務（やるべきこと / やってはいけないこと）

### Type Definitions (`src/types/`)

**やるべきこと:**
- API リクエスト/レスポンスの型定義
- ドメインモデル（User, DashboardStats 等）の定義
- バリデーション用の定数（`USER_ROLES` 等）

**やってはいけないこと:**
- ロジックの実装
- React や TanStack Query への依存

### API Client (`src/lib/api/`)

**やるべきこと:**
- `fetch` のラップ（ヘッダー、ベースURL、タイムアウト）
- レスポンスの ok チェックと `ApiError` のスロー
- JSON パース / Blob 取得
- ジェネリクスによる型安全なレスポンス

**やってはいけないこと:**
- ビジネスロジック
- TanStack Query への依存
- リトライロジック（TanStack Query の retry に任せる）

### Service Layer (`src/features/*/services/`)

**やるべきこと:**
- API Client を使ったエンドポイントごとの関数定義
- リクエストパラメータの組み立て（オブジェクト → query string）
- レスポンスの型変換（必要に応じて）
- インターフェースの定義（テスト時のDI用）

**やってはいけないこと:**
- TanStack Query への依存（useQuery 等を呼ばない）
- React への依存
- キャッシュの操作

```ts
// OK: Service は純粋な非同期関数
class UserService implements IUserService {
  async searchUsers(params: UserSearchParams): Promise<PaginatedResponse<User>> {
    return this.#apiClient.get('/api/users', toQueryParams(params))
  }
}

// NG: Service 内で useQuery を呼ぶ
class UserService {
  useSearchUsers(params) {  // ← Hook は Service に置かない
    return useQuery({ ... })
  }
}
```

### State & Cache Layer (`src/features/*/hooks/`)

**やるべきこと:**
- `useQuery` / `useMutation` のラップ
- `queryKey` の指定（Query Key Factory を使う）
- キャッシュ戦略の決定（`staleTime`, `gcTime`, `placeholderData`）
- `invalidateQueries` のタイミング決定（`onSuccess` 内）
- `queryOptions` 関数の export（Router Loader との共有用）

**やってはいけないこと:**
- UIロジック（表示/非表示の判定など）
- フォームの状態管理
- DOM 操作

```ts
// OK: Hook は TanStack Query のラッパー
export function useSearchUsers(params: UserSearchParams) {
  return useQuery(searchUsersQueryOptions(params))
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}
```

### UI Layer (`src/features/*/components/`)

**やるべきこと:**
- カスタム Hook の呼び出し
- `isLoading` / `isError` / `isSuccess` に応じたUI出し分け
- ユーザー入力の管理（`useState`）
- フォームバリデーション
- イベントハンドリング

**やってはいけないこと:**
- `fetch` や API Client の直接呼び出し
- `queryKey` の直接指定
- `queryClient` の直接操作（Hook に委ねる）

```tsx
// OK: Hook の返却値だけを使う
function UsersPage() {
  const { data, isLoading, isError, refetch } = useSearchUsers(params)

  if (isLoading) return <Loading />
  if (isError) return <Error onRetry={refetch} />
  return <UserTable users={data.data} />
}

// NG: コンポーネント内で queryClient を操作
function UsersPage() {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['users', 'list'],  // ← マジックストリング
    queryFn: () => fetch('/api/users').then(r => r.json()),  // ← 直接 fetch
  })
  // queryClient.invalidateQueries(...)  // ← コンポーネントでキャッシュ操作
}
```

### Routing Layer (`src/routes/`)

**やるべきこと:**
- URL とコンポーネントのマッピング
- Search Params のバリデーション（`validateSearch`）
- `ensureQueryData` によるプリフェッチ（`loader`）
- `loaderDeps` でプリフェッチの依存宣言

**やってはいけないこと:**
- ビジネスロジック
- 直接の `fetch` 呼び出し
- コンポーネントの複雑なロジック

---

## 判断フローチャート

### 「この処理はどこに書く？」

```
Q: HTTP 通信をしているか？
├── Yes → API Client (fetch ラップ) or Service (エンドポイント定義)
│
└── No
    Q: queryKey や useQuery/useMutation を使っているか？
    ├── Yes → Custom Hook
    │
    └── No
        Q: JSX を返しているか？
        ├── Yes → Component
        │
        └── No
            Q: URL パスやパラメータに関するか？
            ├── Yes → Route
            │
            └── No → Type Definition or Utility
```

### 「この状態はどこで管理する？」

```
Q: サーバーから来るデータか？
├── Yes → useQuery (Custom Hook 経由)
│
└── No
    Q: URL に反映すべきか？（ページネーション、検索条件）
    ├── Yes → TanStack Router の Search Params
    │
    └── No
        Q: 複数コンポーネントで共有するか？
        ├── Yes → React Context or 状態管理ライブラリ
        │
        └── No → useState (コンポーネントローカル)
```

---

## 本プロジェクトでの具体例

### ユーザー検索一覧の責務分離

```
UserSearchParams (型)
  ↓
UserService.searchUsers(params)       ← Service: API呼び出し
  ↓
searchUsersQueryOptions(params)       ← Hook: queryOptions 定義
  ↓
useSearchUsers(params)                ← Hook: useQuery ラップ
  ↓
UsersPage                             ← Component: UI 描画
  ├── UserSearchForm                  ← Component: 検索フォーム(useState)
  ├── UserTable                       ← Component: テーブル表示
  └── Pagination                      ← Component: ページネーション
```

### ユーザー作成の責務分離

```
CreateUserRequest (型)
  ↓
UserService.createUser(data)          ← Service: API呼び出し
  ↓
useCreateUser()                       ← Hook: useMutation + invalidateQueries
  ↓
CreateUserForm                        ← Component: フォーム + バリデーション
  └── useState(name, email, role)     ← Component: クライアント状態
```

---

## よくある責務の逸脱と修正

### 逸脱1: コンポーネントに queryKey が直書きされている

```tsx
// NG
function UsersPage() {
  const { data } = useQuery({ queryKey: ['users', 'list', params] })
}

// OK: Hook に隠蔽
function UsersPage() {
  const { data } = useSearchUsers(params)
}
```

### 逸脱2: Hook 内でフォーム状態を管理

```ts
// NG: Hook にフォーム状態がある
function useCreateUserForm() {
  const [name, setName] = useState('')
  const mutation = useMutation({ ... })
  return { name, setName, ...mutation }
}

// OK: Hook は mutation だけ、フォーム状態は Component
function useCreateUser() {
  return useMutation({ ... })
}
// Component側で useState を使う
```

### 逸脱3: Service 内で React Hook を呼ぶ

```ts
// NG
class UserService {
  useGetUser(id: string) {
    return useQuery({ ... })  // ← Service は React に依存してはいけない
  }
}

// OK
class UserService {
  async getUser(id: string): Promise<User> {
    return this.#apiClient.get(`/api/users/${id}`)
  }
}
// Hook 側で useQuery を使う
```
