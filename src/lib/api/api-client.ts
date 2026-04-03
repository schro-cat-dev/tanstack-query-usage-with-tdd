import { ApiError } from '@/types/api.js'
import type { IApiClient } from './interfaces.js'

/**
 * 汎用HTTPクライアントクラス
 * fetchをラップし、JSON自動パース、エラーハンドリングを提供する
 */
export class ApiClient implements IApiClient {
  #baseUrl: string

  constructor(baseUrl: string) {
    this.#baseUrl = baseUrl
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = this.#buildUrl(path, params)
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    return this.#handleResponse<T>(response)
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = this.#buildUrl(path)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return this.#handleResponse<T>(response)
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const url = this.#buildUrl(path)
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return this.#handleResponse<T>(response)
  }

  async delete<T>(path: string): Promise<T> {
    const url = this.#buildUrl(path)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    return this.#handleResponse<T>(response)
  }

  async getBlob(path: string, params?: Record<string, string>): Promise<Blob> {
    const url = this.#buildUrl(path, params)
    const response = await fetch(url, { method: 'GET' })

    if (!response.ok) {
      const data = await response.json().catch(() => undefined)
      throw new ApiError(response.status, response.statusText, data)
    }

    return response.blob()
  }

  #buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, this.#baseUrl)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value)
        }
      }
    }
    return url.toString()
  }

  async #handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const data = await response.json().catch(() => undefined)
      throw new ApiError(response.status, response.statusText, data)
    }
    return response.json() as Promise<T>
  }
}

/** デフォルトのAPIクライアントインスタンス */
export const apiClient = new ApiClient(window.location.origin)
