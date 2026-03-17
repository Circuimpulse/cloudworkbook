---
description: ブラウザでアプリのUIテストを実施する手順
---

# ブラウザテスト手順

アプリのUIをブラウザで確認・テストする際は、以下の手順で実施してください。

## 前提条件
- `npm run dev` でdevサーバーが起動していること
- `.env.local` にテスト認証情報が設定されていること

## テスト認証情報
`.env.local` に定義されている以下の環境変数を使用します:
- `TEST_USER_EMAIL` - テスト用メールアドレス
- `TEST_USER_PASSWORD` - テスト用パスワード
- `TEST_CLERK_VERIFICATION_CODE` - Clerkデバイス確認コード（開発環境用: `424242`）

## ログイン手順

1. `http://localhost:3000/sign-in` にアクセス
2. Email欄に `TEST_USER_EMAIL` の値を入力
3. Continueをクリック
4. Password欄に `TEST_USER_PASSWORD` の値を入力
5. Continueをクリック
6. デバイス確認コードが求められた場合、`TEST_CLERK_VERIFICATION_CODE` の値を入力

## 注意事項
- Clerk開発環境では、テスト用確認コード `424242` が常に使用可能です
- ブラウザのCookieが保持されている限り、再ログイン不要です
- Chrome DevTools MCPとbrowser_subagentは同時使用不可（セッション競合）
  - MCPが使えない場合は browser_subagent を使用してください
