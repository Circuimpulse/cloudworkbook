"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Cloud } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import type {
  Section,
  SectionProgress,
  SectionQuestionProgress,
  Question,
  Exam,
} from "@/backend/db/schema";

/**
 * 進捗リスト画面
 * Figmaデザインに基づいた実装
 * セクションごとの7問の進捗状況を表示
 */
interface ListScreenProps {
  sections: (Section & { exam?: Exam | null })[];
  progressList: SectionProgress[];
  questionsProgress: SectionQuestionProgress[];
  initialSectionId?: number;
  currentQuestions: Question[];
}

export default function ListScreen({
  sections,
  progressList,
  questionsProgress,
  initialSectionId,
  currentQuestions,
}: ListScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const texts = APP_TEXTS.list;

  // URLパラメータまたはpropsからセクションIDを取得、なければ最初のセクション
  const sectionIdParam = searchParams.get("sectionId");
  const currentSectionId = sectionIdParam
    ? parseInt(sectionIdParam, 10)
    : initialSectionId || sections[0]?.id || 1;

  const currentSection = useMemo(() => {
    return (
      sections.find((s) => s.id === currentSectionId) ||
      sections[0] || {
        id: 0,
        title: "未選択",
        order: 0,
        description: "",
      }
    );
  }, [sections, currentSectionId]);

  // 同じ試験区分のセクションのみを抽出してナビゲーションに使用
  const examSections = useMemo(() => {
    if (!currentSection?.examId) return sections;
    return sections.filter((s) => s.examId === currentSection.examId);
  }, [sections, currentSection]);

  // 前後のセクション（同一試験内）
  const currentSectionIndex = examSections.findIndex(
    (s) => s.id === currentSection.id,
  );
  const prevSection =
    currentSectionIndex > 0 ? examSections[currentSectionIndex - 1] : null;
  const nextSection =
    currentSectionIndex < examSections.length - 1
      ? examSections[currentSectionIndex + 1]
      : null;

  // Breadcrumb logic removed/simplified as it was hardcoded or unused

  // 現在のセクションの進捗を取得 (フォールバック用)
  const currentProgress = progressList.find(
    (p) => p.sectionId === currentSection.id,
  );

  // 7問の問題ステータスを生成
  // DBの sectionQuestionProgress から正確なデータを取得
  const displayQuestions =
    currentQuestions.length > 0
      ? currentQuestions
      : Array.from({ length: 7 }, (_, i) => ({ id: i + 1 }) as any);

  const questions = displayQuestions.map((q, i) => {
    const questionNumber = i + 1;
    let status: "correct" | "incorrect" | "pending" = "pending";

    // DBの問題IDがあれば、それを使って進捗を探す
    if (currentQuestions.length > 0) {
      const progress = questionsProgress.find((p) => p.questionId === q.id);
      if (progress) {
        status = progress.isCorrect ? "correct" : "incorrect";
      }
    } else {
      // フォールバック: progressList (古いロジック)
      if (currentProgress) {
        if (questionNumber <= currentProgress.correctCount) {
          status = "correct";
        } else if (questionNumber <= currentProgress.totalCount) {
          status = "incorrect";
        }
      }
    }

    return {
      id: questionNumber, // 表示用ID (1-7)
      status,
    };
  });

  const correctCount = questions.filter((q) => q.status === "correct").length;
  const totalAnswered = questions.filter((q) => q.status !== "pending").length;
  const accuracyRate =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const handleQuestionClick = (questionNumber: number) => {
    // セクションの問題画面に遷移（問題番号は1-indexed）
    router.push(`/sections/${currentSection.id}?question=${questionNumber}`);
  };

  const lastQuestion = searchParams.get("lastQuestion");

  const handleBackToDashboard = () => {
    if (lastQuestion) {
      router.push(`/sections/${currentSection.id}?question=${lastQuestion}`);
    } else if (currentSection.examId) {
      router.push(`/exams/${currentSection.examId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handlePrevSection = async () => {
    if (prevSection) {
      try {
        await fetch(`/api/sections/${prevSection.id}/reset`, {
          method: "POST",
        });
      } catch (e) {
        console.error(e);
      }
      router.push(`/list?sectionId=${prevSection.id}`);
    }
  };

  const handleNextSection = async () => {
    if (nextSection) {
      try {
        await fetch(`/api/sections/${nextSection.id}/reset`, {
          method: "POST",
        });
      } catch (e) {
        console.error(e);
      }
      router.push(`/list?sectionId=${nextSection.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* メインカードコンテナ */}
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* ヘッダーロゴエリア */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-black" fill="currentColor" />
            <span className="text-xl font-bold tracking-tight">
              CloudWorkbook
            </span>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="p-8">
          {/* タイトルとナビゲーション */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
            <h1 className="text-2xl font-bold">
              {currentSection.exam?.title || currentSection.title}
            </h1>
            {/* セクション間ナビゲーション */}
            <div className="flex items-center gap-2 text-sm">
              {prevSection ? (
                <button
                  onClick={handlePrevSection}
                  className="text-blue-500 hover:text-blue-700 transition-colors font-medium"
                >
                  #{String(prevSection.order).padStart(2, "0")}
                </button>
              ) : (
                <span className="text-gray-400">
                  #{String(currentSection.order).padStart(2, "0")}
                </span>
              )}
              <span className="text-gray-400">-</span>
              {nextSection ? (
                <button
                  onClick={handleNextSection}
                  className="text-blue-500 hover:text-blue-700 transition-colors font-medium"
                >
                  #{String(nextSection.order).padStart(2, "0")}
                </button>
              ) : (
                <span className="text-gray-400">
                  #{String(currentSection.order).padStart(2, "0")}
                </span>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-gray-300 mb-8" />

          {/* 上部戻るボタン */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={handleBackToDashboard}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-12 py-6 text-base font-bold shadow-md shadow-blue-200"
            >
              戻る
            </Button>
          </div>

          {/* ステータス説明バー */}
          <div className="flex justify-center mb-8">
            <div className="bg-blue-100/50 text-slate-600 px-12 py-1 rounded-full text-sm font-medium border border-blue-200 w-full max-w-md text-center">
              白は未完了の項目です。
            </div>
          </div>

          {/* 問題グリッド (7問) */}
          <div className="border-l border-t border-black overflow-hidden mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {questions.map((q) => {
                // 背景色の決定
                let bgColor = "bg-white";
                let textColor = "text-black";

                if (q.status === "correct") {
                  bgColor = "bg-green-800";
                  textColor = "text-white";
                } else if (q.status === "incorrect") {
                  bgColor = "bg-red-600";
                  textColor = "text-white";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionClick(q.id)}
                    className={`
                      ${bgColor} ${textColor}
                      h-32 flex items-center justify-center text-2xl font-bold
                      border-r border-b border-black
                      transition-all hover:opacity-80 active:scale-95
                      cursor-pointer
                    `}
                  >
                    {q.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* フッター成績エリア */}
          <div className="text-center mb-8 space-y-1">
            <p className="font-bold text-sm">
              現在のあなたの成績{correctCount}/{questions.length}問正解！！
            </p>
            <p className="font-bold text-sm">正答率{accuracyRate}%</p>
          </div>

          {/* 下部アクションエリア - セクションナビゲーション付き */}
          <div className="relative flex justify-center items-center">
            {/* 前のセクションへ (左側) */}
            {prevSection && (
              <button
                onClick={handlePrevSection}
                className="absolute left-0 p-2 text-blue-600 hover:text-blue-800 transition-colors"
                aria-label="前のセクション"
              >
                <ArrowLeft className="h-10 w-10" strokeWidth={2.5} />
              </button>
            )}

            {/* 戻るボタン (中央) */}
            <Button
              onClick={handleBackToDashboard}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-12 py-6 text-base font-bold shadow-md shadow-blue-200"
            >
              戻る
            </Button>

            {/* 次のセクションへ (右側) */}
            {nextSection && (
              <button
                onClick={handleNextSection}
                className="absolute right-0 p-2 text-blue-600 hover:text-blue-800 transition-colors"
                aria-label="次のセクション"
              >
                <ArrowRight className="h-10 w-10" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
