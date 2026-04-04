import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { WeeklyEntry } from '@/types/dashboard.js'

interface WeeklyChartProps {
  data: WeeklyEntry[]
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
        <XAxis dataKey="week" tick={{ fontSize: 13 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
        <Tooltip
          contentStyle={{
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: '6px',
          }}
        />
        <Bar dataKey="count" name="新規ユーザー" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
