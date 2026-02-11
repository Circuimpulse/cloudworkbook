import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "資格試験対策アプリ",
  description: "効率的な学習で資格試験合格を目指す",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="border-b">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <Link href="/" className="text-xl font-bold">
                資格試験対策アプリ
              </Link>
              <nav className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-sm hover:underline">
                      ログイン
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                      新規登録
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="text-sm hover:underline"
                  >
                    ダッシュボード
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </nav>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
