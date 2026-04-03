import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { server } from '@/mocks/server.js'
import { userErrorHandlers } from '@/mocks/handlers/user.handlers.js'
import { renderHookWithProviders } from '@/test/helpers/render.js'
import { useDownloadUsersCsv } from './use-download-users-csv.js'

describe('useDownloadUsersCsv', () => {
  // URL.createObjectURL / revokeObjectURL のモック
  let createObjectURLMock: ReturnType<typeof vi.fn>
  let revokeObjectURLMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url')
    revokeObjectURLMock = vi.fn()
    globalThis.URL.createObjectURL = createObjectURLMock as typeof URL.createObjectURL
    globalThis.URL.revokeObjectURL = revokeObjectURLMock as typeof URL.revokeObjectURL
  })

  it('初期状態はidleである', () => {
    const { result } = renderHookWithProviders(() => useDownloadUsersCsv())

    expect(result.current.isDownloading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('CSVダウンロードが成功する', async () => {
    const { result } = renderHookWithProviders(() => useDownloadUsersCsv())

    await act(async () => {
      await result.current.download()
    })

    // createObjectURL が呼ばれたことを確認
    expect(createObjectURLMock).toHaveBeenCalled()
    // ダウンロード完了後はidle状態に戻る
    expect(result.current.isDownloading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('フィルタパラメータを渡してCSVをダウンロードできる', async () => {
    const { result } = renderHookWithProviders(() => useDownloadUsersCsv())

    await act(async () => {
      await result.current.download({ query: '田中' })
    })

    expect(createObjectURLMock).toHaveBeenCalled()
  })

  it('サーバーエラー時にエラー状態になる', async () => {
    server.use(userErrorHandlers.csvServerError)

    const { result } = renderHookWithProviders(() => useDownloadUsersCsv())

    await act(async () => {
      await result.current.download()
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.error).not.toBeNull()
    expect(result.current.isDownloading).toBe(false)
  })

  it('TanStack Query キャッシュを使用しない（ステートレスなダウンロード）', async () => {
    const { result, queryClient } = renderHookWithProviders(() =>
      useDownloadUsersCsv(),
    )

    await act(async () => {
      await result.current.download()
    })

    // QueryClient にCSV関連のキャッシュが一切存在しないことを確認
    const allQueries = queryClient.getQueryCache().getAll()
    const csvQueries = allQueries.filter((q) =>
      q.queryKey.some((k) => typeof k === 'string' && k.includes('csv')),
    )
    expect(csvQueries).toHaveLength(0)
  })

  it('ダウンロード後にcreateObjectURLで生成したURLがrevokeされる', async () => {
    const { result } = renderHookWithProviders(() => useDownloadUsersCsv())

    await act(async () => {
      await result.current.download()
    })

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url')
  })
})
