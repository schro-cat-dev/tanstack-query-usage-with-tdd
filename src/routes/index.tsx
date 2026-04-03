import { createFileRoute } from '@tanstack/react-router'
import { getDashboardQueryOptions } from '@/features/dashboard/hooks/use-get-dashboard-stats.js'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage.js'

export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getDashboardQueryOptions()),
  component: DashboardPage,
})
