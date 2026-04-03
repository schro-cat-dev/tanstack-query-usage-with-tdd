import { useState } from 'react'
import { USER_ROLES } from '@/types/user.js'
import type { UserRole, UserSearchParams } from '@/types/user.js'

interface UserSearchFormProps {
  initialParams: UserSearchParams
  onSearch: (params: UserSearchParams) => void
}

export function UserSearchForm({ initialParams, onSearch }: UserSearchFormProps) {
  const [query, setQuery] = useState(initialParams.query ?? '')
  const [role, setRole] = useState<UserRole | ''>(initialParams.role ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({
      ...initialParams,
      query: query || undefined,
      role: role || undefined,
      page: 1, // 検索時は1ページ目に戻る
    })
  }

  const handleReset = () => {
    setQuery('')
    setRole('')
    onSearch({ page: 1, perPage: initialParams.perPage ?? 10 })
  }

  return (
    <form onSubmit={handleSubmit} role="search" aria-label="ユーザー検索">
      <div className="search-form">
        <label htmlFor="search-query">検索</label>
        <input
          id="search-query"
          type="text"
          placeholder="名前またはメールで検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <label htmlFor="search-role">ロール</label>
        <select
          id="search-role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole | '')}
        >
          <option value="">すべてのロール</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button type="submit">検索</button>
        <button type="button" onClick={handleReset}>
          リセット
        </button>
      </div>
    </form>
  )
}
