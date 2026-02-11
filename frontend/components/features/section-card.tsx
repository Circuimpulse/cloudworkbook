import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import type { Section, SectionProgress } from "@/backend/db/schema";

/**
 * セクションカード（進捗表示付き）
 */
interface SectionCardProps {
  section: Section;
  progress?: SectionProgress;
}

export function SectionCard({ section, progress }: SectionCardProps) {
  const texts = APP_TEXTS.list;
  
  const progressPercentage = progress
    ? Math.round((progress.correctCount / progress.totalCount) * 100)
    : 0;
  const hasStarted = progress && progress.totalCount > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col">
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
              <span className="text-muted-foreground">{texts.progressStatus}</span>
              <span className="font-medium">
                {texts.correctAnswers(progress.correctCount, progress.totalCount)}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {texts.accuracyRate(progressPercentage)}
            </p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {texts.notStarted}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/sections/${section.id}`}>
            {hasStarted ? texts.continueStudy : texts.startStudy}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
