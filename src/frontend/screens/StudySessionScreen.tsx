"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check, X, Menu, Star, Loader2, Sparkles, LinkIcon } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import type {
  Section,
  Question,
  SectionQuestionProgress,
  Exam,
} from "@/backend/db/schema";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

  // 記述式回答用のstate
  const [fillInAnswer, setFillInAnswer] = useState<string>("");
  // AI採点用のstate
  const [aiScoring, setAiScoring] = useState<Record<number, {
    status: "idle" | "loading" | "success" | "error" | "no_key";
    score?: number;
    isCorrect?: boolean;
    explanation?: string;
    error?: string;
  }>>({});
  // 複数空欄回答用のstate (語群選択/○×複数)
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string>>({});

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

  // 問題が変わったときに、既存の回答を復元 + 記述式stateリセット
  useEffect(() => {
    const existingAnswer = answers.find(
      (a) => a.questionId === currentQuestion.id,
    );
    if (existingAnswer) {
      setSelectedAnswer(existingAnswer.answer);
      setShowResult(true);
      // 記述式の回答を復元
      try {
        const parsed = JSON.parse(existingAnswer.answer);
        if (typeof parsed === "object" && parsed !== null) {
          setMultiAnswers(parsed);
          setFillInAnswer("");
        } else {
          setFillInAnswer(existingAnswer.answer);
          setMultiAnswers({});
        }
      } catch {
        setFillInAnswer(existingAnswer.answer);
        setMultiAnswers({});
      }
    } else {
      setSelectedAnswer("");
      setShowResult(false);
      setFillInAnswer("");
      setMultiAnswers({});
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

  // questionTypeに基づく表示設定
  const questionType = (currentQuestion as any).questionType || "choice";
  const isTrueFalse = questionType === "true_false";
  const isFillIn = questionType === "fill_in";
  const isSelect = questionType === "select";
  const isDescriptiveType = questionType === "descriptive";
  const isDescriptive = isFillIn || isSelect || isDescriptiveType;

  // 複数空欄の正解データを取得
  const getCorrectAnswerDetail = (): Record<string, string> | null => {
    const detail = (currentQuestion as any).correctAnswerDetail;
    if (!detail) return null;
    try {
      return typeof detail === "string" ? JSON.parse(detail) : detail;
    } catch { return null; }
  };

  // 複数空欄の空欄キー一覧
  const getMultiAnswerKeys = (): string[] => {
    const detail = getCorrectAnswerDetail();
    if (!detail) return [];
    return Object.keys(detail);
  };

  // 記述式の回答を提出
  const handleDescriptiveSubmit = () => {
    if (showResult) return;

    const detail = getCorrectAnswerDetail();
    let isCorrect = false;
    let answerStr = "";

    if (detail && Object.keys(detail).length > 0) {
      // 複数空欄の採点
      isCorrect = Object.entries(detail).every(([key, correctVal]) => {
        const userVal = (multiAnswers[key] || "").replace(/,/g, "").trim();
        const correctClean = String(correctVal).replace(/[()（）万円%㎡,]/g, "").trim();
        return userVal === correctClean;
      });
      answerStr = JSON.stringify(multiAnswers);
    } else if (isDescriptiveType) {
      // 自由記述式 → 完全一致採点は不可能、回答済みとして記録
      // AI採点がある場合はそちらで判定
      isCorrect = false; // デフォルトは不正解扱い（AI採点で上書き可能）
      answerStr = fillInAnswer.trim();
    } else {
      // 単一回答の採点（FP計算問題等）
      const userAnswer = fillInAnswer.replace(/,/g, "").trim();
      const correctAnswer = currentQuestion.correctAnswer.replace(/,/g, "").trim();
      isCorrect = userAnswer === correctAnswer;
      answerStr = fillInAnswer.trim();
    }

    setSelectedAnswer(answerStr);
    setShowResult(true);

    // DBに保存
    fetch("/api/user/progress/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: section.id,
        questionId: currentQuestion.id,
        userAnswer: answerStr,
        isCorrect,
      }),
    }).catch((error) => console.error("Failed to save:", error));

    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.questionId === currentQuestion.id);
      const entry = { questionId: currentQuestion.id, answer: answerStr, isCorrect };
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
      return [...prev, entry];
    });
  };

  // 表示する選択肢キーを動的に決定
  const getOptionKeys = (): string[] => {
    if (isDescriptive) return []; // 記述式は選択肢なし
    if (isTrueFalse) return ["A", "B"];
    const keys = ["A", "B"];
    if (currentQuestion.optionC) keys.push("C");
    if (currentQuestion.optionD) keys.push("D");
    return keys;
  };

  // ○×表示用のラベル
  const getTrueFalseLabel = (key: string) => {
    return key === "A" ? "○" : "×";
  };

  // Helper to render option indicator
  const renderOptionIndicator = (optionKey: string) => {
    const isSelected = selectedAnswer === optionKey;
    const isCorrectAnswer = currentQuestion.correctAnswer === optionKey;

    if (showResult) {
      if (isCorrectAnswer) {
        return (
          <Check className="w-8 h-8 text-green-600 font-bold" strokeWidth={4} />
        );
      }
      if (isSelected && !isCorrectAnswer) {
        return <X className="w-8 h-8 text-red-500 font-bold" strokeWidth={4} />;
      }
      if (isTrueFalse) {
        return (
          <span className="text-4xl font-bold text-slate-400">
            {getTrueFalseLabel(optionKey)}
          </span>
        );
      }
      return (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-medium">
          {optionKey}
        </div>
      );
    }

    // Default state
    if (isTrueFalse) {
      return (
        <span
          className={cn(
            "text-4xl font-bold transition-all",
            isSelected
              ? optionKey === "A" ? "text-blue-700 scale-110" : "text-red-600 scale-110"
              : optionKey === "A" ? "text-blue-500" : "text-red-400",
          )}
        >
          {getTrueFalseLabel(optionKey)}
        </span>
      );
    }

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
        <div className="mx-auto px-3 py-8 md:px-6 md:py-12 max-w-4xl w-full">
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

                  // 間違えた問題の進捗のみリセットして同じセクションを再表示
                  // mode指定なし → 全5問表示、正解済みは保持、間違えた問題だけ未回答に戻る
                  const timestamp = Date.now();
                  window.location.href = `/sections/${section.id}?retry=${timestamp}`;
                } catch (error) {
                  console.error("Failed to retry incorrect questions:", error);
                  alert("進捗のリセットに失敗しました");
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-8 text-lg font-bold shadow-lg h-auto whitespace-normal"
            >
              同じ問題を挑戦
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
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden">
      <div className="mx-auto px-3 py-4 md:px-6 md:py-6 max-w-4xl w-full">
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
        <header className="mb-4 md:mb-8">
          <div className="flex items-center gap-2 mb-3 md:mb-6">
            <span className="font-bold text-base md:text-xl flex items-center gap-2">
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
                className="w-5 h-5 md:w-6 md:h-6"
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
            <h1 className="text-lg md:text-2xl font-bold">
              {exam?.title || section.title}
            </h1>
            <div className="flex items-center justify-between text-xs md:text-sm mt-1">
              <div className="flex items-center">
                <span className="font-medium mr-2 md:mr-4">
                  問題{currentQuestionIndex + 1}
                </span>
                <span className="text-slate-500 text-xs truncate max-w-[180px] md:max-w-none">
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
                {/* 出典情報 */}
                {currentQuestion.sourceNote && (
                  <div className="mb-2 text-xs text-slate-400 font-medium">
                    {currentQuestion.sourceNote}
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="prose prose-sm max-w-none flex-1 text-sm md:text-lg leading-relaxed font-medium overflow-x-auto [&_table]:text-xs [&_table]:md:text-base [&_table]:font-normal [&_table]:w-full [&_table]:table-fixed [&_th]:bg-slate-100 [&_th]:px-2 [&_th]:py-1 [&_th]:md:px-3 [&_th]:md:py-2 [&_td]:px-2 [&_td]:py-1 [&_td]:md:px-3 [&_td]:md:py-2 [&_td]:break-words [&_img]:rounded-lg [&_img]:shadow-md [&_img]:my-3 [&_img]:max-w-full [&_pre]:overflow-x-auto [&_code]:break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentQuestion.questionText}
                    </ReactMarkdown>
                  </div>
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
        {isDescriptive ? (
          /* ── 記述式回答UI ── */
          <div className="rounded-lg border border-slate-200 mb-8 shadow-sm p-3 md:p-6">
            {(() => {
              const detail = getCorrectAnswerDetail();
              const multiKeys = getMultiAnswerKeys();
              const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
              const isAlreadyCorrect = currentAnswer?.isCorrect === true;

              if (multiKeys.length > 0) {
                // 複数空欄の入力フォーム
                return (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-slate-500 mb-2">
                      {isSelect ? "語群から選んで入力してください" : "各空欄に回答を入力してください"}
                    </div>
                    {multiKeys.map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-blue-600 w-8 text-center">({key})</span>
                        <input
                          type="text"
                          value={multiAnswers[key] || ""}
                          onChange={(e) => setMultiAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                          disabled={showResult || isAlreadyCorrect}
                          placeholder={`(${key}) の回答`}
                          className={cn(
                            "flex-1 px-4 py-3 border-2 rounded-lg text-lg transition-all",
                            showResult
                              ? detail && (multiAnswers[key] || "").replace(/,/g, "").trim() === String(detail[key]).replace(/[()（）万円%㎡,]/g, "").trim()
                                ? "border-green-400 bg-green-50"
                                : "border-red-400 bg-red-50"
                              : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                            isAlreadyCorrect && "opacity-60",
                          )}
                        />
                        {showResult && detail && (
                          <span className="text-sm font-medium text-green-700 min-w-[60px]">
                            正解: {detail[key]}
                          </span>
                        )}
                      </div>
                    ))}
                    {!showResult && !isAlreadyCorrect && (
                      <Button
                        onClick={handleDescriptiveSubmit}
                        disabled={multiKeys.some((k) => !(multiAnswers[k] || "").trim())}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                      >
                        回答する
                      </Button>
                    )}
                  </div>
                );
              } else if (isDescriptiveType) {
                // IPA午後等の自由記述問題 → テキストエリア + 模範解答表示
                return (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-slate-500 mb-2">
                      回答を入力してください
                    </div>
                    <textarea
                      value={fillInAnswer}
                      onChange={(e) => setFillInAnswer(e.target.value)}
                      disabled={showResult || isAlreadyCorrect}
                      placeholder="回答を入力..."
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-lg text-base transition-all resize-y",
                        showResult
                          ? "border-slate-300 bg-slate-50"
                          : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                        isAlreadyCorrect && "opacity-60",
                      )}
                    />
                    {showResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm font-bold text-green-800 mb-2">模範解答:</div>
                        <div className="text-sm text-green-900 whitespace-pre-wrap">
                          {currentQuestion.correctAnswer}
                        </div>
                      </div>
                    )}
                    {!showResult && !isAlreadyCorrect && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleDescriptiveSubmit}
                          disabled={!fillInAnswer.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm md:text-base"
                        >
                          回答して模範解答を見る
                        </Button>
                        <Button
                          onClick={() => {
                            setFillInAnswer("（未回答）");
                            handleDescriptiveSubmit();
                          }}
                          variant="outline"
                          className="py-3 text-sm md:text-base whitespace-nowrap"
                        >
                          模範解答だけ見る
                        </Button>
                      </div>
                    )}
                  </div>
                );
              } else {
                // 単一回答の入力フォーム（FP計算問題等）
                return (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-slate-500 mb-2">
                      回答を入力してください（数値・記号等）
                    </div>
                    <input
                      type="text"
                      value={fillInAnswer}
                      onChange={(e) => setFillInAnswer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && fillInAnswer.trim()) handleDescriptiveSubmit(); }}
                      disabled={showResult || isAlreadyCorrect}
                      placeholder="回答を入力"
                      className={cn(
                        "w-full px-4 py-4 border-2 rounded-lg text-xl text-center font-medium transition-all",
                        showResult
                          ? fillInAnswer.replace(/,/g, "").trim() === currentQuestion.correctAnswer.replace(/,/g, "").trim()
                            ? "border-green-400 bg-green-50"
                            : "border-red-400 bg-red-50"
                          : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                        isAlreadyCorrect && "opacity-60",
                      )}
                    />
                    {showResult && (
                      <div className="text-center text-sm font-medium text-green-700 bg-green-50 rounded-lg p-3">
                        正解: {currentQuestion.correctAnswer}
                      </div>
                    )}
                    {!showResult && !isAlreadyCorrect && (
                      <Button
                        onClick={handleDescriptiveSubmit}
                        disabled={!fillInAnswer.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                      >
                        回答する
                      </Button>
                    )}
                  </div>
                );
              }
            })()}
          </div>
        ) : (
          /* ── 選択式回答UI（既存） ── */
          <div className="relative rounded-lg overflow-hidden border border-slate-200 mb-8 shadow-sm">
            {/* Left Blue Bar Background */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-blue-300/50 z-0" />

            {/* Options List */}
            <div className="relative z-10">
              {getOptionKeys().map((optionKey) => {
                const optionText = currentQuestion[
                  `option${optionKey}` as keyof Question
                ] as string;
                if (!optionText && !isTrueFalse) return null;
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
                      if (!isAlreadyCorrect) {
                        handleAnswerSelect(optionKey);
                      }
                    }}
                    className={cn(
                      "flex items-center transition-colors border-b last:border-0 border-slate-100",
                      isTrueFalse ? "min-h-[100px]" : "min-h-[80px]",
                      isAlreadyCorrect
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer",
                      isSelected && !showResult
                        ? "bg-blue-50"
                        : !isAlreadyCorrect && "hover:bg-slate-50",
                    )}
                  >
                    {/* Indicator Column */}
                    <div className={cn("flex-shrink-0 flex items-center justify-center", isTrueFalse ? "w-24" : "w-20")}>
                      {renderOptionIndicator(optionKey)}
                    </div>

                    {/* Text Column */}
                    <div className={cn("flex-1 p-4", isTrueFalse ? "text-lg font-medium" : "text-base")}>
                      {optionText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Explanation Section */}
        {showResult && (
          <div className="mb-8 border border-slate-300 rounded-xl p-6 bg-white shadow-sm">
            <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2 text-sm">
              問題{currentQuestionIndex + 1}の説明及び補足
            </h3>
            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentQuestion.explanation || "解説は準備中です。"}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* AI採点セクション（記述式のみ） */}
        {showResult && isDescriptive && (() => {
          const aiState = aiScoring[currentQuestion.id] || { status: "idle" };

          const handleAiScore = async () => {
            setAiScoring(prev => ({
              ...prev,
              [currentQuestion.id]: { status: "loading" }
            }));

            try {
              const detail = getCorrectAnswerDetail();
              const response = await fetch("/api/ai/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  questionText: currentQuestion.questionText,
                  userAnswer: selectedAnswer || fillInAnswer,
                  correctAnswer: currentQuestion.correctAnswer,
                  correctAnswerDetail: detail ? JSON.stringify(detail) : undefined,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                setAiScoring(prev => ({
                  ...prev,
                  [currentQuestion.id]: {
                    status: "success",
                    score: data.score,
                    isCorrect: data.isCorrect,
                    explanation: data.explanation,
                  }
                }));
              } else {
                const errorData = await response.json().catch(() => ({}));
                const isNoApiKey = response.status === 400 && errorData.error?.includes("APIキーが設定されていません");
                setAiScoring(prev => ({
                  ...prev,
                  [currentQuestion.id]: {
                    status: isNoApiKey ? "no_key" : "error",
                    error: errorData.error || `エラー (${response.status})`,
                  }
                }));
              }
            } catch (error) {
              setAiScoring(prev => ({
                ...prev,
                [currentQuestion.id]: {
                  status: "error",
                  error: "接続エラー: サーバーに接続できませんでした",
                }
              }));
            }
          };

          return (
            <div className="mb-8">
              {aiState.status === "idle" ? (
                /* AI採点ボタン */
                <Button
                  onClick={handleAiScore}
                  className="w-full rounded-xl py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  AIで採点する
                </Button>
              ) : aiState.status === "no_key" ? (
                /* APIキー未設定メッセージ（サーバー応答で判明） */
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center bg-slate-50/50">
                  <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-3">
                    AI採点機能を使うにはGemini APIキーの設定が必要です
                  </p>
                  <a
                    href="/settings/api-key"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    APIキー設定画面へ
                  </a>
                </div>
              ) : aiState.status === "loading" ? (
                /* ローディング */
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium text-indigo-700">AIが採点中です...</p>
                  <p className="text-xs text-indigo-500 mt-1">数秒お待ちください</p>
                </div>
              ) : aiState.status === "success" ? (
                /* 採点結果 */
                <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
                  {/* スコアヘッダー */}
                  <div className={cn(
                    "px-6 py-4 flex items-center justify-between",
                    aiState.score !== undefined && aiState.score >= 80
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : aiState.score !== undefined && aiState.score >= 50
                        ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                        : "bg-gradient-to-r from-red-500 to-rose-500"
                  )}>
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-white/80" />
                      <span className="text-white font-bold text-lg">AI採点結果</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/80 text-sm font-medium">スコア</span>
                      <span className="text-white text-3xl font-extrabold">
                        {aiState.score}
                      </span>
                      <span className="text-white/80 text-sm font-medium">/100</span>
                    </div>
                  </div>
                  {/* スコアバー */}
                  <div className="px-6 pt-4 pb-2">
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div
                        className={cn(
                          "h-2.5 rounded-full transition-all duration-1000 ease-out",
                          aiState.score !== undefined && aiState.score >= 80
                            ? "bg-green-500"
                            : aiState.score !== undefined && aiState.score >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        )}
                        style={{ width: `${aiState.score || 0}%` }}
                      />
                    </div>
                  </div>
                  {/* 解説 */}
                  <div className="px-6 pb-5 pt-2">
                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiState.explanation || ""}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {/* 再採点ボタン */}
                  <div className="px-6 pb-4">
                    <button
                      onClick={handleAiScore}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition-colors"
                    >
                      もう一度採点する
                    </button>
                  </div>
                </div>
              ) : (
                /* エラー */
                <div className="rounded-xl border border-red-200 bg-red-50/80 p-5">
                  <p className="text-sm font-medium text-red-800 mb-3">
                    {aiState.error || "AI採点でエラーが発生しました"}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAiScore}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition-colors"
                    >
                      再試行
                    </button>
                    <a
                      href="/settings/api-key"
                      className="text-sm text-slate-600 hover:text-slate-800 font-medium underline underline-offset-2 transition-colors"
                    >
                      APIキー設定を確認
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
