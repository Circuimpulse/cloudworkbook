"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Check, X, Menu } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import type { Section, Question } from "@/backend/db/schema";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

/**
 * クイズ画面（問題を解く画面）
 */
interface QuizesScreenProps {
  section: Section;
  questions: Question[];
  userId: string;
}

export default function QuizesScreen({ section, questions, userId }: QuizesScreenProps) {
  const router = useRouter();
  const texts = APP_TEXTS.quizes;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number; answer: string; isCorrect: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Calculate stats
  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalAnswered = answers.length;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
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

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      handleFinishQuiz();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setShowResult(false);
    }
  };

  const handleFinishQuiz = async () => {
    setIsSubmitting(true);

    try {
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const totalCount = answers.length;

      const response = await fetch("/api/sections/progress", {
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

      router.push("/list");
      router.refresh();
    } catch (error) {
      console.error("Error saving progress:", error);
      alert(APP_TEXTS.errors.saveFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render option indicator (A, B, C, D circle or Check/X icon)
  const renderOptionIndicator = (optionKey: string) => {
    const isSelected = selectedAnswer === optionKey;
    const isCorrectAnswer = currentQuestion.correctAnswer === optionKey;
    
    if (showResult) {
      if (isCorrectAnswer) {
        // Correct answer always shows check
        return <Check className="w-8 h-8 text-green-600 font-bold" strokeWidth={4} />;
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
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-xl font-medium transition-all",
        isSelected 
          ? "bg-blue-600 text-white scale-110" 
          : "bg-blue-500 text-white"
      )}>
        {optionKey}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-bold text-xl flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3-1.3-3-3v-6c0-1.7 1.3-3 3-3h11c1.7 0 3 1.3 3 3v2"/><path d="M20.665 14.83a2.5 2.5 0 0 0-3.665-4"/><path d="M20.665 14.83c.21 .15 .4 .34 .555 .56"/><path d="M12 12v.01"/></svg>
              CloudWorkbook
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{section.title}</h1>
            <div className="flex items-center text-sm mt-1">
              <span className="font-medium mr-4">問題{currentQuestionIndex + 1}</span>
              <span className="text-slate-500 text-xs sm:text-sm">
                {section.title} - {section.description?.slice(0, 20)}...
              </span>
            </div>
          </div>
          <div className="w-full h-px bg-slate-200 mt-4" />
        </header>

        {/* Question Text */}
        <div className="mb-8">
          <p className="text-lg leading-relaxed font-medium">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Options Area */}
        <div className="relative rounded-lg overflow-hidden border border-slate-200 mb-8 shadow-sm">
          {/* Left Blue Bar Background */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-blue-300/50 z-0" />

          {/* Options List */}
          <div className="relative z-10">
            {["A", "B", "C", "D"].map((optionKey) => {
               const optionText = currentQuestion[`option${optionKey}` as keyof Question] as string;
               const isSelected = selectedAnswer === optionKey;
               
               return (
                <div 
                  key={optionKey}
                  onClick={() => handleAnswerSelect(optionKey)}
                  className={cn(
                    "flex items-center min-h-[80px] cursor-pointer transition-colors border-b last:border-0 border-slate-100",
                    isSelected && !showResult ? "bg-blue-50" : "hover:bg-slate-50"
                  )}
                >
                  {/* Indicator Column */}
                  <div className="w-20 flex-shrink-0 flex items-center justify-center">
                    {renderOptionIndicator(optionKey)}
                  </div>
                  
                  {/* Text Column */}
                  <div className="flex-1 p-4 text-base">
                    {optionText}
                  </div>
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
                現在のあなたの成績{correctCount}/{totalAnswered}問正解！！ 正答率{accuracy}%
              </p>
            ) : (
              <p>
                問題は全部で{questions.length}問。ちょっとずつ頑張りましょう。
              </p>
            )}
          </div>

          <div className="flex items-center gap-8 w-full justify-center relative">
            {/* List Button (Centered) */}
            <Button 
              onClick={() => router.push("/list")}
              className="rounded-full px-12 py-6 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base shadow-md transition-transform active:scale-95"
            >
              リスト
            </Button>

            {/* Next Arrow (Right aligned, relative to container) */}
            <div className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2">
              {!showResult ? (
                <button 
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className={cn(
                    "transition-all duration-200 p-2 rounded-full hover:bg-slate-100",
                    !selectedAnswer ? "opacity-30 cursor-not-allowed" : "opacity-100 text-blue-600"
                  )}
                  aria-label="Submit Answer"
                >
                  <ArrowRight className="w-10 h-10" strokeWidth={2.5} />
                </button>
              ) : (
                <button 
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="transition-all duration-200 p-2 rounded-full hover:bg-slate-100 text-blue-600"
                  aria-label="Next Question"
                >
                  <ArrowRight className="w-10 h-10" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
