import Link from "next/link";
import { Cloud } from "lucide-react";
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
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-bold"
        >
          <Cloud className="h-6 w-6" />
          {APP_TEXTS.app.name}
        </Link>
        <nav className="flex items-center gap-4">
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
          <SignedIn>
            <Link href="/" className="text-sm hover:underline">
              {texts.dashboard}
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
