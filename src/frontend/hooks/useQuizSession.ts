"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import type { Question, SectionQuestionProgress } from "@/backend/db/schema";

interface AnswerRecord {
  questionId: number;
  answer: string;
  isCorrect: boolean;
}

interface UseQuizSessionOptions {
  sectionId: number;
  questions: Question[];
  questionsProgress?: SectionQuestionProgress[];
  initialQuestionNumber?: number;
}

export function useQuizSession({
  sectionId,
  questions,
  questionsProgress = [],
  initialQuestionNumber,
}: UseQuizSessionOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータから問題番号を取得 (1-indexed)
  const questionParam = searchParams.get("question");

  const findFirstUnansweredIndex = () => {
    if (questionParam) {
      return Math.max(0, Math.min(parseInt(questionParam, 10) - 1, questions.length - 1));
    }
    if (initialQuestionNumber) {
      return Math.max(0, Math.min(initialQuestionNumber - 1, questions.length - 1));
    }
    if (questionsProgress.length > 0) {
      const firstUnanswered = questions.findIndex((q) => {
        const progress = questionsProgress.find((p) => p.questionId === q.id);
        return !progress || !progress.isCorrect;
      });
      if (firstUnanswered !== -1) return firstUnanswered;
    }
    return 0;
  };

  const startIndex = findFirstUnansweredIndex();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(startIndex);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 記述式
  const [fillInAnswer, setFillInAnswer] = useState("");
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string>>({});

  // AI採点
  const [aiScoring, setAiScoring] = useState<Record<number, {
    status: "idle" | "loading" | "success" | "error" | "no_key";
    score?: number;
    isCorrect?: boolean;
    explanation?: string;
    error?: string;
  }>>({});

  // 回答履歴
  const [answers, setAnswers] = useState<AnswerRecord[]>(() => {
    if (!questionsProgress || questionsProgress.length === 0) return [];
    return questionsProgress.map((p) => ({
      questionId: p.questionId,
      answer: p.userAnswer || "",
      isCorrect: p.isCorrect,
    }));
  });

  // お気に入り
  const [favorites, setFavorites] = useState<
    Record<number, { isFavorite1: boolean; isFavorite2: boolean; isFavorite3: boolean }>
  >({});

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalAnswered = answers.length;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  // 問題タイプ判定
  const questionType = (currentQuestion as Record<string, unknown>)?.questionType as string || "choice";
  const isTrueFalse = questionType === "true_false";
  const isFillIn = questionType === "fill_in";
  const isSelect = questionType === "select";
  const isDescriptiveType = questionType === "descriptive";
  const isDescriptive = isFillIn || isSelect || isDescriptiveType;

  // セクション進捗保存
  const handleFinishQuiz = useCallback(
    async (redirectToList = true) => {
      if (!currentQuestion) return;
      setIsSubmitting(true);
      try {
        const finalAnswers = showResult
          ? answers
          : [...answers, {
              questionId: currentQuestion.id,
              answer: selectedAnswer,
              isCorrect: selectedAnswer === currentQuestion.correctAnswer,
            }];
        const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
        const response = await fetch("/api/user/progress/units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId, correctCount, totalCount: finalAnswers.length }),
        });
        if (!response.ok) throw new Error("Failed to save progress");
        if (redirectToList) {
          router.push(`/sections/${sectionId}/list`);
          router.refresh();
        }
      } catch (error) {
        console.error("Error saving progress:", error);
        alert(APP_TEXTS.errors.saveFailed);
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, showResult, currentQuestion, selectedAnswer, sectionId, router],
  );

  // 選択肢回答を提出
  const handleAnswer = (answer: string) => {
    if (showResult || !currentQuestion) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    const isCorrect = answer === currentQuestion.correctAnswer;

    fetch("/api/user/progress/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        questionId: currentQuestion.id,
        userAnswer: answer,
        isCorrect,
      }),
    }).catch((error) => console.error("Failed to save:", error));

    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.questionId === currentQuestion.id);
      const entry = { questionId: currentQuestion.id, answer, isCorrect };
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
      return [...prev, entry];
    });
  };

  // 次の問題へ
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // 前の問題へ
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // 自動完了チェック
  useEffect(() => {
    if (isLastQuestion && answers.length === questions.length && showResult && !showCompletionScreen && !isSubmitting) {
      const timer = setTimeout(async () => {
        await handleFinishQuiz(false);
        setShowCompletionScreen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLastQuestion, answers.length, questions.length, showResult, showCompletionScreen, isSubmitting, handleFinishQuiz]);

  // URL同期
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get("question");
    const next = (currentQuestionIndex + 1).toString();
    if (current === next) return;
    params.set("question", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [currentQuestionIndex, router, searchParams]);

  // 問題切り替え時の状態復元
  useEffect(() => {
    if (!currentQuestion) return;
    const existing = answers.find((a) => a.questionId === currentQuestion.id);
    if (existing) {
      setSelectedAnswer(existing.answer);
      setShowResult(true);
      try {
        const parsed = JSON.parse(existing.answer);
        if (typeof parsed === "object" && parsed !== null) {
          setMultiAnswers(parsed);
          setFillInAnswer("");
        } else {
          setFillInAnswer(existing.answer);
          setMultiAnswers({});
        }
      } catch {
        setFillInAnswer(existing.answer);
        setMultiAnswers({});
      }
    } else {
      setSelectedAnswer("");
      setShowResult(false);
      setFillInAnswer("");
      setMultiAnswers({});
    }
  }, [currentQuestionIndex, currentQuestion?.id]);

  return {
    // State
    currentQuestionIndex,
    currentQuestion,
    selectedAnswer,
    showResult,
    showCompletionScreen,
    isSubmitting,
    fillInAnswer,
    multiAnswers,
    aiScoring,
    answers,
    favorites,
    isLastQuestion,
    correctCount,
    totalAnswered,
    accuracy,
    // Type flags
    questionType,
    isTrueFalse,
    isFillIn,
    isSelect,
    isDescriptiveType,
    isDescriptive,
    // Setters
    setCurrentQuestionIndex,
    setSelectedAnswer,
    setShowResult,
    setShowCompletionScreen,
    setFillInAnswer,
    setMultiAnswers,
    setAiScoring,
    setAnswers,
    setFavorites,
    // Actions
    handleAnswer,
    handleNext,
    handlePrev,
    handleFinishQuiz,
  };
}
