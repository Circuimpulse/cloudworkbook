import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ダッシュボード</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">📚 セクション学習</h2>
            <p className="text-muted-foreground mb-4">
              7問1セットの問題で効率的に学習しましょう
            </p>
            <Button asChild>
              <Link href="/sections">セクション一覧へ</Link>
            </Button>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">🎯 模擬テスト</h2>
            <p className="text-muted-foreground mb-4">
              ランダム50問で本番さながらの演習
            </p>
            <Button asChild>
              <Link href="/mock-test">模擬テストを開始</Link>
            </Button>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">📊 学習履歴</h2>
          <p className="text-muted-foreground mb-4">
            あなたの学習進捗を確認できます
          </p>
          <Button asChild variant="outline">
            <Link href="/history">履歴を見る</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
