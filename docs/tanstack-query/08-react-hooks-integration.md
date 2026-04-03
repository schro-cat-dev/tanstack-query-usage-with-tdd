# React Hooks との連携

TanStack Query の Hook と React 標準の Hook をどう組み合わせるかを、具体例とともに解説します。

---

## 前提: TanStack Query は React の状態管理を「置き換える」ものではない

```
React useState/useReducer  → クライアント状態（フォーム入力、UI表示切替、モーダル開閉）
TanStack Query            → サーバー状態（API から取得したデータ）
```

この2つは **共存** するものであり、どちらか一方に統一するものではありません。

---

## useState との連携

### パターン: 検索パラメータの管理

```tsx
function UsersPage() {
  // クライアント状態: 検索条件はユーザーの入力なので useState
  const [params, setParams] = useState<UserSearchParams>({
    query: '',
    page: 1,
    perPage: 10,
  })

  // サーバー状態: API からのデータは useQuery
  const { data, isLoading } = useSearchUsers(params)

  // params が変わると queryKey が変わり、自動で再フェッチされる
  return (
    <div>
      <input onChange={(e) => setParams(p => ({ ...p, query: e.target.value, page: 1 }))} />
      {isLoading ? <p>読み込み中</p> : <UserTable users={data.data} />}
    </div>
  )
}
```

**ルール:** 「ユーザーの入力や UI の状態」は `useState`、「サーバーから来るデータ」は `useQuery`。

### アンチパターン: useQuery のデータを useState にコピーしない

```tsx
// NG: データを useState にコピー → 二重管理になる
const { data } = useQuery({ ... })
const [users, setUsers] = useState<User[]>([])

useEffect(() => {
  if (data) setUsers(data)  // ← これは不要！
}, [data])

// OK: useQuery の data をそのまま使う
const { data } = useQuery({ ... })
// data.users をそのままレンダリングに使う
```

---

## useEffect との連携

### 基本原則: useQuery があれば useEffect は（ほぼ）不要

TanStack Query はデータフェッチの副作用を内部で管理します。
`useEffect` で `fetch` を呼ぶ必要はありません。

```tsx
// NG: useEffect + useState でデータ取得
const [users, setUsers] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  setLoading(true)
  fetchUsers()
    .then(setUsers)
    .catch(setError)
    .finally(() => setLoading(false))
}, [])

// OK: useQuery で一行
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})
```

### useEffect が必要なケース

**1. データ取得の「結果」に対する副作用**

```tsx
const { data } = useQuery({ ... })

// データが取得されたら document.title を更新
useEffect(() => {
  if (data) {
    document.title = `${data.totalUsers} ユーザー`
  }
}, [data])
```

**2. 外部システムとの同期**

```tsx
const { data } = useQuery({ queryKey: ['settings'], queryFn: fetchSettings })

useEffect(() => {
  if (data?.theme) {
    document.documentElement.setAttribute('data-theme', data.theme)
  }
}, [data?.theme])
```

**3. イベントリスナーの登録**

```tsx
useEffect(() => {
  const handler = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  window.addEventListener('push-notification', handler)
  return () => window.removeEventListener('push-notification', handler)
}, [queryClient])
```

---

## useMemo との連携

### パターン: 取得データの加工

```tsx
const { data } = useSearchUsers(params)

// useMemo でデータを加工（フィルタ、ソート、集計など）
const adminUsers = useMemo(
  () => data?.data.filter(u => u.role === 'admin') ?? [],
  [data],
)

const userCount = useMemo(
  () => data?.total ?? 0,
  [data],
)
```

### select vs useMemo

```tsx
// 方法1: select（useQuery 内部で変換）
const { data: adminUsers } = useQuery({
  queryKey: queryKeys.users.list(params),
  queryFn: () => userService.searchUsers(params),
  select: (response) => response.data.filter(u => u.role === 'admin'),
})

// 方法2: useMemo（コンポーネント側で変換）
const { data } = useSearchUsers(params)
const adminUsers = useMemo(
  () => data?.data.filter(u => u.role === 'admin') ?? [],
  [data],
)
```

| | select | useMemo |
|--|--------|---------|
| 変換タイミング | キャッシュ更新時 | レンダリング時 |
| 再レンダリング | 変換結果が変わった場合のみ | 常に（data 参照が変わるため） |
| 推奨ケース | 同じクエリを複数コンポーネントで使い、各々異なるビューが必要な場合 | 単一コンポーネント内での加工 |

