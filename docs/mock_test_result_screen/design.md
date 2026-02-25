# 模擬テスト画面の改善設計書

## 概要

現在の `MockExamScreen` を改善し、以下の機能を追加する：

1. **問題リストボタン** — 模擬テスト中に問題一覧を表示し、任意の問題にジャンプ可能
2. **採点ボタン** — 任意のタイミングで採点できるボタン
3. **試験結果画面** — `/mock-test/result` に新ルートとして独立
4. **お気に入り一括登録** — 間違えた問題をレベル1/2/3の任意組み合わせで一括登録

---

## 画面設計

### 1. 模擬テスト出題画面の改善（既存 `MockExamScreen`）

#### 追加するUI要素

| 要素             | 位置                                 | 説明                         |
| ---------------- | ------------------------------------ | ---------------------------- |
| **リストボタン** | ヘッダー右上（「中断して戻る」の左） | モーダルで問題リストを表示   |
| **採点ボタン**   | ヘッダーまたはフッター               | 解答を採点して結果画面へ遷移 |

#### 問題リスト（モーダル）

- 問題番号のグリッド表示
- 各問題の状態を色分け：
  - 🟦 **解答済み** → 青
  - ⬜ **未回答** → 白/グレー
- 問題番号クリックでその問題にジャンプ

#### 採点ボタンの仕様

- 未回答の問題がある場合は確認ダイアログ：
  - 「未回答の問題が{n}問あります。採点しますか？（未回答は不正解扱い）」
- 採点完了後、結果データをURLパラメータ経由で `/mock-test/result` へ遷移
  - 結果データは `sessionStorage` に保存して渡す

---

### 2. 試験結果画面（`/mock-test/result`）— 新規ルート

#### 画面構成

```
┌──────────────────────────────────┐
│  ヘッダー: 模擬テスト結果        │
├──────────────────────────────────┤
│  スコアサマリー                  │
│  ┌────────────────────────┐     │
│  │  正解数 / 総問題数      │     │
│  │  正答率 ○○%            │     │
│  └────────────────────────┘     │
├──────────────────────────────────┤
│  間違えた問題一覧               │
│  ┌────────────────────────┐     │
│  │ Q1: 問題文(抜粋)       │     │
│  │ あなたの回答: B         │     │
│  │ 正解: D                │     │
│  │ 解説: ○○○              │     │
│  ├────────────────────────┤     │
│  │ Q5: 問題文(抜粋)       │     │
│  └────────────────────────┘     │
├──────────────────────────────────┤
│  お気に入り一括登録             │
│  ┌────────────────────────┐     │
│  │ [①] [②] [③]  ← タップ  │     │
│  │ 選択中: ①③             │     │
│  │ [一括登録する]          │     │
│  └────────────────────────┘     │
├──────────────────────────────────┤
│  [学習履歴へ]  [もう一度挑戦]   │
└──────────────────────────────────┘
```

#### お気に入りレベル選択UI

- **トグルボタン形式** で ①②③ を直感的にタップで選択
- 複数選択可（例: ①と③を同時にON）
- 選択中のボタンはハイライト表示
- 最低1つ選択した状態で「一括登録する」ボタンが有効化
- 登録完了後に成功メッセージを表示

#### データの受け渡し

- `MockExamScreen` で採点後、結果データを `sessionStorage` に保存
- `/mock-test/result` ページで `sessionStorage` から結果データを読み取り
- `sessionStorage` にデータがない場合は `/mock-test` にリダイレクト

---

## ルーティング

```
/mock-test?examId={id}
  loading → ready（出題中）
  ├→ リストボタン → 問題リストモーダル表示
  └→ 採点ボタン → submitting → /mock-test/result へ遷移

/mock-test/result  ← 新規ルート
  ├→ 学習履歴へ → /history
  └→ もう一度挑戦 → /mock-test?examId={id}
```

> [!IMPORTANT]
> 採点時（`handleSubmit`）に既存のAPI `POST /api/exams/mock/submission` で履歴が自動保存される。画面遷移前に保存が完了するため、結果画面や学習履歴画面で常に最新データが参照可能。

---

## ファイル変更一覧

### フロントエンド

#### [MODIFY] [MockExamScreen.tsx](file:///c:/Users/shugo/cloudworkbook/src/frontend/screens/MockExamScreen.tsx)

- 出題画面にリストボタンと採点ボタンを追加
- 問題リストモーダルの実装
- 採点前の確認ダイアログ
- 結果画面のインライン実装を削除し、`/mock-test/result` へ遷移するよう変更
- 採点完了後に結果データを `sessionStorage` に保存

#### [NEW] MockTestResultScreen.tsx (`src/frontend/screens/MockTestResultScreen.tsx`)

- 試験結果画面の新規コンポーネント
- スコアサマリー表示（正解数/総問題数、正答率%）
- 間違えた問題一覧（問題文抜粋、回答、正解、解説）
- お気に入りレベル選択UI（①②③トグルボタン）
- お気に入り一括登録ボタン
- 「学習履歴へ」「もう一度挑戦」ナビゲーション

#### [NEW] result/page.tsx (`src/app/mock-test/result/page.tsx`)

- `/mock-test/result` ルート用のページファイル

#### [NEW] MockTestQuestionListModal.tsx (`src/frontend/components/mock-test/MockTestQuestionListModal.tsx`)

- 模擬テスト用の問題リストモーダルコンポーネント

### 画面設計書

#### [NEW] MockTestResultScreen.md (`docs/design/screens/MockTestResultScreen.md`)

- 試験結果画面の設計書

#### [MODIFY] [routing-structure.md](file:///c:/Users/shugo/cloudworkbook/docs/design/routing-structure.md)

- `/mock-test/result` ルートを追加

### バックエンド

#### [NEW] 一括お気に入り登録API (`src/app/api/questions/bulk-favorite/route.ts`)

```
POST /api/questions/bulk-favorite
Body: { questionIds: number[], levels: number[] }
```

- 複数の問題を指定レベルで一括お気に入り登録
- `levels: [1, 3]` なら ①③をON、②は変更しない

#### [MODIFY] [queries.ts](file:///c:/Users/shugo/cloudworkbook/src/backend/db/queries.ts)

- `bulkSetFavorite(userId, questionIds, levels)` 関数を追加

---

## 検証計画

1. `/mock-test?examId=1` で数問解答後、**リストボタン** → 問題リストモーダル表示・ジャンプ確認
2. **採点ボタン** → 未回答確認ダイアログ → `/mock-test/result` へ遷移確認
3. 結果画面でスコア・間違えた問題一覧の表示確認
4. お気に入りレベル①②③のトグル選択 → **一括登録** → 成功メッセージ確認
5. 学習履歴画面でお気に入り登録済みの問題が表示されることを確認
6. `/history` で模擬テスト履歴が表示されることを確認
