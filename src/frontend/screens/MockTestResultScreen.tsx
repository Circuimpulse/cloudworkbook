"use client";

import { useState } from "react";
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
import { CheckCircle, XCircle, Star, Loader2 } from "lucide-react";
import { PageContainer } from "@/frontend/components/common/page-container";

// 問題の型定義（正解は含まない）
interface PublicQuestion {
  id: number;
  sectionId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  explanation?: string;
}

// テスト結果詳細の型定義
interface TestResultDetail {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  question: PublicQuestion;
}

// テスト結果の型定義
interface TestResult {
  testId: number;
  score: number;
  totalQuestions: number;
  details: TestResultDetail[];
}

export default function MockTestResultScreen() {
  const router = useRouter();
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationDone, setRegistrationDone] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [examId, setExamId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  // sessionStorageからデータを読み込み
  if (!loaded) {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("mockTestResult");
        const storedExamId = sessionStorage.getItem("mockTestExamId");
        if (stored) {
          setResult(JSON.parse(stored));
          if (storedExamId) setExamId(parseInt(storedExamId, 10));
        }
      } catch {
        // parse error
      }
      setLoaded(true);
    }
    return null;
  }

  if (!result) {
    // データがない場合はリダイレクト
    router.push("/mock-test");
    return null;
  }

  const accuracy = Math.round((result.score / result.totalQuestions) * 100);
  const incorrectDetails = result.details.filter((d) => !d.isCorrect);

  const toggleLevel = (level: number) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const handleBulkFavorite = async () => {
    if (incorrectDetails.length === 0 || selectedLevels.length === 0) return;

    setIsRegistering(true);
    try {
      const response = await fetch("/api/questions/bulk-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: incorrectDetails.map((d) => d.questionId),
          levels: selectedLevels,
        }),
      });

      if (response.ok) {
        setRegistrationDone(true);
      }
    } catch (error) {
      console.error("Error bulk registering favorites:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl space-y-8 py-4">
        {/* 結果サマリー */}
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle className="text-3xl">模擬テスト結果</CardTitle>
            <CardDescription>お疲れ様でした！</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-primary/20">
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
        </Card>

        {/* 間違えた問題一覧 */}
        {incorrectDetails.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              間違えた問題 ({incorrectDetails.length}問)
            </h3>
            {incorrectDetails.map((detail, index) => {
              const questionIndex = result.details.findIndex(
                (d) => d.questionId === detail.questionId,
              );
              return (
                <Card
                  key={detail.questionId}
                  className="border-l-4 border-l-red-500"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-medium">
                        問題 {questionIndex + 1}
                      </CardTitle>
                      <div className="flex items-center text-red-600 font-bold">
                        <XCircle className="h-5 w-5 mr-1" /> 不正解
                      </div>
                    </div>
                    <CardDescription className="text-sm mt-2 line-clamp-3">
                      {detail.question?.questionText || "問題文読み込みエラー"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex gap-4">
                      <p className="text-red-600 font-medium">
                        あなたの回答: {detail.userAnswer || "未回答"}
                      </p>
                      <p className="text-green-600 font-medium">
                        正解: {detail.correctAnswer}
                      </p>
                    </div>
                    {detail.question?.explanation && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <p className="text-muted-foreground text-xs">
                          {detail.question.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 正解した問題 */}
        {result.details.filter((d) => d.isCorrect).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              正解した問題 ({result.details.filter((d) => d.isCorrect).length}
              問)
            </h3>
            {result.details
              .filter((d) => d.isCorrect)
              .map((detail) => {
                const questionIndex = result.details.findIndex(
                  (d) => d.questionId === detail.questionId,
                );
                return (
                  <Card
                    key={detail.questionId}
                    className="border-l-4 border-l-green-500"
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">
                          問題 {questionIndex + 1}
                        </CardTitle>
                        <div className="flex items-center text-green-600 font-bold text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" /> 正解
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
          </div>
        )}

        {/* お気に入り一括登録 */}
        {incorrectDetails.length > 0 && (
          <Card className="py-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                間違えた問題をお気に入りに一括登録
              </CardTitle>
              <CardDescription>
                登録するお気に入りレベルをタップで選択してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-3 mb-4">
                {[1, 2, 3].map((level) => {
                  const isSelected = selectedLevels.includes(level);
                  return (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      disabled={registrationDone}
                      className={`
                        relative h-14 w-14 rounded-xl text-lg font-bold
                        transition-all duration-200 ease-out
                        ${registrationDone ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-90"}
                        ${
                          isSelected
                            ? "bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-200 ring-2 ring-yellow-500 scale-105"
                            : "bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200"
                        }
                      `}
                    >
                      <Star
                        className={`h-4 w-4 absolute top-1 right-1 ${isSelected ? "text-yellow-700" : "text-gray-400"}`}
                        fill={isSelected ? "currentColor" : "none"}
                      />
                      {level}
                    </button>
                  );
                })}
              </div>

              {selectedLevels.length > 0 && (
                <p className="text-center text-sm text-muted-foreground mb-4">
                  お気に入り{" "}
                  {selectedLevels
                    .sort()
                    .map((l) => `①②③`.charAt(l - 1))
                    .join("")}{" "}
                  に{incorrectDetails.length}問を登録
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-center">
              {registrationDone ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="h-5 w-5" />
                  登録完了しました！
                </div>
              ) : (
                <Button
                  onClick={handleBulkFavorite}
                  disabled={selectedLevels.length === 0 || isRegistering}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-2"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    "一括登録する"
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {/* ナビゲーション */}
        <div className="flex justify-center gap-4 pb-8">
          <Button asChild variant="outline">
            <Link href="/history">学習履歴へ</Link>
          </Button>
          <Button asChild>
            <Link href={examId ? `/mock-test?examId=${examId}` : "/mock-test"}>
              もう一度挑戦する
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
