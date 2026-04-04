import { http, HttpResponse, delay } from 'msw'
import type { PaginatedResponse } from '@/types/api.js'
import type { User, CreateUserRequest, CreateUserResponse } from '@/types/user.js'
import { mockUsers } from '@/mocks/data/users.js'

export const userHandlers = [
  // 具体的なパスを先に定義

  // GET /api/users/export/csv - CSVエクスポート
  http.get('*/api/users/export/csv', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') ?? ''
    const role = url.searchParams.get('role') ?? ''

    let filtered = [...mockUsers]
    if (query) {
      const q = query.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    }
    if (role) {
      filtered = filtered.filter((u) => u.role === role)
    }

    const header = 'id,name,email,role,createdAt,updatedAt'
    const rows = filtered.map(
      (u) =>
        `${u.id},${u.name},${u.email},${u.role},${u.createdAt},${u.updatedAt}`,
    )
    const csv = [header, ...rows].join('\n')

    return new HttpResponse(csv, {
      headers: { 'Content-Type': 'text/csv' },
    })
  }),

  // GET /api/users - ユーザー一覧（検索・ページネーション対応）
  http.get('*/api/users', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') ?? ''
    const role = url.searchParams.get('role') ?? ''
    const page = Number(url.searchParams.get('page') ?? '1')
    const perPage = Number(url.searchParams.get('perPage') ?? '10')
    const sortBy = (url.searchParams.get('sortBy') ?? 'createdAt') as keyof User
    const sortOrder = url.searchParams.get('sortOrder') ?? 'desc'

    let filtered = [...mockUsers]

    if (query) {
      const q = query.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    }

    if (role) {
      filtered = filtered.filter((u) => u.role === role)
    }

    filtered.sort((a, b) => {
      const aVal = String(a[sortBy])
      const bVal = String(b[sortBy])
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    })

    const total = filtered.length
    const start = (page - 1) * perPage
    const data = filtered.slice(start, start + perPage)

    const response: PaginatedResponse<User> = { data, total, page, perPage }
    return HttpResponse.json(response)
  }),

  // POST /api/users - ユーザー作成
  http.post('*/api/users', async ({ request }) => {
    const body = (await request.json()) as CreateUserRequest

    const newUser: User = {
      id: String(mockUsers.length + 1),
      name: body.name,
      email: body.email,
      role: body.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response: CreateUserResponse = { user: newUser }
    return HttpResponse.json(response, { status: 201 })
  }),
]

/** エラー系ハンドラ（テストでserver.use()する用） */
export const userErrorHandlers = {
  listServerError: http.get('*/api/users', () => {
    return HttpResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    )
  }),
  createValidationError: http.post('*/api/users', () => {
    return HttpResponse.json(
      { message: 'Email already exists', field: 'email' },
      { status: 400 },
    )
  }),
  createServerError: http.post('*/api/users', () => {
    return HttpResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    )
  }),
  csvServerError: http.get('*/api/users/export/csv', () => {
    return HttpResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    )
  }),
  delayed: http.get('*/api/users', async () => {
    await delay(2000)
    return HttpResponse.json({
      data: mockUsers.slice(0, 10),
      total: mockUsers.length,
      page: 1,
      perPage: 10,
    })
  }),
}
