import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Clock, Award, History } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import type { MockTestHistory } from "@/backend/db/schema";

interface HistoryScreenProps {
  history: MockTestHistory[];
}

export default function HistoryScreen({ history }: HistoryScreenProps) {
  const texts = APP_TEXTS.dashboard.features.learningHistory; // テキスト再利用
  const commonTexts = APP_TEXTS.actions;

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{texts.title}</h1>
              <p className="text-muted-foreground">{texts.description}</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {APP_TEXTS.list.backToDashboard}
            </Link>
          </Button>
        </div>

        {/* 履歴リスト */}
        {history.length > 0 ? (
          <div className="grid gap-4">
            {history.map((item) => {
              const accuracy = Math.round(
                (item.score / item.totalQuestions) * 100,
              );
              const isPassed = accuracy >= 60; // 仮の合格ライン 60%

              return (
                <Card key={item.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        {new Date(item.takenAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">
                          {item.score}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            / {item.totalQuestions} 問正解
                          </span>
                        </span>
                        {isPassed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Good!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          正答率
                        </div>
                        <div
                          className={`text-2xl font-bold ${isPassed ? "text-green-600" : "text-orange-500"}`}
                        >
                          {accuracy}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12 text-center">
            <CardContent>
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{texts.noTests}</h3>
              <Button asChild className="mt-4">
                <Link href="/mock-test">
                  {APP_TEXTS.dashboard.features.mockTest.action}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
