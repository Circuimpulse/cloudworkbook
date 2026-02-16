"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";

// 問題の型定義（正解は含まない）
interface PublicQuestion {
  id: number;
  sectionId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

// テスト結果詳細の型定義
interface TestResultDetail {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  question: PublicQuestion & { explanation?: string }; // explanationがある場合もある
}

// テスト結果の型定義
interface TestResult {
  testId: number;
  score: number;
  totalQuestions: number;
  details: TestResultDetail[];
}

export default function MockTestScreen() {
  const router = useRouter();
  const texts = APP_TEXTS.quizes; // クイズ用テキストを再利用
  const dashboardTexts = APP_TEXTS.dashboard.features.mockTest;

  // 状態管理
  const [status, setStatus] = useState<
    "loading" | "ready" | "submitting" | "finished"
  >("loading");
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [examId, setExamId] = useState<number | null>(null);

  // URLからexamIdを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("examId");
    if (id) {
      setExamId(parseInt(id, 10));
    } else {
      setError("試験IDが指定されていません。");
      setStatus("finished");
    }
  }, []);

  // 問題を取得
  useEffect(() => {
    if (!examId) return;

    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/exams/${examId}/mock-test`);
        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await response.json();
        setQuestions(data.questions);
        setStatus("ready");
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("問題の取得に失敗しました。時間をおいて再試行してください。");
        setStatus("finished"); // エラー画面へ
      }
    };

    fetchQuestions();
  }, [examId]);

  // 解答を選択
  const handleAnswerSelect = (value: string) => {
    if (status !== "ready") return;

    const currentQuestion = questions[currentQuestionIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  // 次の問題へ
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // 前の問題へ
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // テスト提出
  const handleSubmit = async () => {
    setStatus("submitting");

    try {
      // 解答データを整形
      const answerList = Object.entries(answers).map(([qId, ans]) => ({
        questionId: parseInt(qId, 10),
        userAnswer: ans,
      }));

      // 未回答の問題も含める（未回答は不正解扱い）
      const unansweredQuestions = questions
        .filter((q) => !answers[q.id])
        .map((q) => ({
          questionId: q.id,
          userAnswer: "", // 空文字等を送るか、バックエンド側で処理するか。ア `submit/route.ts` Logic check needed. Assuming empty string is wrong.
        }));

      const payload = {
        answers: [...answerList, ...unansweredQuestions],
      };

      const response = await fetch("/api/exams/mock/submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit test");
      }

      const resultData = await response.json();
      setResult(resultData);
      setStatus("finished");

      // スクロールトップ
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Error submitting test:", err);
      setError("テストの提出に失敗しました。");
      setStatus("finished"); // エラー表示
    }
  };

  // ローディング画面
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">問題を準備中...</p>
      </div>
    );
  }

  // エラー画面
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              エラーが発生しました
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/">トップへ戻る</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 結果画面
  if (status === "finished" && result) {
    const accuracy = Math.round((result.score / result.totalQuestions) * 100);

    return (
      <div className="min-h-screen bg-muted/20 py-8 px-4">
        <div className="container max-w-3xl mx-auto space-y-8">
          {/* 結果サマリー */}
          <Card className="text-center py-8">
            <CardHeader>
              <CardTitle className="text-3xl">模擬テスト結果</CardTitle>
              <CardDescription>お疲れ様でした！</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-primary/20">
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-full border-8 border-primary"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% ${accuracy}%, 0 ${accuracy}%)` /*簡易的な円グラフ表現*/,
                    }}
                  ></div>
                  {/* 注: 正確な円グラフはSVGなどで実装すべきだが、ここでは簡易的に数値表示 */}
                  <div className="text-5xl font-bold">
                    {result.score}{" "}
                    <span className="text-2xl text-muted-foreground">
                      / {result.totalQuestions}
                    </span>
                  </div>
                </div>
                <div className="text-xl font-medium">正答率: {accuracy}%</div>
              </div>
            </CardContent>
            <CardFooter className="justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/">トップへ戻る</Link>
              </Button>
              <Button onClick={() => window.location.reload()}>
                もう一度挑戦する
              </Button>
            </CardFooter>
          </Card>

          {/* 詳細リスト（間違えた問題のみ表示するなど工夫可能だが、今回は全問表示か一覧へのリンクか） */}
          {/* ここではシンプルに「履歴」への誘導とするか、詳細を表示するか。
              要件には明示されていないが、学習アプリとしては詳細が見たいはず。
          */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">解答詳細</h3>
            {result.details.map((detail, index) => (
              <Card
                key={index}
                className={`border-l-4 ${detail.isCorrect ? "border-l-green-500" : "border-l-red-500"}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-medium">
                      問題 {index + 1}
                    </CardTitle>
                    {detail.isCorrect ? (
                      <div className="flex items-center text-green-600 font-bold">
                        <CheckCircle className="h-5 w-5 mr-1" /> 正解
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 font-bold">
                        <XCircle className="h-5 w-5 mr-1" /> 不正解
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-sm mt-2">
                    {detail.question?.questionText || "問題文読み込みエラー"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <p
                      className={
                        detail.userAnswer === "A"
                          ? detail.isCorrect
                            ? "font-bold text-green-600"
                            : "font-bold text-red-600"
                          : ""
                      }
                    >
                      A: {detail.question?.optionA}
                    </p>
                    <p
                      className={
                        detail.userAnswer === "B"
                          ? detail.isCorrect
                            ? "font-bold text-green-600"
                            : "font-bold text-red-600"
                          : ""
                      }
                    >
                      B: {detail.question?.optionB}
                    </p>
                    <p
                      className={
                        detail.userAnswer === "C"
                          ? detail.isCorrect
                            ? "font-bold text-green-600"
                            : "font-bold text-red-600"
                          : ""
                      }
                    >
                      C: {detail.question?.optionC}
                    </p>
                    <p
                      className={
                        detail.userAnswer === "D"
                          ? detail.isCorrect
                            ? "font-bold text-green-600"
                            : "font-bold text-red-600"
                          : ""
                      }
                    >
                      D: {detail.question?.optionD}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="font-semibold mb-1">
                      正解: {detail.correctAnswer}
                    </p>
                    <p className="text-muted-foreground">
                      {detail.question?.explanation || "解説はありません。"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // テスト実施画面
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage =
    ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{dashboardTexts.title}</h1>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">中断して戻る</Link>
          </Button>
        </div>

        {/* 進捗バー */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              問題 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* 問題カード */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {currentQuestion.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={currentAnswer || ""}
              onValueChange={handleAnswerSelect}
              className="space-y-4"
            >
              {[
                { value: "A", label: currentQuestion.optionA },
                { value: "B", label: currentQuestion.optionB },
                { value: "C", label: currentQuestion.optionC },
                { value: "D", label: currentQuestion.optionD },
              ].map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-2 p-4 rounded-lg border transition-colors ${currentAnswer === option.value ? "bg-primary/5 border-primary" : "hover:bg-muted"}`}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`option-${option.value}`}
                  />
                  <Label
                    htmlFor={`option-${option.value}`}
                    className="flex-1 cursor-pointer font-medium leading-relaxed"
                  >
                    <span className="font-bold mr-3">{option.value}.</span>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {texts.previousQuestion}
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={status === "submitting"}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  texts.finishQuiz
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {texts.nextQuestion}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
