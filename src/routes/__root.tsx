import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client.js'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <header>
          <nav>
            <a href="/">Dashboard</a>
            <a href="/users">Users</a>
          </nav>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  )
}
