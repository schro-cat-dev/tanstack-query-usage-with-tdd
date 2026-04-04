import { createRootRouteWithContext, Outlet, Link } from '@tanstack/react-router'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client.js'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <header>
          <nav>
            <Link to="/" activeOptions={{ exact: true }}>
              Dashboard
            </Link>
            <Link to="/users" activeOptions={{ exact: true }}>
              Users
            </Link>
            <Link to="/users/create">
              + Create User
            </Link>
          </nav>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  )
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <h1>404</h1>
      <p style={{ color: 'var(--c-text-sub)', marginBottom: '24px' }}>
        お探しのページは存在しません
      </p>
      <Link to="/">ダッシュボードに戻る</Link>
    </div>
  )
}
