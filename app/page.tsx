import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">
          資格試験対策アプリ
        </h1>
        <p className="text-xl text-muted-foreground">
          効率的な学習で資格試験合格を目指しましょう
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/sign-up">今すぐ始める</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">ログイン</Link>
          </Button>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📚 セクション学習</h3>
            <p className="text-sm text-muted-foreground">
              7問1セットの問題で効率的に学習
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">🎯 模擬テスト</h3>
            <p className="text-sm text-muted-foreground">
              ランダム50問で本番さながらの演習
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📊 学習履歴</h3>
            <p className="text-sm text-muted-foreground">
              進捗を可視化してモチベーション維持
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
