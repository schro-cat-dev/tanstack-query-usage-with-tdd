import { useGetDashboardStats } from '../hooks/use-get-dashboard-stats.js'
import { StatCard } from './StatCard.js'

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboardStats()

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

  if (!data) return null

  return (
    <div className="dashboard">
      <h1>ダッシュボード</h1>

      <section className="dashboard__stats">
        <StatCard
          title="総ユーザー数"
          value={data.stats.totalUsers}
          testId="stat-total-users"
        />
        <StatCard
          title="アクティブユーザー"
          value={data.stats.activeUsers}
          testId="stat-active-users"
        />
        <StatCard
          title="今日の新規ユーザー"
          value={data.stats.newUsersToday}
          testId="stat-new-today"
        />
        <StatCard
          title="今週の新規ユーザー"
          value={data.stats.newUsersThisWeek}
          testId="stat-new-week"
        />
      </section>

      <section className="dashboard__activity">
        <h2>最近のアクティビティ</h2>
        {data.recentActivity.length === 0 ? (
          <p>最近のアクティビティはありません</p>
        ) : (
          <ul>
            {data.recentActivity.map((entry) => (
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
