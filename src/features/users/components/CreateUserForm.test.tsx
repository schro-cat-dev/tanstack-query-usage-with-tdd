import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '@/mocks/server.js'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers.js'
import { renderWithProviders } from '@/test/helpers/render.js'
import { CreateUserForm } from './CreateUserForm.js'

describe('CreateUserForm', () => {
  it('名前・メール・ロールの入力欄が表示される', () => {
    renderWithProviders(<CreateUserForm />)

    expect(screen.getByLabelText('名前')).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('ロール')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument()
  })

  it('フィールドが空の場合は送信ボタンが無効になる', () => {
    renderWithProviders(<CreateUserForm />)

    expect(screen.getByRole('button', { name: '作成' })).toBeDisabled()
  })

  it('有効なフォームデータで作成が成功する', async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<CreateUserForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('名前'), 'テストユーザー')
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.selectOptions(screen.getByLabelText('ロール'), 'editor')

    expect(screen.getByRole('button', { name: '作成' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '作成' }))

    // 成功メッセージが表示される
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('作成中はボタンテキストが「作成中...」になりdisabledになる', async () => {
    const { http, HttpResponse, delay } = await import('msw')
    server.use(
      http.post('*/api/users', async () => {
        await delay(1000)
        return HttpResponse.json(
          { user: { id: '99', name: 'test', email: 'test@example.com', role: 'viewer', createdAt: '', updatedAt: '' } },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<CreateUserForm />)

    await user.type(screen.getByLabelText('名前'), 'テスト')
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: '作成' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '作成中...' })).toBeDisabled()
    })
  })

  it('バリデーションエラー（メール重複）時にエラーメッセージが表示される', async () => {
    server.use(userErrorHandlers.createValidationError)

    const user = userEvent.setup()
    renderWithProviders(<CreateUserForm />)

    await user.type(screen.getByLabelText('名前'), 'テスト')
    await user.type(screen.getByLabelText('メールアドレス'), 'duplicate@example.com')
    await user.click(screen.getByRole('button', { name: '作成' }))

    expect(await screen.findByText('Email already exists')).toBeInTheDocument()
  })

  it('サーバーエラー時にエラーメッセージが表示される', async () => {
    server.use(userErrorHandlers.createServerError)

    const user = userEvent.setup()
    renderWithProviders(<CreateUserForm />)

    await user.type(screen.getByLabelText('名前'), 'テスト')
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: '作成' }))

    expect(await screen.findByText('サーバーエラーが発生しました')).toBeInTheDocument()
  })

  it('無効なメールアドレスでクライアント側バリデーションエラーが表示される', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserForm />)

    await user.type(screen.getByLabelText('名前'), 'テスト')
    await user.type(screen.getByLabelText('メールアドレス'), 'invalid-email')

    expect(
      screen.getByText('有効なメールアドレスを入力してください'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '作成' })).toBeDisabled()
  })

  it('成功後にフォームがリセットされる', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserForm />)

    await user.type(screen.getByLabelText('名前'), 'テストユーザー')
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.selectOptions(screen.getByLabelText('ロール'), 'editor')
    await user.click(screen.getByRole('button', { name: '作成' }))

    // フォームがリセットされるのを待つ
    await waitFor(() => {
      expect(screen.getByLabelText('名前')).toHaveValue('')
    })
    expect(screen.getByLabelText('メールアドレス')).toHaveValue('')
    expect(screen.getByLabelText('ロール')).toHaveValue('viewer')
  })
})
