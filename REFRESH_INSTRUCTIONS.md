# アプリケーションのリフレッシュ手順

問題が表示されない場合、以下の手順を試してください：

## 1. 開発サーバーの再起動

```powershell
# 現在のサーバーを停止（Ctrl+C）
# 次に再起動
npm run dev
```

## 2. ブラウザのハードリフレッシュ

- **Windows/Linux**: `Ctrl + Shift + R` または `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

## 3. Next.jsのキャッシュをクリア

```powershell
# .next フォルダを削除
Remove-Item -Recurse -Force .next

# サーバーを再起動
npm run dev
```

## 4. データベースの確認

問題数を確認：
```powershell
$env:DATABASE_URL="file:./local.db"
npx tsx scripts/check-question-count.ts
```

## 5. 完全リセット（最終手段）

```powershell
# キャッシュとビルドファイルを削除
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# サーバーを再起動
npm run dev
```

## 現在のデータベース状態

- 応用情報#01: 60問
- 応用情報#02: 30問
- 応用情報#03: 30問
- その他のセクション: 各30問
- **合計: 330問**

模擬試験モード（50問ランダム）をテストできます！

