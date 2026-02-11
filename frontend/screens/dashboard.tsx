import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, BarChart3, ArrowRight } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import { StatsCard } from "@/frontend/components/features/stats-card";
import { FeatureCard } from "@/frontend/components/features/feature-card";
import type { Section, SectionProgress, MockTestHistory } from "@/backend/db/schema";

/**
 * ダッシュボード画面
 */
interface DashboardScreenProps {
  sections: Section[];
  progressList: SectionProgress[];
  mockTests: MockTestHistory[];
}

export default function DashboardScreen({ sections, progressList, mockTests }: DashboardScreenProps) {
  const texts = APP_TEXTS.dashboard;

  // 統計計算（useMemoで最適化）
  const stats = useMemo(() => {
    const totalSections = sections.length;
    const studiedSections = progressList.filter((p) => p.totalCount > 0).length;
    const completedSections = progressList.filter((p) => p.correctCount === 7).length;
    const totalMockTests = mockTests.length;
    const averageScore = mockTests.length > 0
      ? Math.round(mockTests.reduce((sum, test) => sum + test.score, 0) / mockTests.length)
      : 0;

    return {
      totalSections,
      studiedSections,
      completedSections,
      totalMockTests,
      averageScore,
    };
  }, [sections, progressList, mockTests]);

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

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={texts.stats.totalSections}
            value={stats.totalSections}
            description={texts.stats.availableSections}
          />
          <StatsCard
            title={texts.stats.studiedSections}
            value={stats.studiedSections}
            description={
              stats.totalSections > 0
                ? texts.stats.completedPercentage(Math.round((stats.studiedSections / stats.totalSections) * 100))
                : texts.stats.completedPercentage(0)
            }
          />
          <StatsCard
            title={texts.stats.completedSections}
            value={stats.completedSections}
            description={texts.stats.perfectSections}
          />
          <StatsCard
            title={texts.stats.mockTestAverage}
            value={stats.averageScore}
            description={texts.stats.testsTaken(stats.totalMockTests)}
          />
        </div>

        {/* メイン機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FeatureCard
            icon={BookOpen}
            title={texts.features.sectionLearning.title}
            description={texts.features.sectionLearning.description}
            href="/sections"
            actionText={texts.features.sectionLearning.action}
          />
          <FeatureCard
            icon={Target}
            title={texts.features.mockTest.title}
            description={texts.features.mockTest.description}
            href="/mock-test"
            actionText={texts.features.mockTest.action}
            variant="outline"
          />
        </div>

        {/* 学習履歴 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{texts.features.learningHistory.title}</CardTitle>
                <CardDescription>
                  {texts.features.learningHistory.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mockTests.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {texts.features.learningHistory.recentTests}
                </h3>
                {mockTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {texts.features.learningHistory.correctCount(test.score, test.totalQuestions)}
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
                {texts.features.learningHistory.noTests}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/history">
                {texts.features.learningHistory.action}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
