interface StatCardProps {
  title: string
  value: number
  testId?: string
}

export function StatCard({ title, value, testId }: StatCardProps) {
  return (
    <div className="stat-card" data-testid={testId}>
      <h3 className="stat-card__title">{title}</h3>
      <p className="stat-card__value">{value}</p>
    </div>
  )
}
