import { useGetDashboardStats } from '../hooks/use-get-dashboard-stats.js'
import { StatCard } from './StatCard.js'
import { RoleChart } from './RoleChart.js'
import { WeeklyChart } from './WeeklyChart.js'

export function DashboardPage() {
  const { stats, recentActivity, isLoading, isError, refetch } = useGetDashboardStats()

  if (isLoading) {
    return <div className="dashboard-loading">読み込み中...</div>
  }

  if (isError) {
    return (
      <div className="dashboard-error">
        <p>データの取得に失敗しました</p>
        <button onClick={() => refetch()}>リトライ</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <h1>ダッシュボード</h1>

      {stats && (
        <>
          <section className="dashboard__stats">
            <StatCard title="総ユーザー数" value={stats.totalUsers} testId="stat-total-users" />
            <StatCard title="アクティブユーザー" value={stats.activeUsers} testId="stat-active-users" />
            <StatCard title="今日の新規" value={stats.newUsersToday} testId="stat-new-today" />
            <StatCard title="今週の新規" value={stats.newUsersThisWeek} testId="stat-new-week" />
          </section>

          <section className="dashboard__charts">
            <div className="chart-card">
              <h2>ロール別ユーザー数</h2>
              <RoleChart data={stats.roleBreakdown} />
            </div>
            <div className="chart-card">
              <h2>週別新規ユーザー推移</h2>
              <WeeklyChart data={stats.weeklyNewUsers} />
            </div>
          </section>
        </>
      )}

      <section className="dashboard__activity">
        <h2>最近のアクティビティ</h2>
        {!recentActivity || recentActivity.length === 0 ? (
          <p>最近のアクティビティはありません</p>
        ) : (
          <ul>
            {recentActivity.map((entry) => (
              <li key={entry.id}>
                <span className="activity__user">{entry.userName}</span>
                <span className="activity__action">{entry.action}</span>
                <time className="activity__time">{entry.timestamp}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
