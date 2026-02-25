"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { PageContainer } from "@/frontend/components/common/page-container";
import { SectionHeader } from "@/frontend/components/common/section-header";
import type { Section, Question, Exam } from "@/backend/db/schema";
import { cn } from "@/lib/utils";

interface SectionWithQuestions {
  section: Section;
  questions: Question[];
}

interface IncorrectQuestionsScreenProps {
  examId: number;
  exam: Exam;
  mode?: "incorrect" | "favorite"; // モード追加
}

export default function IncorrectQuestionsScreen({
  examId,
  exam,
  mode = "incorrect",
}: IncorrectQuestionsScreenProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionWithQuestions[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(),
  );

  const title =
    mode === "favorite"
      ? `${exam.title} - お気に入り (試験別)`
      : `${exam.title} - 学習履歴 (試験別)`;
  const subtitle =
    mode === "favorite"
      ? "お気に入りに登録した問題を確認して復習しましょう"
      : "間違えた問題を確認して復習しましょう";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint =
          mode === "favorite"
            ? `/api/exams/${examId}/favorite-questions`
            : `/api/exams/${examId}/incorrect-questions`;

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setSections(data.sections);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, mode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              エラーが発生しました
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button
              onClick={() => router.push(`/exams/${examId}`)}
              className="mt-4"
            >
              試験選択へ戻る
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const handleNavigation = (value: string) => {
    if (value === "history") {
      router.push("/history");
    } else if (value === "incorrect") {
      // modeがfavoriteの場合はincorrectへ遷移
      if (mode === "favorite") {
        router.push(`/history/incorrect?examId=${examId}`);
      }
      // すでにincorrectなら何もしない（あるいはリロード）
    } else if (value === "favorite") {
      // modeがincorrectの場合はfavoriteへ遷移
      if (mode === "incorrect") {
        router.push(`/history/favorite?examId=${examId}`);
      }
    }
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const renderContent = () => {
    if (sections.length === 0) {
      return (
        <Card className="mt-8">
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              {mode === "favorite"
                ? "お気に入りに登録された問題はありません。"
                : "素晴らしい！現在、間違えたままの問題はありません。"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {mode === "favorite"
                ? "演習中にお気に入りボタンを押すとここに表示されます。"
                : "全ての問題に正解しているか、まだ問題を解いていません。"}
            </p>
            <Button onClick={() => router.push(`/exams/${examId}`)}>
              試験選択へ戻る
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="mt-8 space-y-3">
          {sections.map(({ section, questions }) => {
            const isExpanded = expandedSections.has(section.id);

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base">
                          #{String(section.order).padStart(2, "0")}{" "}
                          {section.title}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {mode === "favorite"
                            ? "お気に入り: "
                            : "間違えた問題: "}
                          {questions
                            .map(
                              (q) =>
                                `#${String(section.order).padStart(2, "0")}-${q.order}`,
                            )
                            .join(", ")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          // お気に入りの再挑戦リンク（リセットはしない、ただそのセクションへ飛ぶ）
                          // いや、学習履歴の間違えた問題はリセットして再挑戦できた。
                          // お気に入りの場合は？
                          // 要望: 「お気に入り問題も試験別で管理してください... 間違えた問題にも反映させてください」
                          // 「学習履歴の間違えた問題とお気に入り問題は再挑戦できるようにしてください。」

                          // お気に入りの再挑戦は、単にそのセクションの問題へ飛びたいのか、それともお気に入り問題だけ解きたいのか？
                          // 現状の実装ではセクション単位でしか解けない (/sections/[id])。
                          // 特定の問題だけ解く機能はない。
                          // なので、とりあえずセクションへ遷移させる。
                          // 間違えた問題の場合はリセットAPIを叩いていた。
                          // お気に入りの場合はリセット不要（あるいは全てリセットして挑戦？）
                          // シンプルにセクションへ遷移させる。

                          if (mode === "incorrect") {
                            try {
                              const response = await fetch(
                                `/api/learning/units/${section.id}/reset?incorrectOnly=true`,
                                {
                                  method: "POST",
                                },
                              );
                              if (!response.ok) {
                                throw new Error("Failed to reset progress");
                              }
                            } catch (error) {
                              console.error(
                                "Failed to retry incorrect questions:",
                                error,
                              );
                              // Continue anyway?
                            }
                          }

                          const timestamp = Date.now();
                          // 特定の問題を指定して遷移することは今のところできない（StudySessionScreenが未対応、あるいは対応中？）
                          // クエリパラメータ ?question=X で特定問題から開始できる機能はStudySessionScreenにある。
                          // しかし複数ある場合は？
                          // とりあえずセクションの最初へ。
                          window.location.href = `/sections/${section.id}?retry=${timestamp}&mode=${mode}`;
                        }}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        再挑戦
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-3">
                      {questions.map((question) => (
                        <div
                          key={question.id}
                          className="p-4 border rounded-lg bg-muted/20"
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-sm text-muted-foreground min-w-[60px]">
                              #{String(section.order).padStart(2, "0")}-
                              {question.order}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium mb-2 text-sm">
                                {question.questionText}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <p>A: {question.optionA}</p>
                                <p>B: {question.optionB}</p>
                                <p>C: {question.optionC}</p>
                                <p>D: {question.optionD}</p>
                              </div>
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-xs font-semibold text-green-800 mb-1">
                                  正解: {question.correctAnswer}
                                </p>
                                {question.explanation && (
                                  <p className="text-xs text-green-700">
                                    {question.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/exams/${examId}`)}
          >
            試験選択へ戻る
          </Button>
        </div>
      </>
    );
  };

  return (
    <PageContainer>
      <SectionHeader title={title} subtitle={subtitle} />

      {/* Navigation Dropdown */}
      <div className="mb-6 mt-4 flex items-center gap-3">
        <div className="relative w-fit">
          <select
            value={mode} // "incorrect" or "favorite"
            onChange={(e) => handleNavigation(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-sm font-medium shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer hover:bg-gray-50 transition-colors w-[240px]"
          >
            <option value="history">学習履歴 (全体)</option>
            <option value="incorrect">間違えた問題 (試験別)</option>
            <option value="favorite">お気に入り (試験別)</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* お気に入り設定ボタン（お気に入りモードの時のみ表示） */}
        {mode === "favorite" && (
          <Button
            variant="outline"
            onClick={() => router.push("/settings/favorite")}
            className="text-sm"
          >
            お気に入り設定
          </Button>
        )}
      </div>

      {renderContent()}
    </PageContainer>
  );
}
