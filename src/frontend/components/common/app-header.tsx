import Link from "next/link";
import { Cloud, Sparkles } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { APP_TEXTS } from "@/frontend/constants/descriptions";

/**
 * アプリケーション共通ヘッダー
 * Clerk認証UIを含む
 */
export function AppHeader() {
  const texts = APP_TEXTS.auth;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-[1440px] px-3 py-3 md:px-6 md:py-4 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg md:text-xl font-bold"
        >
          <Cloud className="h-5 w-5 md:h-6 md:w-6" />
          {APP_TEXTS.app.name}
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <SignedIn>
            <Link
              href="/settings/api-key"
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors px-2 py-1.5 md:px-3 md:py-2 rounded-lg hover:bg-purple-50"
            >
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">AI採点設定</span>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm hover:underline">{texts.login}</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                {texts.signUp}
              </button>
            </SignUpButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
