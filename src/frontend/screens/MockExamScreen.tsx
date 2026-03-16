"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  List,
  ClipboardCheck,
} from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import { PageContainer } from "@/frontend/components/common/page-container";
import MockTestQuestionListModal from "@/frontend/components/mock-test/MockTestQuestionListModal";

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

export default function MockTestScreen() {
  const router = useRouter();
  const texts = APP_TEXTS.quizes; // クイズ用テキストを再利用
  const dashboardTexts = APP_TEXTS.dashboard.features.mockTest;

  // 状態管理
  const [status, setStatus] = useState<"loading" | "ready" | "submitting">(
    "loading",
  );
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [examId, setExamId] = useState<number | null>(null);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // URLからexamIdを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("examId");
    if (id) {
      setExamId(parseInt(id, 10));
    } else {
      setError("試験IDが指定されていません。");
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

  // 採点ボタン押下時
  const handleScoreButtonClick = () => {
    const unansweredCount = questions.filter((q) => !answers[q.id]).length;
    if (unansweredCount > 0) {
      setShowConfirmDialog(true);
    } else {
      handleSubmit();
    }
  };

  // テスト提出
  const handleSubmit = async () => {
    setShowConfirmDialog(false);
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
          userAnswer: "",
        }));

      const payload = {
        answers: [...answerList, ...unansweredQuestions],
        examId: examId,
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

      // 結果をsessionStorageに保存
      sessionStorage.setItem("mockTestResult", JSON.stringify(resultData));
      if (examId) {
        sessionStorage.setItem("mockTestExamId", examId.toString());
      }

      // 結果画面へ遷移
      router.push("/mock-test/result");
    } catch (err) {
      console.error("Error submitting test:", err);
      setError("テストの提出に失敗しました。");
      setStatus("ready");
    }
  };

  // 問題リストからジャンプ
  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // ローディング画面
  if (status === "loading") {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">問題を準備中...</p>
        </div>
      </PageContainer>
    );
  }

  // エラー画面
  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
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
      </PageContainer>
    );
  }

  // テスト実施画面
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const progressPercentage =
    ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQuestion.id];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl py-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{dashboardTexts.title}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionList(true)}
            >
              <List className="h-4 w-4 mr-1" />
              リスト
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleScoreButtonClick}
              disabled={status === "submitting"}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ClipboardCheck className="h-4 w-4 mr-1" />
              採点する
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">中断して戻る</Link>
            </Button>
          </div>
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

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleScoreButtonClick}
                disabled={status === "submitting"}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    採点する
                  </>
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

      {/* 問題リストモーダル */}
      <MockTestQuestionListModal
        isOpen={showQuestionList}
        onClose={() => setShowQuestionList(false)}
        totalQuestions={questions.length}
        answers={answers}
        questions={questions}
        currentIndex={currentQuestionIndex}
        onJump={handleJumpToQuestion}
      />

      {/* 採点確認ダイアログ */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle className="text-lg">採点しますか？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                未回答の問題が{" "}
                <strong className="text-red-600">{unansweredCount}問</strong>{" "}
                あります。 未回答の問題は不正解扱いになります。
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                戻る
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                採点する
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
