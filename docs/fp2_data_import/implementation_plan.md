# FP2級座学 データインポート実装計画

## 概要

rawDataフォルダ内のFP2級座学のMarkdownデータ（問題・解答・解説）と画像ファイルをDBに取り込む。
既存の `import-csv.ts` を活用するため、MD→CSV変換スクリプトを新規作成し、インポートスクリプトを小修正する。

## データ構造

- **ソースデータ**: `rawData/FP/FP2級座学/` 配下の6年度フォルダ (202305〜202501)
- **各フォルダ**: `問題.md`, `解答.md`, `解説.md`, `問題XX.png`
- **合計**: 60問 × 6年度 = **360問**
- **セクション**: 5問ずつ連番で割り当て → **72セクション**

## DB設計変更

**変更なし**。既存の `questions` テーブルのカラムで対応可能。

## 画像保持方式

**方式A**: 画像ファイルを `public/images/kakomon/` にコピーし、DBにはパスを保存。

## 提案する変更

---

### MD → CSV 変換スクリプト

#### [NEW] [md-to-csv.ts](file:///c:/Users/shugo/cloudworkbook/scripts/md-to-csv.ts)

Markdownファイルを解析し、`import-csv.ts` が受け付けるCSV形式に変換するスクリプト。

**処理内容**:
1. `問題.md` を `## 問N` で分割し、問題文と選択肢（1〜4）を抽出
2. `解答.md` のテーブルから正解番号を取得し、`1→A, 2→B, 3→C, 4→D` にマッピング
3. `解説.md` を `## 問N` で分割し、各問の解説を抽出
4. 画像参照 `![alt](問題25.png)` を `![alt](images/問題25.png)` 形式に変換
5. 全年度フォルダを統合して1つの `data.csv` を出力

**使い方**:
```
npx tsx scripts/md-to-csv.ts FP2級座学
```

**出力CSV列**: `questionNumber, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, sourceNote`

**フォーマット差異への対応**:
- 改行ありのMD（202305等）と改行なしの1行MD（202501等）の両方をパース
- 選択肢の番号形式 `1.` / `1. ` の揺れに対応

---

### インポートスクリプト修正

#### [MODIFY] [import-csv.ts](file:///c:/Users/shugo/cloudworkbook/scripts/import-csv.ts)

**変更点**:
1. FP試験のスラッグ・タイトルマッピング追加（`FP2G` → `FP2級座学` 等）
2. セクション分割を5問単位に変更（設定可能にする）
3. `rawData/` フォルダ構造への対応（既存の `IPA_kakomon/` に加えて）
4. 画像パス形式の対応（`問題XX.png` → `images/問題XX.png`）
5. `examYears` の season を FP向けに拡張（`spring/autumn` に加えて月ベース対応）

> [!IMPORTANT]
> `examYears` テーブルの `season` カラムは現在 `enum: ["spring", "autumn"]` のみ。
> FPは年3回（1月・5月・9月）なので、enum値の追加か、別の管理方法が必要。
> **案**: season列を `"spring" | "autumn" | "jan" | "may" | "sep"` に拡張する。

---

### スキーマ修正

#### [MODIFY] [schema.ts](file:///c:/Users/shugo/cloudworkbook/src/backend/db/schema.ts)

**変更点**: `examYears` テーブルの `season` enumにFP用の値を追加

```diff
- season: text("season", { enum: ["spring", "autumn"] }).notNull(),
+ season: text("season", { enum: ["spring", "autumn", "jan", "may", "sep"] }).notNull(),
```

---

## 検証計画

### 自動テスト

1. **MD → CSV 変換の検証**
   ```
   npx tsx scripts/md-to-csv.ts FP2級座学
   ```
   - 出力されたCSVファイルの行数が360行であること
   - 各行に必須カラム（questionNumber, questionText, optionA〜D, correctAnswer）が存在すること
   - correctAnswerが全てA/B/C/Dであること

2. **データインポートの検証**
   ```
   npx tsx scripts/import-csv.ts FP2G 2023 may
   ```
   - DBに60問が登録されること
   - セクションが12個作成されること（60÷5）
   - 画像ファイルが `public/images/kakomon/` にコピーされること

### 手動検証

1. ブラウザで `npm run dev` → FP2級座学のセクション一覧画面を確認
2. セクション#1を選択して問題が表示されること、画像が正しく表示されること
