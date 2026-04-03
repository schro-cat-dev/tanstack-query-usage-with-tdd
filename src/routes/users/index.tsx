import { createFileRoute } from '@tanstack/react-router'
import { searchUsersQueryOptions } from '@/features/users/hooks/use-search-users.js'
import { UsersPage } from '@/features/users/components/UsersPage.js'
import type { UserRole, UserSearchParams } from '@/types/user.js'

export const Route = createFileRoute('/users/')({
  validateSearch: (search: Record<string, unknown>): UserSearchParams => ({
    query: (search.query as string) || undefined,
    role: (search.role as UserRole) || undefined,
    page: Number(search.page) || 1,
    perPage: Number(search.perPage) || 10,
    sortBy: (search.sortBy as keyof import('@/types/user.js').User) || 'createdAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') || 'desc',
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(searchUsersQueryOptions(deps)),
  component: UsersRouteComponent,
})

function UsersRouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <UsersPage
      initialParams={search}
      onParamsChange={(params) => {
        navigate({ search: params })
      }}
    />
  )
}
