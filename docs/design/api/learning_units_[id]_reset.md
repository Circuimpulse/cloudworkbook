# POST /api/learning/units/{id}/reset

## ソースファイル

`src/app/api/learning/units/[id]/reset/route.ts`

## 概要

指定セクションの学習進捗をリセットする。通常リセットと不正解問題のみリセットの2モードに対応。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `POST`
- **Path Parameter**: `id` — セクションID
- **Body** (任意):

```json
{
  "mode": "incorrect" // 省略時は全進捗リセット
}
```

## 内部処理

- `mode` なし → `resetSectionProgress(sectionId, userId)` — 全進捗リセット
- `mode="incorrect"` → `resetIncorrectQuestionsOnly(sectionId, userId)` — 不正解のみリセット

## 呼び出し元

- `SectionsAccordion` — セクション選択時に自動リセット
