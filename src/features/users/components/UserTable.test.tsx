import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserTable, Pagination } from './UserTable.js'
import { mockUsers } from '@/mocks/data/users.js'

describe('UserTable', () => {
  const defaultProps = {
    users: mockUsers.slice(0, 3),
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    onSort: vi.fn(),
  }

  it('ユーザーデータがテーブルに表示される', () => {
    render(<UserTable {...defaultProps} />)

    expect(screen.getByText('田中太郎')).toBeInTheDocument()
    expect(screen.getByText('tanaka@example.com')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('テーブルヘッダーをクリックするとソートコールバックが呼ばれる', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()

    render(<UserTable {...defaultProps} onSort={onSort} />)

    await user.click(screen.getByText('名前'))
    expect(onSort).toHaveBeenCalledWith('name')
  })

  it('現在のソート列にソートインジケータが表示される', () => {
    render(<UserTable {...defaultProps} sortBy="name" sortOrder="asc" />)

    expect(screen.getByText(/名前.*↑/)).toBeInTheDocument()
  })

  it('すべてのユーザー行が正しくレンダリングされる', () => {
    render(<UserTable {...defaultProps} />)

    const rows = screen.getAllByRole('row')
    // ヘッダー行 + データ行3行
    expect(rows).toHaveLength(4)
  })
})

describe('Pagination', () => {
  it('現在ページとトータルが表示される', () => {
    render(
      <Pagination page={1} perPage={10} total={25} onPageChange={vi.fn()} />,
    )

    expect(screen.getByText('1 / 3 ページ（全 25 件）')).toBeInTheDocument()
  })

  it('最初のページでは「前へ」が無効になる', () => {
    render(
      <Pagination page={1} perPage={10} total={25} onPageChange={vi.fn()} />,
    )

    expect(screen.getByLabelText('前のページ')).toBeDisabled()
  })

  it('最後のページでは「次へ」が無効になる', () => {
    render(
      <Pagination page={3} perPage={10} total={25} onPageChange={vi.fn()} />,
    )

    expect(screen.getByLabelText('次のページ')).toBeDisabled()
  })

  it('「次へ」クリックでページ変更コールバックが呼ばれる', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Pagination page={1} perPage={10} total={25} onPageChange={onPageChange} />,
    )

    await user.click(screen.getByLabelText('次のページ'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('「前へ」クリックでページ変更コールバックが呼ばれる', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Pagination page={2} perPage={10} total={25} onPageChange={onPageChange} />,
    )

    await user.click(screen.getByLabelText('前のページ'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })
})
