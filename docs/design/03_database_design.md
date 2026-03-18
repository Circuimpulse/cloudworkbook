# 03. データベース設計書 (Database Design)

## 1. 概要

SQLite（Drizzle ORM経由でTurso/LibSQLに接続）を採用。
ローカル開発は `local.db`、本番は Turso。

## 2. テーブル一覧（12テーブル）

| # | テーブル名 | 説明 |
|:--|:---|:---|
| 1 | users | ユーザー（Clerk userId = PK） |
| 2 | ipa_categories | IPA公式3階層分類（大→中→小分類） |
| 3 | exams | 試験区分（応用情報午前、FP3級等） |
| 4 | exam_years | 試験年度・季節（2024春期等） |
| 5 | sections | セクション（試験区分ごとの章立て） |
| 6 | questions | 問題（5形式対応） |
| 7 | section_progress | セクション進捗（集計データ、上書き更新） |
| 8 | section_question_progress | 個別問題の正誤・回答記録 |
| 9 | user_question_records | お気に入り（3段階）・正誤履歴 |
| 10 | mock_test_history | 模擬テスト履歴（追記型） |
| 11 | mock_test_details | 模擬テスト各問の解答記録 |
| 12 | favorite_settings | お気に入りフィルター設定（OR/AND） |

## 3. テーブル定義

### 3.1. users

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | text | PK | Clerk userId |
| email | text | NOT NULL | メールアドレス |
| name | text | | 表示名 |
| created_at | integer | NOT NULL, DEFAULT | UNIXタイムスタンプ |
| updated_at | integer | NOT NULL, DEFAULT | 更新日時 |

### 3.2. ipa_categories

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | integer | PK, AUTO | |
| parent_id | integer | FK(ipa_categories.id), CASCADE | 親カテゴリ |
| name | text | NOT NULL | 分類名 |
| level | integer | NOT NULL | 1=大分類, 2=中分類, 3=小分類 |

### 3.3. exams

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | integer | PK, AUTO | |
| title | text | NOT NULL | 試験名（例: "応用情報 午前"） |
| description | text | | 説明文 |
| slug | text | UNIQUE | URL用スラッグ（例: "ap-gozen"） |
| question_format | text | DEFAULT "choice_only" | "choice_only" or "mixed" |

### 3.4. exam_years

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | integer | PK, AUTO | |
| exam_id | integer | FK(exams.id), CASCADE, NOT NULL | |
| year | integer | NOT NULL | 例: 2024 |
| season | text | NOT NULL | "spring", "autumn", "jan", "may", "sep" |
| label | text | NOT NULL | 表示用（例: "令和6年度 秋期"） |

UNIQUE制約: (exam_id, year, season)

### 3.5. sections

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | integer | PK, AUTO | |
| exam_id | integer | FK(exams.id), CASCADE | |
| title | text | NOT NULL | 例: "#1" |
| description | text | | 例: "令和6年度 秋期 午後 問1 情報セキュリティ" |
| order | integer | NOT NULL | 表示順 |
| created_at | integer | NOT NULL, DEFAULT | |

### 3.6. questions

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | integer | PK, AUTO | |
| section_id | integer | FK(sections.id), CASCADE, NOT NULL | |
| question_text | text | NOT NULL | 問題文（Markdown） |
| question_type | text | NOT NULL, DEFAULT "choice" | choice/true_false/fill_in/select/descriptive |
| option_a | text | NOT NULL | 選択肢A（記述式: "記述式"） |
| option_b | text | NOT NULL | 選択肢B |
| option_c | text | | NULL=2択 |
| option_d | text | | NULL=2択/3択 |
| correct_answer | text | NOT NULL | 4択:"A"〜"D", ○×:"○"/"×", 記述:正解テキスト |
| correct_answer_detail | text | | JSON（複数空欄の詳細正解） |
| explanation | text | | 解説（Markdown） |
| order | integer | NOT NULL | |
| category_id | integer | FK(ipa_categories.id), SET NULL | IPA分類 |
| exam_year_id | integer | FK(exam_years.id), SET NULL | 出題年度 |
| question_number | integer | | 問1〜問80等 |
| image_url | text | | 非推奨（Markdown内で管理） |
| has_image | integer | NOT NULL, DEFAULT false | 画像参照の有無 |
| source_note | text | | 出典メモ（例: "R6秋 問12"） |
| created_at | integer | NOT NULL, DEFAULT | |

### 3.7. section_progress

