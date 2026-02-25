# ビルドエラー解消: @/db/\* インポートパス修正

## 背景

`src/` への移行時に、DBモジュールのインポートパスが壊れています。`@/db/queries` 等のインポートが `src/db/` を参照しますが、実際のファイルは `src/backend/db/` にあります。

## 対象ファイル（18ファイル）

すべての `@/db/queries`, `@/db/client`, `@/db/schema` を `@/backend/db/queries`, `@/backend/db/client`, `@/backend/db/schema` に修正します。

| #   | ファイル                                              | 修正内容                                |
| --- | ----------------------------------------------------- | --------------------------------------- |
| 1   | `src/app/page.tsx`                                    | `@/db/queries` → `@/backend/db/queries` |
| 2   | `src/app/sections/[id]/page.tsx`                      | 同上                                    |
| 3   | `src/app/sections/[id]/list/page.tsx`                 | 同上                                    |
| 4   | `src/app/history/page.tsx`                            | 同上                                    |
| 5   | `src/app/exams/[id]/page.tsx`                         | 同上                                    |
| 6   | `src/app/api/settings/favorite/route.ts`              | 同上                                    |
| 7   | `src/app/api/user/progress/units/route.ts`            | 同上                                    |
| 8   | `src/app/api/user/progress/questions/route.ts`        | 同上                                    |
| 9   | `src/app/api/exams/[id]/mock-test/route.ts`           | 同上                                    |
| 10  | `src/app/api/exams/[id]/incorrect-questions/route.ts` | 同上                                    |
| 11  | `src/app/api/exams/[id]/favorite-questions/route.ts`  | 同上                                    |
| 12  | `src/app/api/exams/mock/submission/route.ts`          | queries, client, schema 3つ             |
| 13  | `src/app/api/exams/mock/questions/route.ts`           | 同上                                    |
| 14  | `src/app/api/learning/units/route.ts`                 | 同上                                    |
| 15  | `src/app/api/learning/units/[id]/reset/route.ts`      | 同上                                    |
| 16  | `src/app/api/questions/[id]/favorite/route.ts`        | 同上                                    |

## 空ディレクトリの削除

- `src/db/` (空)
- `src/components/common/` (空)
- `src/features/dashboard/`, `src/features/exams/`, `src/features/mock-test/`, `src/features/quizzes/` (すべて空)
- `src/backend/api/mock-test/`, `src/backend/api/sections/` (空)

## 検証方法

`npx next build` を実行し、ビルドが成功することを確認します。
