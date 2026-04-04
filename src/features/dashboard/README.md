# features/dashboard/ - ダッシュボード機能

## この機能は何？

トップページ（`/`）に表示されるダッシュボード。統計データとアクティビティを **並行取得** し、グラフで可視化します。

## データの流れ

```
GET /api/dashboard/stats    ─┐
                              ├─ useQueries で並行取得（独立キャッシュ）
GET /api/dashboard/activity  ─┘
        ↓
combine で1つのオブジェクトにまとめる
        ↓
DashboardPage
  ├── StatCard × 4（統計数値）
  ├── RoleChart（ロール別円グラフ / recharts）
  ├── WeeklyChart（週別棒グラフ / recharts）
  └── ActivityList（最近のアクティビティ）
```

## キャッシュ設計

| データ | staleTime | 理由 |
|-------|-----------|------|
| 統計（stats） | 60秒 | 頻繁に変わらない |
| アクティビティ | 30秒 | やや頻繁に更新される |

一方が失敗しても他方は表示される。キャッシュも独立して管理される。

## API 仕様

### GET /api/dashboard/stats
```json
{
  "totalUsers": 10,
  "activeUsers": 7,
  "newUsersToday": 1,
  "newUsersThisWeek": 3,
  "roleBreakdown": [{ "role": "admin", "count": 2 }, ...],
  "weeklyNewUsers": [{ "week": "3/31", "count": 2 }, ...]
}
```

### GET /api/dashboard/activity
```json
[
  { "id": "act-1", "action": "ユーザーを作成しました", "userName": "中村真理", "timestamp": "..." }
]
```

## テスト

```bash
npx vitest run src/features/dashboard/
```
