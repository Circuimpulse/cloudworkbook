import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import { SectionCard } from "@/frontend/components/features/section-card";
import type { Section, SectionProgress } from "@/backend/db/schema";

/**
 * 進捗リスト画面
 * 現在7問中何問解いているか確認する画面
 */
interface ListScreenProps {
  sections: Section[];
  progressList: SectionProgress[];
}

export default function ListScreen({ sections, progressList }: ListScreenProps) {
  const texts = APP_TEXTS.list;

  // 進捗マップを作成（useMemoで最適化）
  const progressMap = useMemo(
    () => new Map(progressList.map((p) => [p.sectionId, p])),
    [progressList]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {texts.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {texts.description}
          </p>
        </div>

        {/* セクション一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              progress={progressMap.get(section.id)}
            />
          ))}
        </div>

        {/* セクションが空の場合 */}
        {sections.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {texts.noSections}
            </h2>
            <p className="text-muted-foreground">
              {texts.noSectionsDescription}
            </p>
          </div>
        )}

        {/* 統計情報 */}
        {sections.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {texts.totalSections}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{sections.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {texts.studiedSections}
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
                  {texts.completedSections}
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

        {/* 戻るボタン */}
        <div className="mt-10">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              {texts.backToDashboard}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
