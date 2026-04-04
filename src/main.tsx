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

async function start() {
  // 開発環境ではMSWのブラウザワーカーを起動してAPIをモック
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser.js')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

start()
