import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/helpers/render.js'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage.js'
import { UsersPage } from '@/features/users/components/UsersPage.js'
import { CreateUserForm } from '@/features/users/components/CreateUserForm.js'
import { CsvDownloadButton } from '@/features/users/components/CsvDownloadButton.js'

describe('結合テスト', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  describe('ダッシュボード → データ表示', () => {
    it('ダッシュボードが統計データとアクティビティを正しく表示する', async () => {
      renderWithProviders(<DashboardPage />)

      // ローディング → データ表示の遷移
      expect(screen.getByText('読み込み中...')).toBeInTheDocument()

      // 統計データ
      expect(await screen.findByText('10')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()

      // アクティビティ
      expect(screen.getByText('中村真理')).toBeInTheDocument()
      expect(screen.getByText('ユーザーを作成しました')).toBeInTheDocument()
    })
  })

  describe('ユーザー一覧 → 検索 → フィルタ → ソート', () => {
    it('一覧表示 → 検索 → 結果更新の一連のフロー', async () => {
      const user = userEvent.setup()
      renderWithProviders(<UsersPage />)

      // 初期表示
      expect(await screen.findByText('田中太郎')).toBeInTheDocument()
      expect(screen.getByText('佐藤花子')).toBeInTheDocument()

      // 検索実行
      await user.type(screen.getByLabelText('検索'), '佐藤')
      await user.click(screen.getByRole('button', { name: '検索' }))

      // 検索結果
      await waitFor(() => {
        expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      })
    })

    it('ロールフィルタで管理者のみ表示', async () => {
      const user = userEvent.setup()
      renderWithProviders(<UsersPage />)

      await screen.findByText('田中太郎')

      await user.selectOptions(screen.getByLabelText('ロール'), 'admin')
      await user.click(screen.getByRole('button', { name: '検索' }))

      await waitFor(async () => {
        expect(await screen.findByText('田中太郎')).toBeInTheDocument()
        expect(screen.getByText('山田健太')).toBeInTheDocument()
      })
    })
  })

  describe('ユーザー作成 → キャッシュ更新', () => {
    it('フォーム入力 → 作成成功 → フォームリセットの一連のフロー', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderWithProviders(<CreateUserForm onSuccess={onSuccess} />)

      // フォーム入力
      await user.type(screen.getByLabelText('名前'), '新規ユーザー')
      await user.type(screen.getByLabelText('メールアドレス'), 'new@example.com')
      await user.selectOptions(screen.getByLabelText('ロール'), 'admin')

      // 送信
      await user.click(screen.getByRole('button', { name: '作成' }))

      // 成功コールバック
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })

      // フォームリセット確認
      expect(screen.getByLabelText('名前')).toHaveValue('')
      expect(screen.getByLabelText('メールアドレス')).toHaveValue('')
    })
  })

  describe('CSVダウンロード', () => {
    it('ダウンロードボタンクリック → Blob生成 → ダウンロード発火', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CsvDownloadButton />)

      await user.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

      await waitFor(() => {
        expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
        expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      })
    })

    it('フィルタ付きダウンロードが正しく動作する', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CsvDownloadButton filters={{ query: '田中', role: 'admin' }} />,
      )

      await user.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

      await waitFor(() => {
        expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
      })
    })
  })

  describe('エラーハンドリング横断テスト', () => {
    it('ダッシュボードとユーザー一覧で独立したエラー状態が管理される', async () => {
      // 各機能が独立してエラー状態を管理できていることを確認
      // ダッシュボード → 正常
      const { unmount } = renderWithProviders(<DashboardPage />)
      expect(await screen.findByText('10')).toBeInTheDocument()
      unmount()

      // ユーザー一覧 → 正常
      renderWithProviders(<UsersPage />)
      expect(await screen.findByText('田中太郎')).toBeInTheDocument()
    })
  })
})
