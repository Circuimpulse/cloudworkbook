# Phase 3: AI採点機能 実装ウォークスルー

## 変更概要
FP実技試験の記述式問題に対して、Gemini APIを用いたAI採点機能を実装しました。

## 変更ファイル一覧

### 新規作成
| ファイル | 説明 |
|---------|------|
| `src/app/settings/api-key/page.tsx` | APIキー設定ページのルートファイル |
| `src/frontend/screens/ApiKeySettingsScreen.tsx` | APIキー設定画面コンポーネント |
| `src/app/api/ai/score/route.ts` | AI採点APIルート（Gemini API連携） |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `src/frontend/screens/StudySessionScreen.tsx` | AI採点ボタンと結果表示UIを追加 |
| `src/frontend/screens/TopScreen.tsx` | 設定セクションにAI採点設定リンクを追加 |
| `package.json` | `@google/generative-ai` パッケージ追加 |

## 機能詳細

### 1. APIキー設定画面 (`/settings/api-key`)
- Gemini APIキーの入力・保存機能（localStorageに保持）
- パスワードマスク表示・トグル
- 「テスト送信」ボタンでAPI疎通確認
- 保存済みキーの表示・削除
- Google AI Studio へのリンク付き使い方ガイド

### 2. AI採点APIルート (`/api/ai/score`)
- クライアントから送信されたAPIキーでGemini API (`gemini-2.0-flash`) を呼び出し
- 採点プロンプトで以下を考慮:
  - 数値回答の単位差異
  - 語群選択の各空欄一致
  - ○×判定の一致
  - 計算問題の部分点
- JSON応答のパースとエラーハンドリング
- APIキー無効・利用上限等の個別エラーメッセージ

### 3. StudySessionScreen AI採点UI
- 記述式問題（`fill_in`, `select` タイプ）で回答提出後に表示
- **APIキー未設定時**: 設定画面へのリンク付きメッセージ
- **AIで採点する**: 紫グラデーションのボタン
- **採点中**: ローディングスピナー
- **採点結果**: スコアヘッダー（色分け: 80+＝緑, 50+＝黄, 50未満＝赤）＋プログレスバー＋AI解説
- **再採点**: 結果表示後に「もう一度採点する」リンク

### 4. トップ画面
- 過去問一覧の下に「設定」セクションを追加
- 「AI採点設定」カード（紫アイコン付き）

## APIキー管理方針
- ユーザー自身のキーをlocalStorageに保存
- サーバー（Vercel等）にはキーを保持しない
- リクエストごとにクライアントからキーを送信
- → Vercelデプロイ時のAPIコスト回避

## 動作確認結果
- ✅ ビルド成功
- ✅ トップ画面に「AI採点設定」リンク表示
- ✅ APIキー設定画面の表示・操作
- ✅ 記述式問題でAI採点セクション表示（未設定時のメッセージ確認済み）