---

## useCallback との連携

### パターン: Mutation の呼び出し関数をメモ化

```tsx
function CreateUserButton() {
  const { mutate } = useCreateUser()

  // mutate 自体は安定した参照を持つので、useCallback は不要
  // ↓ これは過剰なメモ化
  // const handleCreate = useCallback(() => mutate(data), [mutate, data])

  // OK: 直接渡す
  return <button onClick={() => mutate(formData)}>作成</button>
}
```

### useCallback が必要なケース

```tsx
// select 関数をメモ化する場合
const selectActive = useCallback(
  (data: PaginatedResponse<User>) => data.data.filter(u => u.role === 'admin'),
  [],
)

const { data } = useQuery({
  queryKey: queryKeys.users.list(params),
  queryFn: () => userService.searchUsers(params),
  select: selectActive,
})
```

---

## useTransition との連携（React 18+）

### パターン: 検索パラメータ変更を低優先度にする

```tsx
function UsersPage() {
  const [params, setParams] = useState<UserSearchParams>({ page: 1 })
  const [isPending, startTransition] = useTransition()

  const { data } = useSearchUsers(params)

  const handleSearch = (query: string) => {
    // 検索パラメータの更新を低優先度トランジションにする
    startTransition(() => {
      setParams(p => ({ ...p, query, page: 1 }))
    })
  }

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <UserTable users={data?.data ?? []} />
      </div>
    </div>
  )
}
```

**注意:** `useTransition` は **React の状態更新** を遅延させるもので、TanStack Query のフェッチを遅延させるものではありません。`params` が変わった瞬間に新しいクエリが発火します。

---

## useRef との連携

### パターン: 前回の値との比較

```tsx
function UsersPage() {
  const { data } = useSearchUsers(params)
  const prevTotal = useRef(data?.total)

  useEffect(() => {
    if (data?.total !== undefined && prevTotal.current !== data.total) {
      console.log(`ユーザー数が ${prevTotal.current} → ${data.total} に変更`)
      prevTotal.current = data.total
    }
  }, [data?.total])
}
```

### パターン: AbortController の管理

```tsx
// useQuery は内部で AbortController を管理するので、通常は不要
// ただし、useMutation でカスタムキャンセルが必要な場合:
function useUploadFile() {
  const abortRef = useRef<AbortController | null>(null)

  const mutation = useMutation({
    mutationFn: (file: File) => {
      abortRef.current = new AbortController()
      return uploadService.upload(file, abortRef.current.signal)
    },
  })

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { ...mutation, cancel }
}
```

---

## useContext との連携

### パターン: テーマやロケールに応じたクエリ

```tsx
const { locale } = useContext(LocaleContext)

const { data } = useQuery({
  queryKey: ['translations', locale],  // locale が変わるとキーが変わり再フェッチ
  queryFn: () => fetchTranslations(locale),
  staleTime: Infinity,  // 言語データは変わらないので永久キャッシュ
})
```

---

## 組み合わせの判断フロー

```
「このデータはどこから来る？」

→ サーバーから取得する       → useQuery
→ ユーザーの入力/UIの状態    → useState
→ 計算で導出できる          → useMemo（または select）
→ サーバーに変更を送る       → useMutation
→ DOM の直接操作            → useRef
→ 取得後の副作用            → useEffect
→ 低優先度のUI更新          → useTransition
```

---

## やってはいけないパターン集

### 1. useQuery の中で useEffect を使ってフェッチ

```tsx
// NG
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers)
}, [])

// OK
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
```

### 2. useQuery のデータを useState にコピー

```tsx
// NG
const { data } = useQuery({ ... })
const [localData, setLocalData] = useState(data)
useEffect(() => { if (data) setLocalData(data) }, [data])

// OK: data をそのまま使う
```

### 3. useQuery を条件分岐の中で呼ぶ

```tsx
// NG: Hook のルール違反
if (userId) {
  const { data } = useQuery({ ... })
}

// OK: enabled で制御
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId!),
  enabled: !!userId,
})
```

### 4. mutate を useEffect 内で呼ぶ

```tsx
// NG: 無限ループの可能性
useEffect(() => {
  mutate(data)
}, [data])

// OK: ユーザーアクション（クリック等）をトリガーにする
<button onClick={() => mutate(data)}>保存</button>
```
