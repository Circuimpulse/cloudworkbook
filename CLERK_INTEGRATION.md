# Clerk統合ガイド（Next.js App Router）

このプロジェクトは、Clerkの最新のNext.js App Router統合方式を使用しています。

## ✅ 実装済みの内容

### 1. Clerkパッケージのインストール

```bash
npm install @clerk/nextjs
```

### 2. 環境変数の設定

`.env.local` ファイル（Gitにコミットされません）:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**取得方法**:
1. [Clerk Dashboard](https://dashboard.clerk.com/) にアクセス
2. [API Keys ページ](https://dashboard.clerk.com/last-active?path=api-keys) を開く
3. **Publishable Key** と **Secret Key** をコピー

### 3. ミドルウェアの設定

`middleware.ts` で `clerkMiddleware()` を使用:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/sections(.*)",
  "/mock-test(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### 4. レイアウトでClerkProviderをラップ

`app/layout.tsx`:

```typescript
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body>
          <header>
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 5. 認証ページの作成

`app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

`app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

## 🔒 サーバーサイドでの認証情報取得

### Server Components / API Routes

```typescript
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // userId を使用してデータ取得など
  return <div>Welcome {userId}</div>;
}
```

### API Routes (Edge Runtime)

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // 認証済みユーザーの処理
  return NextResponse.json({ userId });
}
```

## 🎨 Clerkコンポーネント

### 利用可能なコンポーネント

- `<SignInButton>` - ログインボタン
- `<SignUpButton>` - 新規登録ボタン
- `<UserButton>` - ユーザープロフィールボタン（アバター）
- `<SignedIn>` - ログイン済みユーザーにのみ表示
- `<SignedOut>` - 未ログインユーザーにのみ表示
- `<SignIn>` - ログインフォーム
- `<SignUp>` - 新規登録フォーム

### 使用例

```typescript
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton mode="modal">
          <button>ログイン</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  );
}
```

## ⚠️ 重要な注意事項

### ✅ 正しい実装

1. **`clerkMiddleware()`** を使用（`middleware.ts`）
2. **`@clerk/nextjs/server`** から `auth()` をインポート
3. **`async/await`** で `auth()` を呼び出す
4. **`.env.local`** に実際のキーを保存（`.gitignore` で除外）
5. **App Router** の構造（`app/` ディレクトリ）を使用

### ❌ 避けるべき実装

1. ~~`authMiddleware()`~~ - 廃止されました
2. ~~`_app.tsx`~~ - Pages Routerの古い方式
3. ~~`pages/` ディレクトリ~~ - App Routerを使用
4. ~~同期的な `auth()` 呼び出し~~ - 必ず `await` を使用
5. ~~コードに直接キーを記述~~ - 環境変数を使用

## 🚀 Cloudflare移行時の注意点

Cloudflare Pages + Workers に移行する際も、Clerkは基本的にそのまま動作します：

1. **環境変数**: Cloudflare Pagesの環境変数に同じキーを設定
2. **ドメイン**: ClerkダッシュボードでCloudflareのドメインを許可リストに追加
3. **Edge Runtime**: 既に使用しているため、互換性は高い

## 📚 参考リンク

- [Clerk公式ドキュメント](https://clerk.com/docs)
- [Next.js App Router クイックスタート](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Clerk Dashboard](https://dashboard.clerk.com/)
- [API Keys管理](https://dashboard.clerk.com/last-active?path=api-keys)

## 🐛 トラブルシューティング

### エラー: "Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()"

**原因**: `middleware.ts` が正しく設定されていない

**解決策**: 
1. `middleware.ts` が存在することを確認
2. `clerkMiddleware()` をエクスポートしていることを確認
3. `config.matcher` が設定されていることを確認

### エラー: "Invalid publishable key"

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. `.env.local` ファイルが存在することを確認
2. キーが正しくコピーされていることを確認
3. 開発サーバーを再起動

### ログインボタンが表示されない

**原因**: `<ClerkProvider>` でラップされていない

**解決策**:
1. `app/layout.tsx` で `<ClerkProvider>` を使用していることを確認
2. Clerkコンポーネントが `<ClerkProvider>` の内側にあることを確認

## ✨ ベストプラクティス

1. **環境変数の管理**: 開発環境は `.env.local`、本番環境はホスティングサービスの環境変数設定を使用
2. **セキュリティ**: 実際のキーは絶対にGitにコミットしない
3. **ルート保護**: `middleware.ts` で保護が必要なルートを明示的に指定
4. **エラーハンドリング**: 認証エラーを適切に処理し、ユーザーをログインページにリダイレクト
5. **テスト**: 開発環境でテストユーザーを作成して動作確認

## 🎯 次のステップ

1. Clerkダッシュボードで追加設定（メール、ソーシャルログインなど）
2. ユーザープロフィールページの実装
3. ロールベースのアクセス制御（RBAC）の実装
4. Webhookの設定（ユーザー作成時にDBにレコード追加など）
