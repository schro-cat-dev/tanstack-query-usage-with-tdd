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
          <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
            <Link to="/" activeProps={{ style: { fontWeight: 'bold' } }}>
              Dashboard
            </Link>
            <Link to="/users" activeProps={{ style: { fontWeight: 'bold' } }}>
              Users
            </Link>
            <Link to="/users/create" activeProps={{ style: { fontWeight: 'bold' } }}>
              Create User
            </Link>
          </nav>
        </header>
        <main style={{ padding: '1rem' }}>
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  )
}

function NotFound() {
  return (
    <div>
      <h1>404 - ページが見つかりません</h1>
      <p>お探しのページは存在しません。</p>
      <Link to="/">ダッシュボードに戻る</Link>
    </div>
  )
}
