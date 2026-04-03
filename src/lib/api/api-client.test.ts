import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server.js'
import { ApiClient } from './api-client.js'
import { ApiError } from '@/types/api.js'

const client = new ApiClient('http://localhost')

describe('ApiClient', () => {
  describe('get', () => {
    it('GETリクエストでJSONを正しく返す', async () => {
      server.use(
        http.get('http://localhost/api/test', () => {
          return HttpResponse.json({ message: 'hello' })
        }),
      )

      const result = await client.get<{ message: string }>('/api/test')
      expect(result).toEqual({ message: 'hello' })
    })

    it('クエリパラメータを正しく送信する', async () => {
      server.use(
        http.get('http://localhost/api/test', ({ request }) => {
          const url = new URL(request.url)
          return HttpResponse.json({
            query: url.searchParams.get('q'),
            page: url.searchParams.get('page'),
          })
        }),
      )

      const result = await client.get<{ query: string; page: string }>(
        '/api/test',
        { q: 'hello', page: '2' },
      )
      expect(result).toEqual({ query: 'hello', page: '2' })
    })
  })

  describe('post', () => {
    it('POSTリクエストでボディを送信しJSONを返す', async () => {
      server.use(
        http.post('http://localhost/api/test', async ({ request }) => {
          const body = await request.json()
          return HttpResponse.json({ received: body }, { status: 201 })
        }),
      )

      const result = await client.post<{ received: unknown }>('/api/test', {
        name: 'test',
      })
      expect(result).toEqual({ received: { name: 'test' } })
    })
  })

  describe('エラーハンドリング', () => {
    it('404レスポンスでApiErrorをスローする', async () => {
      server.use(
        http.get('http://localhost/api/not-found', () => {
          return HttpResponse.json(
            { message: 'Not Found' },
            { status: 404 },
          )
        }),
      )

      await expect(client.get('/api/not-found')).rejects.toThrow(ApiError)
      try {
        await client.get('/api/not-found')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.status).toBe(404)
        expect(apiError.data).toEqual({ message: 'Not Found' })
      }
    })

    it('500レスポンスでApiErrorをスローする', async () => {
      server.use(
        http.get('http://localhost/api/error', () => {
          return HttpResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 },
          )
        }),
      )

      await expect(client.get('/api/error')).rejects.toThrow(ApiError)
      try {
        await client.get('/api/error')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(500)
      }
    })
  })

  describe('getBlob', () => {
    it('Blobデータを正しく返す', async () => {
      server.use(
        http.get('http://localhost/api/download', () => {
          return new HttpResponse('id,name\n1,test', {
            headers: { 'Content-Type': 'text/csv' },
          })
        }),
      )

      const blob = await client.getBlob('/api/download')
      expect(blob.size).toBeGreaterThan(0)
      const text = await blob.text()
      expect(text).toBe('id,name\n1,test')
    })

    it('getBlobでもエラー時はApiErrorをスローする', async () => {
      server.use(
        http.get('http://localhost/api/download-error', () => {
          return HttpResponse.json(
            { message: 'Server Error' },
            { status: 500 },
          )
        }),
      )

      await expect(client.getBlob('/api/download-error')).rejects.toThrow(
        ApiError,
      )
    })
  })
})