セクション単位の学習集計（上書き更新）。

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| user_id | text | PK, FK(users.id), CASCADE | |
| section_id | integer | PK, FK(sections.id), CASCADE | |
| correct_count | integer | NOT NULL, DEFAULT 0 | 正解数 |
| total_count | integer | NOT NULL, DEFAULT 0 | 解答数 |
| last_studied_at | integer | NOT NULL, DEFAULT | |
| updated_at | integer | NOT NULL, DEFAULT | |

### 3.8. section_question_progress

個別問題の正誤記録（上書き更新）。

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| user_id | text | PK, FK(users.id), CASCADE | |
| section_id | integer | PK, FK(sections.id), CASCADE | |
| question_id | integer | PK, FK(questions.id), CASCADE | |
| user_answer | text | NOT NULL, DEFAULT "" | ユーザーの回答 |
| is_correct | integer | NOT NULL | boolean |
| updated_at | integer | NOT NULL, DEFAULT | |

### 3.9. user_question_records

お気に入り・正誤の永続的な履歴。

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| user_id | text | PK, FK(users.id), CASCADE | |
| question_id | integer | PK, FK(questions.id), CASCADE | |
| is_correct | integer | | boolean |
| is_favorite | integer | DEFAULT false | 一般お気に入り |
| is_favorite_1 | integer | DEFAULT false | レベル1 |
| is_favorite_2 | integer | DEFAULT false | レベル2 |
| is_favorite_3 | integer | DEFAULT false | レベル3 |
| updated_at | integer | NOT NULL, DEFAULT | |

### 3.10. mock_test_history

模擬テスト結果（追記型）。

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | integer | PK, AUTO | |
| user_id | text | FK(users.id), CASCADE, NOT NULL | |
| exam_id | integer | FK(exams.id), SET NULL | |
| score | integer | NOT NULL | 正解数 |
| total_questions | integer | NOT NULL, DEFAULT 50 | |
| taken_at | integer | NOT NULL, DEFAULT | |

### 3.11. mock_test_details

模擬テスト各問の解答記録。

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | integer | PK, AUTO | |
| test_id | integer | FK(mock_test_history.id), CASCADE, NOT NULL | |
| question_id | integer | FK(questions.id), CASCADE, NOT NULL | |
| user_answer | text | NOT NULL | |
| is_correct | integer | NOT NULL | boolean |
| answered_at | integer | NOT NULL, DEFAULT | |

### 3.12. favorite_settings

ユーザーごとのお気に入りフィルター設定。

| カラム | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| user_id | text | PK, FK(users.id), CASCADE | |
| favorite1_enabled | integer | NOT NULL, DEFAULT true | |
| favorite2_enabled | integer | NOT NULL, DEFAULT true | |
| favorite3_enabled | integer | NOT NULL, DEFAULT true | |
| filter_mode | text | NOT NULL, DEFAULT "or" | "or" or "and" |
| updated_at | integer | NOT NULL, DEFAULT | |

## 4. インデックス

| インデックス名 | テーブル | カラム |
|:---|:---|:---|
| sections_exam_id_idx | sections | exam_id |
| questions_section_id_idx | questions | section_id |
| questions_exam_year_id_idx | questions | exam_year_id |
| mock_test_history_user_id_idx | mock_test_history | user_id |
| mock_test_details_test_id_idx | mock_test_details | test_id |

## 5. リレーション（テキストER図）

```
users ──1:N── section_progress
users ──1:N── section_question_progress
users ──1:N── user_question_records
users ──1:N── mock_test_history
users ──1:1── favorite_settings

exams ──1:N── exam_years
exams ──1:N── sections

sections ──1:N── questions
sections ──1:N── section_progress
sections ──1:N── section_question_progress

questions ──N:1── sections
questions ──N:1── ipa_categories (optional)
questions ──N:1── exam_years (optional)
questions ──1:N── section_question_progress
questions ──1:N── user_question_records
questions ──1:N── mock_test_details

mock_test_history ──1:N── mock_test_details

ipa_categories ──1:N── ipa_categories (self-ref: parent_id)
```

## 6. セクション構成ルール

詳細は [docs/import_rules/task.md](../import_rules/task.md) を参照。

### 選択式試験（FP / 応用情報午前）
- **5問/セクション**で分割
- description: `年度ラベル 問X〜Y` 形式

### 記述式試験（応用情報午後 / IPA高度試験）
- **1大問＝1セクション**で分割
- description: `年度ラベル 午後 問N [分野名]` 形式
- 応用情報午後は問1〜11が分野固定（情報セキュリティ/経営戦略/プログラミング等）

### 現在のDB登録状況
- 15試験区分、約6,900問
- 選択式: FP4種 + 応用情報午前
- 記述式: 応用情報午後 + IPA高度9区分