# TanStack Query v5 完全ガイド

本ドキュメント群は、TanStack Query v5 の **型定義の内部解析**、**実践的な使い方**、**責務設計**、**React Hooks との連携**、**クライアントサイドの挙動と注意点** を体系的にまとめたものです。

完全初心者から中上級者まで、このディレクトリだけで TanStack Query を理解・活用できることを目指しています。

---

## ドキュメント一覧

### 基礎・型定義リファレンス

| # | ファイル | 内容 |
|---|---------|------|
| 1 | [01-usequery-reference.md](./01-usequery-reference.md) | **useQuery 完全リファレンス** — 全オプション・全返却値・型シグネチャを公式型定義から解析 |
| 2 | [02-usemutation-reference.md](./02-usemutation-reference.md) | **useMutation 完全リファレンス** — Mutation のライフサイクル・コールバック・型定義 |
| 3 | [03-queryclient-reference.md](./03-queryclient-reference.md) | **QueryClient 完全リファレンス** — 全メソッド・キャッシュ操作・設定API |
| 4 | [04-types-catalog.md](./04-types-catalog.md) | **型カタログ** — QueryKey, QueryStatus, FetchStatus 等の全型定義一覧 |
| 5 | [05-other-hooks-reference.md](./05-other-hooks-reference.md) | **その他の Hook リファレンス** — useInfiniteQuery, useSuspenseQuery, useQueries, useIsFetching 等 |

### 実践ガイド

| # | ファイル | 内容 |
|---|---------|------|
| 6 | [06-practical-patterns.md](./06-practical-patterns.md) | **実践パターン集** — queryOptions, Query Key Factory, Service層連携, キャッシュ設計 |
| 7 | [07-cache-behavior.md](./07-cache-behavior.md) | **キャッシュ挙動の完全解説** — staleTime/gcTime, 自動refetch, invalidation, データが「勝手に更新されない」理由と対策 |
| 8 | [08-react-hooks-integration.md](./08-react-hooks-integration.md) | **React Hooks との連携** — useState/useEffect/useMemo/useCallback/useTransition との組み合わせ方 |
| 9 | [09-responsibility-design.md](./09-responsibility-design.md) | **責務設計ガイド** — どのレイヤーに何を持たせるか、Service/Hook/Component の境界線 |
| 10 | [10-concurrent-and-pitfalls.md](./10-concurrent-and-pitfalls.md) | **並行処理・注意点・落とし穴** — 並行リクエスト, レースコンディション, メモリリーク, よくあるバグ |

---

## どこから読むべき？

### 「TanStack Query を初めて使う」

1. [06-practical-patterns.md](./06-practical-patterns.md) — まず実践パターンで全体像を掴む
2. [01-usequery-reference.md](./01-usequery-reference.md) — useQuery の詳細を理解する
3. [07-cache-behavior.md](./07-cache-behavior.md) — キャッシュの動きを知る

### 「React は書けるが、データフェッチの設計に悩んでいる」

1. [09-responsibility-design.md](./09-responsibility-design.md) — 責務設計の指針
2. [06-practical-patterns.md](./06-practical-patterns.md) — 具体的なパターン
3. [08-react-hooks-integration.md](./08-react-hooks-integration.md) — React Hooks との使い分け

### 「キャッシュや再取得の挙動がわからない / バグが出る」

1. [07-cache-behavior.md](./07-cache-behavior.md) — キャッシュの仕組みを完全理解
2. [10-concurrent-and-pitfalls.md](./10-concurrent-and-pitfalls.md) — 落とし穴と回避法

### 「型定義を正確に知りたい / APIリファレンスが欲しい」

1. [04-types-catalog.md](./04-types-catalog.md) — 型の全カタログ
2. [01-usequery-reference.md](./01-usequery-reference.md) / [02-usemutation-reference.md](./02-usemutation-reference.md) — Hook ごとの詳細

---

## 本プロジェクトでの実装例との対応

| ドキュメントのトピック | 本プロジェクトの実装ファイル |
|---------------------|--------------------------|
| useQuery 基本形 | `src/features/dashboard/hooks/use-get-dashboard-stats.ts` |
| queryOptions + useQuery | `src/features/users/hooks/use-search-users.ts` |
| keepPreviousData | `src/features/users/hooks/use-search-users.ts` |
| useMutation + invalidateQueries | `src/features/users/hooks/use-create-user.ts` |
| ensureQueryData (Router Loader) | `src/routes/index.tsx`, `src/routes/users/index.tsx` |
| Query Key Factory | `src/lib/query-keys.ts` |
| QueryClient 設定 | `src/lib/query-client.ts` |
| テスト用 QueryClient | `src/test/helpers/create-query-client.ts` |
| キャッシュに乗せない設計 | `src/features/users/hooks/use-download-users-csv.ts` |

---

## バージョン情報

| パッケージ | バージョン |
|-----------|-----------|
| `@tanstack/react-query` | v5.96.2 |
| `@tanstack/query-core` | v5 (react-query に内包) |
| React | v19.2.4 |
| TypeScript | v5.9.3 (strict mode) |
