# 実装計画: ファイル名・API構造の最適化

## 目的

機能ごとに一意で明確な名前を持つように、ファイル名（特にフロントエンド画面コンポーネント）とAPIエンドポイントをリファクタリングする。

## 実装内容

### 1. フロントエンド画面コンポーネントのリネーム

- **ファイル群**: `frontend/screens/*.tsx`
- **変更内容**: パスカルケースかつ機能が明確な名前に一括リネームする。
  - `dashboard.tsx` -> `DashboardScreen.tsx`
  - `top.tsx` -> `TopScreen.tsx` (or LandingScreen?)
  - `section.tsx` -> `SectionSelectScreen.tsx`
  - `list.tsx` -> `QuestionListScreen.tsx`
  - `quizes.tsx` -> `StudySessionScreen.tsx`
  - `mock-test.tsx` -> `MockExamScreen.tsx`
  - `history.tsx` -> `LearningHistoryScreen.tsx`

### 2. インポート修正

- **ファイル群**: `app/**/*.page.tsx`
- **変更内容**: 画面コンポーネントのリネームに伴い、インポートパスを修正する。

### 3. APIディレクトリ構造の再構築

- **ファイル群**: `app/api/**`
- **変更内容**: 汎用的なディレクトリ名を避け、ドメインに基づいた階層構造に変更する。
  - `api/sections` -> `api/learning/units` & `api/user/progress/units`
  - `api/mock-test` -> `api/exams/mock`

### 4. API呼び出しの修正

- **ファイル群**: `frontend/screens/*.tsx`, `frontend/components/**/*.tsx`
- **変更内容**: `fetch` 関数で呼び出すエンドポイントを新しいURLに合わせて書き換える。

## 検証

- アプリケーションをビルド・起動し、各画面遷移が正常に行われることを確認する。
- 模擬試験の開始・終了、セクション学習の進捗保存などのAPI通信が成功することを確認する。
