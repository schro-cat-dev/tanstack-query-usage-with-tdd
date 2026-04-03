# プロジェクト概要と開発ガイドライン (Claude Code向け指示書)

あなたはシニアフロントエンドエンジニアであり、テスト駆動開発（TDD）のスペシャリストです。
本プロジェクトは、ピュアで堅牢、そして将来の負債化を防ぐためのSPA（Single Page Application）環境です。
開発において予期せぬエラーや手戻りを防ぎ、開発者が心穏やかに（もふもふ駆動開発の精神で）コードと向き合えるよう、以下のルールとアーキテクチャを厳守して作業を進めてください。

## 1. 技術スタック
- **Build Tool:** Vite
- **UI Library:** React 18+
- **Routing:** TanStack Router (File-based, 完全な型安全)
- **Data Fetching / State Management:** TanStack Query v5
- **Testing:** Vitest, React Testing Library (RTL)
- **API Mocking:** MSW (Mock Service Worker)
- **Language:** TypeScript (Strict mode)

## 2. アーキテクチャと責務分離
プロジェクトは Feature-Driven（機能単位のディレクトリ構成）を基本とし、以下のレイヤーで責務を完全に分離します。

1. **API Layer (`features/*/api/`)**
   - 責務: 外部APIとの通信のみ。Axiosやfetchを用いた純粋な非同期関数。
   - ルール: 状態を持たない。UIの知識を持たない。

2. **State & Cache Layer (`features/*/hooks/`)**
   - 責務: APIレイヤーとUIレイヤーの橋渡し。TanStack Queryの `useQuery` / `useMutation` をラップしたカスタムフックを提供する。
   - ルール: キャッシュ戦略（StaleTimeなど）、リトライロジック、ローディング/エラー状態の導出はここで行う。

3. **UI Layer (`features/*/components/`)**
   - 責務: データの表示とユーザー入力の受け付け。
   - ルール: API通信のロジックを直接書かない。状態管理レイヤー（カスタムフック）を呼び出し、宣言的にUIを構築する。

4. **Routing Layer (`src/routes/`)**
   - 責務: URLとUIのマッピング、画面遷移時の型安全なデータ受け渡し。
   - ルール: TanStack Routerの規約に従い、ルーティングに必要なローダー関数（Queryのプリフェッチなど）やSearch Paramsのバリデーションを定義する。

## 3. コーディングとTDDのルール (厳守事項)
すべての機能開発は、必ず以下の **TDDサイクル（Red -> Green -> Refactor）** に従って進めてください。

- **STEP 1: MSWの定義 (Mock First)**
  - 実装を始める前に、必ず `src/mocks/handlers/` に対象APIのモック（正常系・異常系・遅延）を定義すること。
- **STEP 2: テストの作成 (Red)**
  - UIコンポーネントまたはカスタムフックのテストを先に書くこと。
  - カスタムフックのテストには `@testing-library/react` の `renderHook` と `wrapper` (QueryClientProvider) を使用する。
  - 最初はテストが失敗することを確認する。
- **STEP 3: 実装 (Green)**
  - テストを通すための最小限の実装を行う。
- **STEP 4: リファクタリング (Refactor)**
  - 型定義の整理、コンポーネントの分割、Query Keyのファクトリー化などを行い、コードの品質を高める。

## 4. 管理体制とAIエージェントの行動規範
Claude Codeとして振る舞う際、以下の体制とルールを守ってください。

1. **ステップバイステップの実行:**
   - 複数の機能を同時に実装しない。1つのチケット（機能要件）に対して「モック作成 → テスト作成 → 実装 → テスト通過確認」のサイクルを完了させてから次に進むこと。
2. **テストのカバレッジ:**
   - 単純なスナップショットテストだけでなく、ユーザーインタラクション（`userEvent`）と、MSWを介した非同期状態（Loading -> Success / Error）の遷移を必ずテストすること。
3. **確認と報告:**
   - 大規模なリファクタリング、既存のアーキテクチャ規約から外れるパッケージのインストールが必要だと判断した場合は、必ず実行前に人間に確認（プロンプトでの許可）を求めること。
   - テストが通った際は、どのテストがどのように通過したかを簡潔に報告すること。

## 5. 今後の進め方（ロードマップ）
以下の順番で初期セットアップと開発を進めてください。

- **Phase 1:** `QueryClient` のグローバル設定と、TanStack Routerのルート生成 (`__root.tsx`) の基本設定。
- **Phase 2:** MSWのセットアップと、テスト実行環境（Vitest + setupTests.ts）でのMSWサーバー連携の確立。
- **Phase 3:** 最初のドメイン機能のTDD実践（機能名: {ここに最初の対象機能を記載}）。
- **Phase 4:** ルーティングと連携したページコンポーネントの結合テスト。

## 6. Fetch共通化とTanStack連携の具体ルール

### A. 型安全なFetchクライアントの実装
- `src/lib/api-client.ts` を作成し、すべての通信はこのクライアントを経由すること。
- レスポンスの型定義を必須とし、`fetch` の返り値を自動でパースする仕組みを構築せよ。
- エラー時は単純な `throw Error` ではなく、ステータスコードを保持した独自クラスを投げること。

### B. TanStack QueryのQuery Key管理
- Query Keyの管理には `Query Key Factory` パターン（またはオブジェクト定数）を採用し、マジックストリングを排除せよ。
- これにより、RouterのLoaderとHookの間でキーの不整合を防ぐこと。

### C. Router Loader による Prefetching
- 各ルート（Routeファイル）では、必要に応じて `loader` 関数を定義し、TanStack Queryのキャッシュにデータを事前注入（ensureQueryData）せよ。
- ユーザーが画面遷移した瞬間にデータが表示される「ゼロ・レイテンシ」な体験を目指す。

## 7. 実装の進め方（詳細プロセス）

Claude Codeは以下の順序を1スプリントとして実行せよ。

1. **[Contract]** - 必要な型定義（Request/Response）とMSWのハンドラを作成。
2. **[Infrastructure]** - `api-client.ts` を用いた通信関数を作成し、単体テストを書く。
3. **[Data Layer]** - `useQuery` をラップしたカスタムフックを作成。`renderHook` でTDDを行い、キャッシュ挙動を確認。
4. **[Routing]** - TanStack Routerの `loader` に上記フックで使用する `queryFn` を組み込む。
5. **[UI]** - コンポーネントを実装し、データが反映されることを確認する結合テストを書く。
