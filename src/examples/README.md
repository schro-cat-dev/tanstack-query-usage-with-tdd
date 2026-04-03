# src/examples/ - TanStack Query 機能サンプル集

## このディレクトリは何？

TanStack Query v5 の各機能を **実際に動くコード + テスト** で示すサンプル集です。
各サンプルは独立しており、コピーして自分のプロジェクトに持ち込めます。

## サンプル一覧

| # | ファイル | 機能 | 学べること |
|---|---------|------|----------|
| 1 | `01-query-options-typed/` | queryOptions + DataTag | useQuery と ensureQueryData で型を共有する方法 |
| 2 | `02-enabled-and-skip-token/` | enabled / skipToken | 条件付きクエリの2つの書き方と型安全性の違い |
| 3 | `03-select-transform/` | select オプション | レスポンスを変換して必要な部分だけ取得 |
| 4 | `04-polling-refetch-interval/` | refetchInterval | リアルタイム更新のポーリング実装 |
| 5 | `05-parallel-queries/` | useQueries | 複数クエリの並列実行と結合 |
| 6 | `06-dependent-queries/` | 依存クエリ | クエリAの結果を使ってクエリBを実行 |
| 7 | `07-optimistic-update/` | onMutate | 楽観的更新（UIを先に更新し、失敗時にロールバック） |
| 8 | `08-global-loading/` | useIsFetching / useIsMutating | グローバルなローディング・保存中インジケータ |
| 9 | `09-infinite-query/` | useInfiniteQuery | 「もっと見る」型の無限スクロール |
| 10 | `10-suspense-query/` | useSuspenseQuery | React Suspense との統合 |

## テストの実行

```bash
# 全サンプルのテスト
npx vitest run src/examples/

# 特定のサンプルだけ
npx vitest run src/examples/01-query-options-typed/
```
