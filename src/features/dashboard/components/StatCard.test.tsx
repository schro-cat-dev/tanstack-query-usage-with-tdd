import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard.js'

describe('StatCard', () => {
  it('タイトルと値が表示される', () => {
    render(<StatCard title="総ユーザー数" value={42} />)

    expect(screen.getByText('総ユーザー数')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('値が0でも正しく表示される', () => {
    render(<StatCard title="今日の新規" value={0} />)

    expect(screen.getByText('今日の新規')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('testId が設定される', () => {
    render(<StatCard title="テスト" value={5} testId="stat-test" />)

    expect(screen.getByTestId('stat-test')).toBeInTheDocument()
  })
})
