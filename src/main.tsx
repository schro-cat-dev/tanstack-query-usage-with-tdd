import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen.js'
import { queryClient } from './lib/query-client.js'
import './index.css'

const router = createRouter({
  routeTree,
  context: { queryClient },
})

// TanStack Routerの型安全性を有効化
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
