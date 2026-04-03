import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserSearchForm } from './UserSearchForm.js'

describe('UserSearchForm', () => {
  const defaultProps = {
    initialParams: { page: 1, perPage: 10 },
    onSearch: vi.fn(),
  }

  it('検索入力欄とロールフィルタが表示される', () => {
    render(<UserSearchForm {...defaultProps} />)

    expect(screen.getByLabelText('検索')).toBeInTheDocument()
    expect(screen.getByLabelText('ロール')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument()
  })

  it('フォーム送信で検索パラメータがコールバックに渡される', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()

    render(
      <UserSearchForm
        initialParams={{ page: 1, perPage: 10 }}
        onSearch={onSearch}
      />,
    )

    await user.type(screen.getByLabelText('検索'), '田中')
    await user.click(screen.getByRole('button', { name: '検索' }))

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: '田中', page: 1 }),
    )
  })

  it('ロールフィルタの選択がコールバックに渡される', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()

    render(
      <UserSearchForm
        initialParams={{ page: 1, perPage: 10 }}
        onSearch={onSearch}
      />,
    )

    await user.selectOptions(screen.getByLabelText('ロール'), 'admin')
    await user.click(screen.getByRole('button', { name: '検索' }))

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin', page: 1 }),
    )
  })

  it('初期パラメータの値がフォームに反映される', () => {
    render(
      <UserSearchForm
        initialParams={{ query: '田中', role: 'editor', page: 1, perPage: 10 }}
        onSearch={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('検索')).toHaveValue('田中')
    expect(screen.getByLabelText('ロール')).toHaveValue('editor')
  })

  it('リセットボタンでフォームがクリアされ初期状態に戻る', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()

    render(
      <UserSearchForm
        initialParams={{ query: '田中', role: 'admin', page: 2, perPage: 10 }}
        onSearch={onSearch}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'リセット' }))

    expect(screen.getByLabelText('検索')).toHaveValue('')
    expect(screen.getByLabelText('ロール')).toHaveValue('')
    expect(onSearch).toHaveBeenCalledWith({ page: 1, perPage: 10 })
  })
})
