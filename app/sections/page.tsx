import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllSections, getAllSectionProgress } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";

export default async function SectionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // セクション一覧と進捗を取得
  const sections = await getAllSections();
  const progressList = await getAllSectionProgress(userId);

  // 進捗マップを作成
  const progressMap = new Map(
    progressList.map((p) => [p.sectionId, p])
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            セクション学習
          </h1>
          <p className="text-muted-foreground text-lg">
            7問1セットの問題で効率的に学習しましょう
          </p>
        </div>

        {/* セクション一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const progress = progressMap.get(section.id);
            const progressPercentage = progress
              ? Math.round((progress.correctCount / progress.totalCount) * 100)
              : 0;
            const hasStarted = progress && progress.totalCount > 0;

            return (
              <Card
                key={section.id}
                className="hover:shadow-lg transition-shadow duration-200 flex flex-col"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">
                        {section.title}
                      </CardTitle>
                    </div>
                    {hasStarted && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {progress.correctCount === 7 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {section.description || "7問の問題に挑戦しましょう"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  {hasStarted ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">進捗状況</span>
                        <span className="font-medium">
                          {progress.correctCount} / {progress.totalCount} 問正解
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        正答率: {progressPercentage}%
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      まだ学習を開始していません
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/sections/${section.id}`}>
                      {hasStarted ? "続きから学習" : "学習を開始"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* セクションが空の場合 */}
        {sections.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              セクションがありません
            </h2>
            <p className="text-muted-foreground">
              管理者に問い合わせて、セクションを追加してもらってください。
            </p>
          </div>
        )}

        {/* 統計情報 */}
        {sections.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  総セクション数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{sections.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  学習済み
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {progressList.filter((p) => p.totalCount > 0).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  完了済み
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {progressList.filter((p) => p.correctCount === 7).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
