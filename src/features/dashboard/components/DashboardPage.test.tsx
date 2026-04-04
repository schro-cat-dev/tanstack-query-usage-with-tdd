import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server.js'
import { dashboardErrorHandlers } from '@/mocks/handlers/dashboard.handlers.js'
import { renderWithProviders } from '@/test/helpers/render.js'
import { DashboardPage } from './DashboardPage.js'

describe('DashboardPage', () => {
  it('データ取得中はローディング表示される', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('統計カードに正しい値が表示される', async () => {
    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('10')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('最近のアクティビティが表示される', async () => {
    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('中村真理')).toBeInTheDocument()
    expect(screen.getByText('田中太郎')).toBeInTheDocument()
    expect(screen.getByText('佐藤花子')).toBeInTheDocument()
  })

  it('APIエラー時にエラーメッセージが表示される', async () => {
    server.use(dashboardErrorHandlers.statsError)
    server.use(dashboardErrorHandlers.activityError)

    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('データの取得に失敗しました')).toBeInTheDocument()
  })

  it('エラー時にリトライボタンが表示され、クリックで再取得する', async () => {
    server.use(dashboardErrorHandlers.statsError)
    server.use(dashboardErrorHandlers.activityError)
    const user = userEvent.setup()

    renderWithProviders(<DashboardPage />)

    const retryButton = await screen.findByRole('button', { name: 'リトライ' })
    expect(retryButton).toBeInTheDocument()

    server.resetHandlers()
    await user.click(retryButton)

    expect(await screen.findByText('10')).toBeInTheDocument()
  })

  it('アクティビティが空の場合は空メッセージが表示される', async () => {
    server.use(
      http.get('*/api/dashboard/stats', () => {
        return HttpResponse.json({
          totalUsers: 0, activeUsers: 0, newUsersToday: 0, newUsersThisWeek: 0,
          roleBreakdown: [], weeklyNewUsers: [],
        })
      }),
      http.get('*/api/dashboard/activity', () => {
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('最近のアクティビティはありません')).toBeInTheDocument()
  })
})
