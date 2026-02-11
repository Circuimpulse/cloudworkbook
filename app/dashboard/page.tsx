import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, BarChart3, ArrowRight } from "lucide-react";
import { getAllSections, getAllSectionProgress, getMockTestHistory } from "@/lib/db/queries";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // データ取得
  const sections = await getAllSections();
  const progressList = await getAllSectionProgress(userId);
  const mockTests = await getMockTestHistory(userId, 5);

  // 統計計算
  const totalSections = sections.length;
  const studiedSections = progressList.filter((p) => p.totalCount > 0).length;
  const completedSections = progressList.filter((p) => p.correctCount === 7).length;
  const totalMockTests = mockTests.length;
  const averageScore = mockTests.length > 0
    ? Math.round(mockTests.reduce((sum, test) => sum + test.score, 0) / mockTests.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            ダッシュボード
          </h1>
          <p className="text-muted-foreground text-lg">
            学習の進捗を確認して、次のステップに進みましょう
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                総セクション数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSections}</div>
              <p className="text-xs text-muted-foreground mt-1">
                利用可能なセクション
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                学習済み
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{studiedSections}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalSections > 0 ? Math.round((studiedSections / totalSections) * 100) : 0}% 完了
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                完了済み
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedSections}</div>
              <p className="text-xs text-muted-foreground mt-1">
                全問正解したセクション
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                模擬テスト平均
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{averageScore}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMockTests}回受験
              </p>
            </CardContent>
          </Card>
        </div>

        {/* メイン機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">セクション学習</CardTitle>
              </div>
              <CardDescription className="text-base">
                7問1セットの問題で効率的に学習しましょう。各セクションをマスターして、着実に実力をつけていきます。
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/sections">
                  セクション一覧へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">模擬テスト</CardTitle>
              </div>
              <CardDescription className="text-base">
                ランダム50問で本番さながらの演習。実力を試して、弱点を見つけましょう。
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/mock-test">
                  模擬テストを開始
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* 学習履歴 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">学習履歴</CardTitle>
                <CardDescription>
                  あなたの学習進捗を確認できます
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mockTests.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  最近の模擬テスト
                </h3>
                {mockTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {test.score} / {test.totalQuestions} 問正解
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(test.takenAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.round((test.score / test.totalQuestions) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                まだ模擬テストを受験していません。最初のテストに挑戦してみましょう！
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/history">
                すべての履歴を見る
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
