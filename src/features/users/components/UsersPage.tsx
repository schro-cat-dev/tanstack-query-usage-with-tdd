import { useState } from 'react'
import { useSearchUsers } from '../hooks/use-search-users.js'
import { UserSearchForm } from './UserSearchForm.js'
import { UserTable, Pagination } from './UserTable.js'
import type { User, UserSearchParams } from '@/types/user.js'

interface UsersPageProps {
  initialParams?: UserSearchParams
  onParamsChange?: (params: UserSearchParams) => void
}

export function UsersPage({ initialParams, onParamsChange }: UsersPageProps) {
  const [params, setParams] = useState<UserSearchParams>({
    page: 1,
    perPage: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialParams,
  })

  const { data, isLoading, isError, refetch } = useSearchUsers(params)

  const updateParams = (newParams: UserSearchParams) => {
    setParams(newParams)
    onParamsChange?.(newParams)
  }

  const handleSearch = (searchParams: UserSearchParams) => {
    updateParams({ ...params, ...searchParams, page: 1 })
  }

  const handleSort = (sortBy: keyof User) => {
    const newOrder =
      params.sortBy === sortBy && params.sortOrder === 'asc' ? 'desc' : 'asc'
    updateParams({ ...params, sortBy, sortOrder: newOrder })
  }

  const handlePageChange = (page: number) => {
    updateParams({ ...params, page })
  }

  if (isLoading) {
    return <div className="users-loading">読み込み中...</div>
  }

  if (isError) {
    return (
      <div className="users-error">
        <p>ユーザーデータの取得に失敗しました</p>
        <button onClick={() => refetch()}>リトライ</button>
      </div>
    )
  }

  return (
    <div className="users-page">
      <h1>ユーザー管理</h1>

      <UserSearchForm initialParams={params} onSearch={handleSearch} />

      {data && data.data.length === 0 ? (
        <p className="users-empty">ユーザーが見つかりませんでした</p>
      ) : data ? (
        <>
          <UserTable
            users={data.data}
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSort={handleSort}
          />
          <Pagination
            page={data.page}
            perPage={data.perPage}
            total={data.total}
            onPageChange={handlePageChange}
          />
        </>
      ) : null}
    </div>
  )
}
