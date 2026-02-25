# MockTestResultScreen

## 対象ソースファイル

`src/frontend/screens/MockTestResultScreen.tsx`

## 責務・概要

模擬テスト結果画面。採点結果のスコアサマリー、間違えた問題の詳細一覧、お気に入り一括登録機能を提供する。

## Props

なし（Client Component。結果データは `sessionStorage` から読み込み）

## 画面構成

1. **スコアサマリー** — 正解数/総問題数、正答率%
2. **間違えた問題一覧** — 不正解問題を一覧表示（問題文抜粋、ユーザー回答、正解、解説）
3. **正解した問題一覧** — 正解問題を折りたたみ形式で表示
4. **お気に入り一括登録** — ①②③のトグルボタンでレベル選択 → 一括登録
5. **ナビゲーション** — 「学習履歴へ」「もう一度挑戦する」ボタン

## データフロー

- `sessionStorage` から `mockTestResult` と `mockTestExamId` を読み取り
- お気に入り一括登録: `POST /api/questions/bulk-favorite`

## ルーティング

- **表示パス**: `/mock-test/result`（`src/app/mock-test/result/page.tsx`）
- **遷移先**: `/history`（学習履歴）、`/mock-test?examId={id}`（再挑戦）
