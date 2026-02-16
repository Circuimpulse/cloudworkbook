"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check, X, Menu, Star } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import type {
  Section,
  Question,
  SectionQuestionProgress,
  Exam,
} from "@/backend/db/schema";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import FavoriteToggles from "@/frontend/components/common/FavoriteToggles";

/**
 * クイズ画面（問題を解く画面）
 */
interface QuizesScreenProps {
  section: Section;
  questions: Question[];
  userId: string;
  initialQuestionNumber?: number; // 1-indexed question number
  questionsProgress?: SectionQuestionProgress[]; // 問題ごとの進捗
  progress?: any; // セクション全体の進捗
  exam?: Exam;
  prevSection?: Section | null;
  nextSection?: Section | null;
  mode?: "incorrect" | "favorite" | undefined; // モード追加
}

export default function QuizesScreen({
  section,
  questions,
  userId,
  initialQuestionNumber,
  questionsProgress = [],
  progress,
  exam,
  prevSection,
  nextSection,
  mode, // modeを受け取る
}: QuizesScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const texts = APP_TEXTS.quizes;

  // URLクエリパラメータから問題番号を取得 (1-indexed)
  const questionParam = searchParams.get("question");

  // 初期表示時に最初の未回答問題を見つける
  const findFirstUnansweredIndex = () => {
    if (questionParam) {
      // URLパラメータで指定された問題
      return Math.max(
        0,
        Math.min(parseInt(questionParam, 10) - 1, questions.length - 1),
      );
    }

    if (initialQuestionNumber) {
      if (questions.length === 0) return 0;
      return Math.max(
        0,
        Math.min(initialQuestionNumber - 1, questions.length - 1),
      );
    }

    // questionsProgressから正解済みでない最初の問題を探す
    if (questionsProgress && questionsProgress.length > 0) {
      const firstUnanswered = questions.findIndex((q) => {
        const progress = questionsProgress.find((p) => p.questionId === q.id);
        return !progress || !progress.isCorrect;
      });

      if (firstUnanswered !== -1) {
        return firstUnanswered;
      }
    }

    return 0;
  };

  const startIndex = findFirstUnansweredIndex();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(startIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  // 初期進捗データから回答履歴を生成
  const [answers, setAnswers] = useState<
    { questionId: number; answer: string; isCorrect: boolean }[]
  >(() => {
    if (!questionsProgress || questionsProgress.length === 0) return [];

    // 現在の問題セットに含まれる進捗のみをフィルタリング
    // (Propsで渡されるprogressはSection単位なので基本全て対象だが念のため)
    return questionsProgress.map((p) => ({
      questionId: p.questionId,
      answer: p.userAnswer || "", // 空文字の場合は未回答扱いになる可能性あり
      isCorrect: p.isCorrect,
    }));
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // お気に入り状態を管理（questionId -> { isFavorite1, isFavorite2, isFavorite3 }）
  const [favorites, setFavorites] = useState<
    Record<
      number,
      { isFavorite1: boolean; isFavorite2: boolean; isFavorite3: boolean }
    >
  >({});

  // ...

  // ...

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white font-sans text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">
            対象の問題はありません。
          </p>
          <Button onClick={() => router.back()}>戻る</Button>
        </div>
      </div>
    );
  }

  // 変数を先に定義
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return <div>Question not found</div>;
  }
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Calculate stats
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalAnswered = answers.length;
  const accuracy =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  // handleFinishQuizを先に定義（useEffectで使用するため）
  const handleFinishQuiz = useCallback(
    async (redirectToList = true) => {
      setIsSubmitting(true);

      try {
        // 最後の問題の回答を含めて正解数を計算
        const finalAnswers = showResult
          ? answers
          : [
              ...answers,
              {
                questionId: currentQuestion.id,
                answer: selectedAnswer,
                isCorrect: selectedAnswer === currentQuestion.correctAnswer,
              },
            ];

        const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
        const totalCount = finalAnswers.length;

        const response = await fetch("/api/user/progress/units", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sectionId: section.id,
            correctCount,
            totalCount,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save progress");
        }

        if (redirectToList) {
          // 問題一覧画面に遷移
          router.push(`/sections/${section.id}/list`);
          router.refresh();
        }
      } catch (error) {
        console.error("Error saving progress:", error);
        alert(APP_TEXTS.errors.saveFailed);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      answers,
      showResult,
      currentQuestion.id,
      selectedAnswer,
      section.id,
      router,
    ],
  );

  // 最後の問題で全問回答済みになったら自動的に完了画面に遷移
  useEffect(() => {
    if (
      isLastQuestion &&
      answers.length === questions.length &&
      showResult &&
      !showCompletionScreen &&
      !isSubmitting
    ) {
      const timer = setTimeout(async () => {
        await handleFinishQuiz(false);
        setShowCompletionScreen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    isLastQuestion,
    answers.length,
    questions.length,
    showResult,
    showCompletionScreen,
    isSubmitting,
    handleFinishQuiz,
  ]);

  // Update URL when question changes to support reloading
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentQuestionParam = params.get("question");
    const newQuestionNumber = (currentQuestionIndex + 1).toString();

    // 既に同じ問題番号の場合は更新しない
    if (currentQuestionParam === newQuestionNumber) return;

    params.set("question", newQuestionNumber);

    // Replace URL without adding to history stack, and prevent scrolling to top
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [currentQuestionIndex, router, searchParams]);

  // 問題が変わったときに、既存の回答を復元
  useEffect(() => {
    const existingAnswer = answers.find(
      (a) => a.questionId === currentQuestion.id,
    );
    if (existingAnswer) {
      setSelectedAnswer(existingAnswer.answer);
      setShowResult(true);
    } else {
      setSelectedAnswer("");
      setShowResult(false);
    }
  }, [currentQuestionIndex, currentQuestion.id]);

  // お気に入り状態を初期化
  useEffect(() => {
    const fetchFavorites = async () => {
      const favoriteStatuses: Record<
        number,
        { isFavorite1: boolean; isFavorite2: boolean; isFavorite3: boolean }
      > = {};
      for (const question of questions) {
        try {
          const response = await fetch(
            `/api/questions/${question.id}/favorite`,
          );
          if (response.ok) {
            const data = await response.json();
            favoriteStatuses[question.id] = {
              isFavorite1: data.isFavorite1,
              isFavorite2: data.isFavorite2,
              isFavorite3: data.isFavorite3,
            };
          }
        } catch (error) {
          console.error(
            `Failed to fetch favorite status for question ${question.id}:`,
            error,
          );
        }
      }
      setFavorites(favoriteStatuses);
    };

    fetchFavorites();
  }, [questions]);

  // ...

  // お気に入りをトグル
  const handleToggleFavorite = async (questionId: number, level: number) => {
    try {
      const response = await fetch(`/api/questions/${questionId}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ level }),
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites((prev) => ({
          ...prev,
          [questionId]: {
            isFavorite1: data.isFavorite1,
            isFavorite2: data.isFavorite2,
            isFavorite3: data.isFavorite3,
          },
        }));
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return; // 既に結果表示中は何もしない

    setSelectedAnswer(answer);

    // 選択と同時に正誤判定を実行
    const isCorrect = answer === currentQuestion.correctAnswer;
    setShowResult(true);

    // DBに進捗を保存（バックグラウンド実行）
    fetch("/api/user/progress/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sectionId: section.id,
        questionId: currentQuestion.id,
        userAnswer: answer,
        isCorrect,
      }),
    }).catch((error) => {
      console.error("Failed to save question progress:", error);
    });

    // 既に同じ問題の回答がある場合は更新、なければ追加
    setAnswers((prevAnswers) => {
      const existingIndex = prevAnswers.findIndex(
        (a) => a.questionId === currentQuestion.id,
      );
      if (existingIndex >= 0) {
        // 既存の回答を更新
        const newAnswers = [...prevAnswers];
        newAnswers[existingIndex] = {
          questionId: currentQuestion.id,
          answer: answer,
          isCorrect,
        };
        return newAnswers;
      } else {
        // 新しい回答を追加
        return [
          ...prevAnswers,
          {
            questionId: currentQuestion.id,
            answer: answer,
            isCorrect,
          },
        ];
      }
    });
  };

  const handleSubmitAnswer = () => {
    // この関数は使用されなくなるが、互換性のため残す
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setShowResult(true);

    setAnswers([
      ...answers,
      {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        isCorrect,
      },
    ]);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // useEffectで状態が復元される
    }
  };

  const handleNextQuestion = async () => {
    if (isLastQuestion) {
      // 最後の問題の場合、進捗を保存してから完了画面を表示
      await handleFinishQuiz(false); // redirectToList = false
      setShowCompletionScreen(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // useEffectで状態が復元される
    }
  };

  // リストボタンのハンドラー（進捗を保存して問題一覧画面へ）
  const handleGoToList = async () => {
    if (answers.length > 0) {
      // 回答がある場合は保存してから遷移
      await handleFinishQuiz();
    } else {
      // 回答がない場合はそのまま問題一覧画面に遷移
      router.push(`/sections/${section.id}/list`);
    }
  };

  // Helper to render option indicator (A, B, C, D circle or Check/X icon)
  const renderOptionIndicator = (optionKey: string) => {
    const isSelected = selectedAnswer === optionKey;
    const isCorrectAnswer = currentQuestion.correctAnswer === optionKey;

    if (showResult) {
      if (isCorrectAnswer) {
        // Correct answer always shows check
        return (
          <Check className="w-8 h-8 text-green-600 font-bold" strokeWidth={4} />
        );
      }
      if (isSelected && !isCorrectAnswer) {
        // Wrong selection shows X
        return <X className="w-8 h-8 text-red-500 font-bold" strokeWidth={4} />;
      }
      // Other options show letter in circle
      return (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-medium">
          {optionKey}
        </div>
      );
    }

    // Default state: Letter in circle
    return (
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-xl font-medium transition-all",
          isSelected
            ? "bg-blue-600 text-white scale-110"
            : "bg-blue-500 text-white",
        )}
      >
        {optionKey}
      </div>
    );
  };

  // 完了画面を表示
  if (showCompletionScreen) {
    return (
      <div className="min-h-screen bg-white font-sans text-slate-800">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* ページナビゲーション */}
          <div className="text-center mb-8 text-sm">
            {prevSection && (
              <>
                <button
                  onClick={() => router.push(`/sections/${prevSection.id}`)}
                  className="text-blue-500 hover:text-blue-700 hover:underline"
                >
                  {prevSection.title}
                </button>
                <span className="mx-2">—</span>
              </>
            )}
            <span className="font-bold">{section.title}</span>
            {nextSection && (
              <>
                <span className="mx-2">—</span>
                <button
                  onClick={() => router.push(`/sections/${nextSection.id}`)}
                  className="text-blue-500 hover:text-blue-700 hover:underline"
                >
                  {nextSection.title}
                </button>
              </>
            )}
          </div>

          {/* ヘッダー */}
          <header className="mb-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="font-bold text-xl">CloudWorkbook</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {exam?.title || section.title}
            </h1>
            <div className="text-lg text-slate-600">
              学習を記録するには、いずれかのボタンを押してください。
            </div>
            <div className="mt-2 text-base">
              現在の学習モードは{" "}
              <span className="text-red-600 font-bold">
                {mode === "favorite"
                  ? "「お気に入り①②③ or」"
                  : mode === "incorrect"
                    ? "「間違えた問題」"
                    : "「新規」"}
              </span>{" "}
              です。
            </div>
          </header>

          {/* アクションボタン */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Button
              onClick={() => {
                // 完了画面の状態を保持するためにクエリパラメータを追加
                router.push(`/sections/${section.id}/list?from=completion`);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-8 text-lg font-bold shadow-lg h-auto whitespace-normal"
            >
              リストを確認
            </Button>

            <Button
              onClick={async () => {
                try {
                  // 間違った問題のみリセット（正解した問題はそのまま保持）
                  const response = await fetch(
                    `/api/learning/units/${section.id}/reset?incorrectOnly=true`,
                    {
                      method: "POST",
                    },
                  );

                  if (!response.ok) {
                    throw new Error("Failed to reset progress");
                  }

                  // 間違えた問題モードで遷移
                  const timestamp = Date.now();
                  window.location.href = `/sections/${section.id}?retry=${timestamp}&mode=incorrect`;
                } catch (error) {
                  console.error("Failed to retry incorrect questions:", error);
                  alert("進捗のリセットに失敗しました");
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-8 text-lg font-bold shadow-lg h-auto whitespace-normal"
            >
              同じ問題を挑戦（間違った問題）
            </Button>

            <Button
              onClick={() => {
                // 試験IDがある場合は試験別の学習履歴へ、なければ全体の履歴へ
                if (exam?.id) {
                  router.push(`/history/incorrect?examId=${exam.id}`);
                } else {
                  router.push("/history");
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-8 text-lg font-bold shadow-lg h-auto whitespace-normal"
            >
              学習履歴を見る
            </Button>

            <Button
              onClick={async () => {
                // 次のセクションに進む
                if (nextSection) {
                  try {
                    // モードに応じてリセット処理を変更
                    if (mode === "incorrect") {
                      // 間違えた問題モードの場合は、間違えた問題のみリセット
                      const response = await fetch(
                        `/api/learning/units/${nextSection.id}/reset?incorrectOnly=true`,
                        {
                          method: "POST",
                        },
                      );
                      if (!response.ok) {
                        throw new Error("Failed to reset progress");
                      }
                    } else if (mode === "favorite") {
                      // お気に入りモードの場合は、リセットしない（お気に入り問題のみ表示）
                      // リセット不要
                    } else {
                      // 通常モードの場合は、全てリセット
                      const response = await fetch(
                        `/api/learning/units/${nextSection.id}/reset`,
                        {
                          method: "POST",
                        },
                      );
                      if (!response.ok) {
                        throw new Error("Failed to reset progress");
                      }
                    }

                    // モードを保持して遷移
                    const timestamp = Date.now();
                    const modeParam = mode ? `&mode=${mode}` : "";
                    window.location.href = `/sections/${nextSection.id}?retry=${timestamp}${modeParam}`;
                  } catch (error) {
                    console.error("Failed to reset next section:", error);
                    alert("進捗のリセットに失敗しました");
                  }
                } else if (exam) {
                  window.location.href = `/exams/${exam.id}`;
                } else {
                  window.location.href = "/";
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-8 text-lg font-bold shadow-lg h-auto whitespace-normal"
            >
              次の問題を挑戦（昇順）
            </Button>
          </div>

          {/* 成績表示 */}
          <div className="text-center mt-12 space-y-2">
            <p className="text-xl font-bold">
              正解数: {correctCount}/{answers.length}問
            </p>
            <p className="text-lg">正答率: {accuracy}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {mode ? (
                // モード表示
                <span className="font-bold text-primary mr-2">
                  {mode === "incorrect"
                    ? "再挑戦: 間違えた問題"
                    : "再挑戦: お気に入り"}
                </span>
              ) : null}
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {correctCount} / {answers.length} 正解
            </span>
          </div>
          <Progress value={(currentQuestionIndex / questions.length) * 100} />
        </div>
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-bold text-xl flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3-1.3-3-3v-6c0-1.7 1.3-3 3-3h11c1.7 0 3 1.3 3 3v2" />
                <path d="M20.665 14.83a2.5 2.5 0 0 0-3.665-4" />
                <path d="M20.665 14.83c.21 .15 .4 .34 .555 .56" />
                <path d="M12 12v.01" />
              </svg>
              CloudWorkbook
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">
              {exam?.title || section.title}
            </h1>
            <div className="flex items-center justify-between text-sm mt-1">
              <div className="flex items-center">
                <span className="font-medium mr-4">
                  問題{currentQuestionIndex + 1}
                </span>
                <span className="text-slate-500 text-xs sm:text-sm">
                  {section.title} - {section.description?.slice(0, 20)}...
                </span>
              </div>

              {/* セクション間ナビゲーション */}
              <div className="flex items-center gap-2 text-sm">
                {prevSection ? (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/learning/units/${prevSection.id}/reset`,
                          {
                            method: "POST",
                          },
                        );
                        if (!response.ok) {
                          throw new Error("Failed to reset progress");
                        }
                        const timestamp = Date.now();
                        window.location.href = `/sections/${prevSection.id}?retry=${timestamp}`;
                      } catch (error) {
                        console.error(
                          "Failed to reset previous section:",
                          error,
                        );
                        alert("進捗のリセットに失敗しました");
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700 transition-colors font-medium"
                  >
                    #{String(prevSection.order).padStart(2, "0")}
                  </button>
                ) : (
                  <span className="text-gray-400">
                    #{String(section.order).padStart(2, "0")}
                  </span>
                )}
                <span className="text-gray-400">-</span>
                {nextSection ? (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/learning/units/${nextSection.id}/reset`,
                          {
                            method: "POST",
                          },
                        );
                        if (!response.ok) {
                          throw new Error("Failed to reset progress");
                        }
                        const timestamp = Date.now();
                        window.location.href = `/sections/${nextSection.id}?retry=${timestamp}`;
                      } catch (error) {
                        console.error("Failed to reset next section:", error);
                        alert("進捗のリセットに失敗しました");
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700 transition-colors font-medium"
                  >
                    #{String(nextSection.order).padStart(2, "0")}
                  </button>
                ) : (
                  <span className="text-gray-400">
                    #{String(section.order).padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>

            {/* 進捗インジケーター */}
            <div className="flex items-center gap-2 mt-3">
              {questions.map((q, index) => {
                const answer = answers.find((a) => a.questionId === q.id);
                const isCurrent = index === currentQuestionIndex;

                let bgColor = "bg-gray-300"; // 未回答
                if (answer) {
                  bgColor = answer.isCorrect ? "bg-green-500" : "bg-red-500";
                }

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      bgColor,
                      isCurrent && "ring-2 ring-blue-500 ring-offset-2",
                    )}
                    title={`問題${index + 1}${answer ? (answer.isCorrect ? " (正解)" : " (不正解)") : " (未回答)"}`}
                  />
                );
              })}
            </div>
          </div>
          <div className="w-full h-px bg-slate-200 mt-4" />
        </header>

        {/* Question Text */}
        <div className="mb-8">
          {(() => {
            const currentAnswer = answers.find(
              (a) => a.questionId === currentQuestion.id,
            );
            const isAlreadyCorrect = currentAnswer?.isCorrect === true;
            const isFavorite = favorites[currentQuestion.id] || {
              isFavorite1: false,
              isFavorite2: false,
              isFavorite3: false,
            };

            return (
              <>
                {isAlreadyCorrect && (
                  <div className="mb-4 bg-green-50 border border-green-300 rounded-lg p-3 text-sm text-green-800">
                    ✓ この問題は既に正解済みです。説明を確認できます。
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <p className="text-lg leading-relaxed font-medium flex-1">
                    {currentQuestion.questionText}
                  </p>
                  <FavoriteToggles
                    key={currentQuestion.id}
                    questionId={currentQuestion.id}
                    initialStatus={{
                      isFavorite1: isFavorite.isFavorite1 || false,
                      isFavorite2: isFavorite.isFavorite2 || false,
                      isFavorite3: isFavorite.isFavorite3 || false,
                      isFavorite: false, // Legacy flag not tracked in local state but required by component
                    }}
                    onUpdate={(newStatus) => {
                      setFavorites((prev) => ({
                        ...prev,
                        [currentQuestion.id]: {
                          isFavorite1: newStatus.isFavorite1,
                          isFavorite2: newStatus.isFavorite2,
                          isFavorite3: newStatus.isFavorite3,
                        },
                      }));
                    }}
                  />
                </div>
              </>
            );
          })()}
        </div>

        {/* Options Area */}
        <div className="relative rounded-lg overflow-hidden border border-slate-200 mb-8 shadow-sm">
          {/* Left Blue Bar Background */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-blue-300/50 z-0" />

          {/* Options List */}
          <div className="relative z-10">
            {["A", "B", "C", "D"].map((optionKey) => {
              const optionText = currentQuestion[
                `option${optionKey}` as keyof Question
              ] as string;
              const isSelected = selectedAnswer === optionKey;

              // 現在の問題が正解済みかチェック
              const currentAnswer = answers.find(
                (a) => a.questionId === currentQuestion.id,
              );
              const isAlreadyCorrect = currentAnswer?.isCorrect === true;

              return (
                <div
                  key={optionKey}
                  onClick={() => {
                    // 正解済みの問題は選択できない
                    if (!isAlreadyCorrect) {
                      handleAnswerSelect(optionKey);
                    }
                  }}
                  className={cn(
                    "flex items-center min-h-[80px] transition-colors border-b last:border-0 border-slate-100",
                    isAlreadyCorrect
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer",
                    isSelected && !showResult
                      ? "bg-blue-50"
                      : !isAlreadyCorrect && "hover:bg-slate-50",
                  )}
                >
                  {/* Indicator Column */}
                  <div className="w-20 flex-shrink-0 flex items-center justify-center">
                    {renderOptionIndicator(optionKey)}
                  </div>

                  {/* Text Column */}
                  <div className="flex-1 p-4 text-base">{optionText}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation Section */}
        {showResult && (
          <div className="mb-8 border border-slate-300 rounded-xl p-6 bg-white shadow-sm">
            <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2 text-sm">
              問題{currentQuestionIndex + 1}の説明及び補足
            </h3>
            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
              <ReactMarkdown>
                {currentQuestion.explanation || "解説は準備中です。"}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Footer / Navigation */}
        <div className="mt-12 flex flex-col items-center justify-center gap-6">
          <div className="text-sm text-slate-600 font-medium">
            {showResult ? (
              <p>
                現在のあなたの成績{correctCount}/{totalAnswered}問正解！！
                正答率{accuracy}%
              </p>
            ) : (
              <p>
                問題は全部で{questions.length}問。ちょっとずつ頑張りましょう。
              </p>
            )}
          </div>

          <div className="flex items-center gap-8 w-full justify-center relative">
            {/* Previous Arrow (Left side) - 最初の問題以外で表示 */}
            {currentQuestionIndex > 0 && (
              <div className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2">
                <button
                  onClick={handlePreviousQuestion}
                  className="transition-all duration-200 p-2 rounded-full hover:bg-slate-100 text-blue-600"
                  aria-label="前の問題"
                >
                  <ArrowLeft className="w-10 h-10" strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* List Button (Centered) */}
            <Button
              onClick={handleGoToList}
              className="rounded-full px-12 py-6 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base shadow-md transition-transform active:scale-95"
            >
              リスト
            </Button>

            {/* Next Arrow (Right side) - 常に表示 */}
            <div className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2">
              <button
                onClick={handleNextQuestion}
                className="transition-all duration-200 p-2 rounded-full hover:bg-slate-100 text-blue-600"
                aria-label={isLastQuestion ? "完了" : "次の問題"}
              >
                <ArrowRight className="w-10 h-10" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
