import type { UserSearchParams } from '@/types/user.js'

/**
 * Query Key Factory
 * TanStack Query のキャッシュキーを一元管理する
 * マジックストリングの排除と、Hook/Router間のキー不整合を防ぐ
 */
export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: UserSearchParams) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
} as const
