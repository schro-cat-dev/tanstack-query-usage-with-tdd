/**
 * HTTPクライアントのインターフェース
 * すべてのAPI通信はこのインターフェースを通じて行う
 */
export interface IApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  put<T>(path: string, body: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
  getBlob(path: string, params?: Record<string, string>): Promise<Blob>
}
