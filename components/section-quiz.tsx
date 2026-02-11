"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import type { Section, Question, SectionProgress } from "@/lib/db/schema";

interface SectionQuizProps {
  section: Section;
  questions: Question[];
  userId: string;
  initialProgress: SectionProgress | undefined;
}

export function SectionQuiz({ section, questions, userId, initialProgress }: SectionQuizProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number; answer: string; isCorrect: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setShowResult(true);

    // 解答を記録
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
      // 最後の問題の場合、結果を保存
      handleFinishQuiz();
    } else {
      // 次の問題へ
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setShowResult(false);
    }
  };

  const handleFinishQuiz = async () => {
    setIsSubmitting(true);

    try {
      // 正解数を計算
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const totalCount = answers.length;

      // 進捗を保存
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

      // セクション一覧に戻る
      router.push("/sections");
      router.refresh();
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("進捗の保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCorrect = showResult && selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/sections")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          セクション一覧に戻る
        </Button>

        <h1 className="text-3xl font-bold mb-2">{section.title}</h1>
        <p className="text-muted-foreground">{section.description}</p>

        {/* 進捗バー */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              問題 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* 問題カード */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">
            問題 {currentQuestionIndex + 1}
          </CardTitle>
          <CardDescription className="text-base leading-relaxed pt-2">
            {currentQuestion.questionText}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <RadioGroup
            value={selectedAnswer}
            onValueChange={handleAnswerSelect}
            disabled={showResult}
          >
            {["A", "B", "C", "D"].map((option) => {
              const optionText = currentQuestion[`option${option}` as keyof Question] as string;
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQuestion.correctAnswer;
              const showCorrect = showResult && isCorrectOption;
              const showIncorrect = showResult && isSelected && !isCorrectOption;

              return (
                <div
                  key={option}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                    showCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : showIncorrect
                      ? "border-red-500 bg-red-50 dark:bg-red-950"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={option} id={`option-${option}`} />
                  <Label
                    htmlFor={`option-${option}`}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="font-medium mr-2">{option}.</span>
                    {optionText}
                  </Label>
                  {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {showIncorrect && <XCircle className="h-5 w-5 text-red-500" />}
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>

        {showResult && currentQuestion.explanation && (
          <CardContent className="pt-0">
            <div className="p-4 rounded-lg bg-muted">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    正解です！
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    不正解
                  </>
                )}
              </h3>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
                setSelectedAnswer("");
                setShowResult(false);
              }
            }}
            disabled={currentQuestionIndex === 0 || showResult}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            前の問題
          </Button>

          {!showResult ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
            >
              解答する
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              disabled={isSubmitting}
            >
              {isLastQuestion ? "結果を保存" : "次の問題"}
              {!isLastQuestion && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* 統計情報 */}
      {answers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              現在の成績
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-bold">
                  {answers.filter((a) => a.isCorrect).length}
                </div>
                <div className="text-sm text-muted-foreground">正解</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {answers.filter((a) => !a.isCorrect).length}
                </div>
                <div className="text-sm text-muted-foreground">不正解</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">正答率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
