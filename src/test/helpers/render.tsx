import { type ReactElement } from 'react'
import { render, renderHook, type RenderOptions } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from './create-query-client.js'

/**
 * QueryClientProvider 込みのカスタム render
 * テストごとに新しい QueryClient を生成し、キャッシュの干渉を防ぐ
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}

/**
 * QueryClientProvider 込みのカスタム renderHook
 * カスタムフック（useQuery/useMutation ラッパー）のテストに使用
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: { initialProps?: TProps },
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return {
    ...renderHook(hook, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}
