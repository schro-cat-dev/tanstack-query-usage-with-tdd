import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '@/mocks/server.js'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers.js'
import { renderWithProviders } from '@/test/helpers/render.js'
import { UsersPage } from './UsersPage.js'

describe('UsersPage', () => {
  it('データ取得中はローディングが表示される', () => {
    renderWithProviders(<UsersPage />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('ユーザーテーブルにデータが表示される', async () => {
    renderWithProviders(<UsersPage />)

    expect(await screen.findByText('田中太郎')).toBeInTheDocument()
    expect(screen.getByText('tanaka@example.com')).toBeInTheDocument()
  })

  it('検索フォームが表示される', async () => {
    renderWithProviders(<UsersPage />)

    await screen.findByText('田中太郎')
    expect(screen.getByRole('search', { name: 'ユーザー検索' })).toBeInTheDocument()
  })

  it('検索によりフィルタリングされた結果が表示される', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)

    await screen.findByText('田中太郎')

    await user.type(screen.getByLabelText('検索'), '佐藤')
    await user.click(screen.getByRole('button', { name: '検索' }))

    expect(await screen.findByText('佐藤花子')).toBeInTheDocument()
  })

  it('APIエラー時にエラーメッセージとリトライボタンが表示される', async () => {
    server.use(userErrorHandlers.listServerError)

    renderWithProviders(<UsersPage />)

    expect(await screen.findByText('ユーザーデータの取得に失敗しました')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'リトライ' })).toBeInTheDocument()
  })

  it('検索結果が0件の場合に空メッセージが表示される', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)

    await screen.findByText('田中太郎')

    await user.type(screen.getByLabelText('検索'), '存在しないユーザー名')
    await user.click(screen.getByRole('button', { name: '検索' }))

    expect(await screen.findByText('ユーザーが見つかりませんでした')).toBeInTheDocument()
  })

  it('ページネーションが表示される', async () => {
    renderWithProviders(<UsersPage />)

    await screen.findByText('田中太郎')
    expect(screen.getByLabelText('ページネーション')).toBeInTheDocument()
  })
})
