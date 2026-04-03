import type { User } from '@/types/user.js'

interface UserTableProps {
  users: User[]
  sortBy?: keyof User
  sortOrder?: 'asc' | 'desc'
  onSort: (sortBy: keyof User) => void
}

const COLUMNS: { key: keyof User; label: string }[] = [
  { key: 'name', label: '名前' },
  { key: 'email', label: 'メール' },
  { key: 'role', label: 'ロール' },
  { key: 'createdAt', label: '作成日' },
]

export function UserTable({ users, sortBy, sortOrder, onSort }: UserTableProps) {
  const getSortIndicator = (key: keyof User) => {
    if (sortBy !== key) return ''
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <table className="user-table" role="table">
      <thead>
        <tr>
          {COLUMNS.map((col) => (
            <th
              key={col.key}
              onClick={() => onSort(col.key)}
              style={{ cursor: 'pointer' }}
              role="columnheader"
            >
              {col.label}{getSortIndicator(col.key)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{new Date(user.createdAt).toLocaleDateString('ja-JP')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface PaginationProps {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, perPage, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <nav className="pagination" aria-label="ページネーション">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="前のページ"
      >
        前へ
      </button>
      <span>
        {page} / {totalPages} ページ（全 {total} 件）
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="次のページ"
      >
        次へ
      </button>
    </nav>
  )
}
