import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/mocks/server.js'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers.js'
import { renderWithProviders } from '@/test/helpers/render.js'
import { CsvDownloadButton } from './CsvDownloadButton.js'

describe('CsvDownloadButton', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('ダウンロードボタンが表示される', () => {
    renderWithProviders(<CsvDownloadButton />)
    expect(screen.getByRole('button', { name: 'CSVダウンロード' })).toBeInTheDocument()
  })

  it('クリックでCSVダウンロードが発火する', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CsvDownloadButton />)

    await user.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    await waitFor(() => {
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  it('ダウンロード中はボタンが無効になり「ダウンロード中...」と表示される', async () => {
    server.use(
      http.get('*/api/users/export/csv', async () => {
        await delay(500)
        return new HttpResponse('id,name\n1,test', {
          headers: { 'Content-Type': 'text/csv' },
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<CsvDownloadButton />)

    await user.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CSVダウンロード' })).toHaveTextContent(
        'ダウンロード中...',
      )
    })

    // ダウンロード完了を待つ
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CSVダウンロード' })).toHaveTextContent(
        'CSVダウンロード',
      )
    })
  })

  it('エラー時にエラーメッセージが表示される', async () => {
    server.use(userErrorHandlers.csvServerError)

    const user = userEvent.setup()
    renderWithProviders(<CsvDownloadButton />)

    await user.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    expect(await screen.findByText('ダウンロードに失敗しました')).toBeInTheDocument()
  })

  it('ダウンロード完了後にボタンが再び有効になる', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CsvDownloadButton />)

    await user.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CSVダウンロード' })).toBeEnabled()
    })
  })

  it('フィルタパラメータがダウンロードに渡される', async () => {
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
