import type { PaginatedResponse } from '@/types/api.js'
import type {
  User,
  UserSearchParams,
  CreateUserRequest,
  CreateUserResponse,
} from '@/types/user.js'
import type { IApiClient } from '@/lib/api/interfaces.js'
import type { IUserService } from './user.service.interface.js'

/**
 * ユーザーサービス
 * IApiClient を注入することで、テスト時にモックAPIクライアントに差し替え可能
 */
export class UserService implements IUserService {
  #apiClient: IApiClient

  constructor(apiClient: IApiClient) {
    this.#apiClient = apiClient
  }

  async searchUsers(params: UserSearchParams): Promise<PaginatedResponse<User>> {
    const queryParams: Record<string, string> = {}

    if (params.query) queryParams.query = params.query
    if (params.role) queryParams.role = params.role
    if (params.page !== undefined) queryParams.page = String(params.page)
    if (params.perPage !== undefined) queryParams.perPage = String(params.perPage)
    if (params.sortBy) queryParams.sortBy = params.sortBy
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder

    return this.#apiClient.get<PaginatedResponse<User>>('/api/users', queryParams)
  }

  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    return this.#apiClient.post<CreateUserResponse>('/api/users', data)
  }

  async downloadUsersCsv(
    params?: Pick<UserSearchParams, 'query' | 'role'>,
  ): Promise<Blob> {
    const queryParams: Record<string, string> = {}
    if (params?.query) queryParams.query = params.query
    if (params?.role) queryParams.role = params.role

    return this.#apiClient.getBlob('/api/users/export/csv', queryParams)
  }
}
