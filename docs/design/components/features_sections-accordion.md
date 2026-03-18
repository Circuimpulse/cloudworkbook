# SectionsAccordion

## 対象ソースファイル

`src/frontend/components/features/sections-accordion.tsx`

## 責務・概要

セクション一覧を10件単位でグルーピングし、アコーディオン形式で表示するコンポーネント。セクションをクリックすると進捗をリセットして学習画面に遷移する。

## Props

| Prop       | 型              | 必須 | 説明           |
| ---------- | --------------- | ---- | -------------- |
| `sections` | `SectionItem[]` | ✅   | セクション一覧 |

## 型定義

```typescript
interface SectionItem {
  id: number;
  title: string;
  order: number;
  description?: string | null;
  examTitle?: string | null;
}
```

## 動作仕様

### グルーピング

- `CHUNK_SIZE = 10` で分割
- ヘッダーに `#01 ~ #10` 形式のレンジラベルを表示
- `{group.length}セクション` の件数を表示

### アコーディオン

- 初期状態: 最初のグループが展開
- クリックで展開/折りたたみ切り替え（同時に1つのみ展開）
- `ChevronDown` / `ChevronRight` アイコン

### セクション選択

1. セクションクリック
2. `POST /api/learning/units/{id}/reset` で進捗リセット
3. リセット成功後 `window.location.href` でフルリロード遷移 → `/sections/{id}?retry={timestamp}`
4. リセット失敗時はアラート表示

### セクション説明表示

- `description` または `examTitle` が存在する場合、セクション名の上に小さく表示
- AP午後の場合: 「令和6年度 秋期 午後 問1 情報セキュリティ」等の分野情報が表示される
