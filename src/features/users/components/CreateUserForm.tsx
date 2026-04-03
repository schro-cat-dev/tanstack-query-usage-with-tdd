import { useState } from 'react'
import { USER_ROLES } from '@/types/user.js'
import type { UserRole, CreateUserRequest } from '@/types/user.js'
import { useCreateUser } from '../hooks/use-create-user.js'
import { ApiError } from '@/types/api.js'

interface CreateUserFormProps {
  onSuccess?: () => void
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [emailError, setEmailError] = useState('')

  const { mutate, isPending, isSuccess, isError, error, reset } = useCreateUser()

  const isFormValid = name.trim() !== '' && email.trim() !== '' && !emailError

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value && !isValidEmail(value)) {
      setEmailError('有効なメールアドレスを入力してください')
    } else {
      setEmailError('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) return

    const data: CreateUserRequest = {
      name: name.trim(),
      email: email.trim(),
      role,
    }

    mutate(data, {
      onSuccess: () => {
        // フォームリセット
        setName('')
        setEmail('')
        setRole('viewer')
        setEmailError('')
        reset()
        onSuccess?.()
      },
    })
  }

  const getErrorMessage = (): string | null => {
    if (!isError || !error) return null

    if (error instanceof ApiError) {
      if (error.status === 400) {
        const data = error.data as { message?: string } | undefined
        return data?.message ?? 'バリデーションエラーが発生しました'
      }
      return 'サーバーエラーが発生しました'
    }

    return '予期しないエラーが発生しました'
  }

  const errorMessage = getErrorMessage()

  return (
    <form onSubmit={handleSubmit} aria-label="ユーザー作成フォーム">
      <h2>新規ユーザー作成</h2>

      {isSuccess && (
        <div role="status" className="success-message">
          ユーザーを作成しました
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="create-name">名前</label>
        <input
          id="create-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="create-email">メールアドレス</label>
        <input
          id="create-email"
          type="email"
          required
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError && (
          <span id="email-error" className="field-error" role="alert">
            {emailError}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="create-role">ロール</label>
        <select
          id="create-role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={!isFormValid || isPending}>
        {isPending ? '作成中...' : '作成'}
      </button>
    </form>
  )
}
