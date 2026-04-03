# useMutation 完全リファレンス

データの **作成・更新・削除** など、サーバーの状態を変更する操作のための Hook です。

---

## 型シグネチャ

```ts
function useMutation<
  TData = unknown,           // mutationFn が返すデータの型
  TError = DefaultError,     // エラーの型
  TVariables = void,         // mutate に渡す引数の型
  TOnMutateResult = unknown  // onMutate が返す値の型（楽観的更新に使う）
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: QueryClient
): UseMutationResult<TData, TError, TVariables, TOnMutateResult>
```

### ジェネリクスの意味

| 型パラメータ | 意味 | 例 |
|------------|------|-----|
| `TData` | API レスポンスの型 | `CreateUserResponse` |
| `TError` | エラーの型 | `ApiError` |
| `TVariables` | `mutate()` に渡す引数の型 | `CreateUserRequest` |
| `TOnMutateResult` | `onMutate` の戻り値の型（楽観的更新のロールバック用） | `{ previousUsers: User[] }` |

---

## 全オプション一覧

### 基本

| オプション | 型 | 説明 |
|-----------|-----|------|
| `mutationFn` | `(variables: TVariables, context) => Promise<TData>` | 実行する非同期関数 |
| `mutationKey` | `MutationKey` | Mutation を識別するキー（省略可） |

### ライフサイクルコールバック

```
mutate() 呼び出し
  ↓
onMutate(variables)        ← 楽観的更新のチャンス
  ↓
mutationFn(variables)      ← API 呼び出し
  ↓ 成功                   ↓ 失敗
onSuccess(data, variables)  onError(error, variables, onMutateResult)
  ↓                        ↓
onSettled(data, error, variables, onMutateResult)  ← 常に呼ばれる
```

| コールバック | 引数 | タイミング |
|------------|------|----------|
| `onMutate` | `(variables, context)` | mutationFn 実行 **前** |
| `onSuccess` | `(data, variables, onMutateResult, context)` | 成功時 |
| `onError` | `(error, variables, onMutateResult, context)` | 失敗時 |
| `onSettled` | `(data, error, variables, onMutateResult, context)` | 成功でも失敗でも **常に** |

### その他

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `retry` | `boolean \| number \| (failureCount, error) => boolean` | `0` | リトライ回数（useQuery と違い、デフォルト 0） |
| `retryDelay` | `number \| (retryAttempt, error) => number` | — | リトライ間隔 |
| `gcTime` | `number` | `300000` | mutation 結果がメモリに残る時間 |
| `networkMode` | `'online' \| 'always' \| 'offlineFirst'` | `'online'` | ネットワーク状態の扱い |
| `throwOnError` | `boolean \| (error) => boolean` | `false` | Error Boundary にエラーを投げるか |
| `meta` | `Record<string, unknown>` | — | メタデータ |
| `scope` | `{ id: string }` | — | 同一スコープ内の mutation を直列化 |

---

## 返却値（UseMutationResult）一覧

### データ

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `data` | `TData \| undefined` | レスポンスデータ |
| `error` | `TError \| null` | エラーオブジェクト |
| `variables` | `TVariables \| undefined` | 実行時の引数 |

### ステータス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `status` | `'idle' \| 'pending' \| 'error' \| 'success'` | Mutation の状態 |
| `isIdle` | `boolean` | まだ実行されていない |
| `isPending` | `boolean` | 実行中 |
| `isSuccess` | `boolean` | 成功した |
| `isError` | `boolean` | 失敗した |
| `isPaused` | `boolean` | オフラインで一時停止中 |
| `failureCount` | `number` | 失敗回数 |
| `failureReason` | `TError \| null` | 失敗の理由 |
| `submittedAt` | `number` | mutate を呼んだ時刻 |

### メソッド

| メソッド | 型 | 説明 |
|---------|------|------|
| `mutate` | `(variables, options?) => void` | Mutation を実行（fire-and-forget） |
| `mutateAsync` | `(variables, options?) => Promise<TData>` | Mutation を実行（await 可能） |
| `reset` | `() => void` | 状態を `idle` にリセット |

---

## mutate と mutateAsync の使い分け

### mutate（推奨: フォーム送信）

```tsx
const { mutate } = useCreateUser()

const handleSubmit = () => {
  mutate(formData, {
    onSuccess: () => { navigate('/users') },
    onError: (error) => { showToast(error.message) },
  })
}
```

- **コールバックで後処理** する
- エラーをキャッチする必要がない（コールバックで処理）
- void を返すので await できない

### mutateAsync（直列処理が必要な場合）

```tsx
const { mutateAsync } = useCreateUser()

const handleBatchCreate = async () => {
  try {
    const user1 = await mutateAsync({ name: 'User 1', ... })
    const user2 = await mutateAsync({ name: 'User 2', ... })  // user1 の結果を使える
    console.log('両方作成完了:', user1, user2)
  } catch (error) {
    // try-catch でエラーハンドリング必須
  }
}
```

- Promise を返すので **await** できる
- 直列的な処理フローが必要な場合
- **try-catch でエラーハンドリングが必須**（しないと Unhandled Promise Rejection）

---

## 呼び出し時コールバック vs 定義時コールバック

`onSuccess` / `onError` / `onSettled` は **2箇所** で定義できます。

```ts
// 1. 定義時（useMutation のオプション）
const { mutate } = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // すべての mutate 呼び出しで実行される（キャッシュ無効化など共通処理向き）
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
  },
})

// 2. 呼び出し時（mutate のオプション）
mutate(data, {
  onSuccess: () => {
    // この呼び出し固有の処理（画面遷移、フォームリセットなど）
    navigate('/users')
  },
})
```

**実行順序:** 定義時 → 呼び出し時

**使い分け:**
- 定義時: 常に実行すべき処理（キャッシュ更新、ログ）
- 呼び出し時: 呼び出し元固有の処理（画面遷移、UI更新）

---

## 楽観的更新（Optimistic Update）パターン

ユーザーのアクションを即座にUIに反映し、API応答後に確定する高度なパターンです。

```ts
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: updateUser,

  // 1. mutation 実行前: UIを先に更新
  onMutate: async (updatedUser) => {
    // 進行中のフェッチをキャンセル（競合防止）
    await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(updatedUser.id) })

    // 現在のキャッシュを保存（ロールバック用）
    const previousUser = queryClient.getQueryData(queryKeys.users.detail(updatedUser.id))

    // キャッシュを楽観的に更新
    queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser)

    // ロールバック用データを返す → onError で受け取れる
    return { previousUser }
  },

  // 2. 失敗時: 元に戻す
  onError: (_error, updatedUser, context) => {
    if (context?.previousUser) {
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), context.previousUser)
    }
  },

  // 3. 常に: キャッシュを確実に最新にする
  onSettled: (_data, _error, updatedUser) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(updatedUser.id) })
  },
})
```

---

## 実践例: 本プロジェクトでの使用

```ts
// src/features/users/hooks/use-create-user.ts
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<CreateUserResponse, Error, CreateUserRequest>({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}
```

**設計判断:**
- `onSuccess` は定義時のみ → キャッシュ無効化は常に必要なため
- 画面遷移やフォームリセットは呼び出し時の `onSuccess` で行う
- `onError` は未定義 → エラー時はキャッシュに影響しない
