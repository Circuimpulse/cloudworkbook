# タスク: ファイル名とAPI名の最適化（リファクタリング）

## 背景

ユーザーより「ファイル名やAPI名を一意のものとして機能ごとに分けたい」との要望を受け、汎用的な名前が重複していた現状の構造を、ドメイン駆動設計に近い形にリファクタリングしました。

## 実施した変更

### 1. フロントエンド画面コンポーネントのリネーム

`frontend/screens/` 内のファイル名を、その役割が明確になるように変更しました。

| 旧ファイル名    | 新ファイル名                | 役割                           |
| --------------- | --------------------------- | ------------------------------ |
| `dashboard.tsx` | `DashboardScreen.tsx`       | ダッシュボード画面             |
| `top.tsx`       | `TopScreen.tsx`             | トップページ（LP的な役割）     |
| `section.tsx`   | `SectionSelectScreen.tsx`   | セクション選択画面             |
| `list.tsx`      | `QuestionListScreen.tsx`    | 問題・進捗リスト画面           |
| `quizes.tsx`    | `StudySessionScreen.tsx`    | 学習セッション（問題演習）画面 |
| `mock-test.tsx` | `MockExamScreen.tsx`        | 模擬試験画面                   |
| `history.tsx`   | `LearningHistoryScreen.tsx` | 学習履歴画面                   |

※ これに伴い、`app/` 以下の各ページファイル (`page.tsx`) からのインポートパスも修正しました。

### 2. APIディレクトリ構造の再構築

APIルートを機能ドメインごとに整理し、URLから何のリソースを操作するかが明確になるように変更しました。

| 旧パス                            | 新パス (app/api/...)            | 役割                         |
| --------------------------------- | ------------------------------- | ---------------------------- |
| `api/sections`                    | `api/learning/units`            | 学習単元（セクション）の取得 |
| `api/sections/[id]`               | `api/learning/units/[id]`       | 特定セクション情報の取得     |
| `api/sections/[id]/reset`         | `api/learning/units/[id]/reset` | セクション進捗のリセット     |
| `api/sections/progress`           | `api/user/progress/units`       | ユーザーのセクション進捗保存 |
| `api/sections/questions/progress` | `api/user/progress/questions`   | ユーザーの問題別進捗保存     |
| `api/mock-test/random`            | `api/exams/mock/questions`      | 模擬試験問題の生成・取得     |
| `api/mock-test/submit`            | `api/exams/mock/submission`     | 模擬試験結果の提出           |

### 3. フロントエンドのAPI呼び出し修正

`MockExamScreen.tsx`, `StudySessionScreen.tsx`, `QuestionListScreen.tsx`, `sections-accordion.tsx` において、`fetch` 関数で呼び出すURLを新しいAPIエンドポイントに合わせて修正しました。

## 今後の推奨事項

- **ディレクトリ構成のさらなる整理**: 現在 `frontend/screens` にフラットに置かれているコンポーネントを、`frontend/features/learning/components` や `frontend/features/exams/components` のように機能ディレクトリに移動させると、よりスケーラブルになります。
- **型定義の整理**: `backend/db/schema.ts` にある型定義も、ドメインごとにファイルを分割することを検討してください。
