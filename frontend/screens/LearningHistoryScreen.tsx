"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Clock,
  Award,
  History,
  XCircle,
  Star,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import type {
  MockTestHistory,
  Section,
  Question,
  Exam,
} from "@/backend/db/schema";
import { useRouter } from "next/navigation";
import FavoriteToggles from "@/frontend/components/common/FavoriteToggles";

// 型定義（queries.tsの戻り値に合わせる）
interface IncorrectQuestionItem {
  progress: any;
  question: Question;
  section: Section;
  exam: Exam | null;
  record: any; // Add record
}

interface FavoriteQuestionItem {
  record: any;
  question: Question;
  section: Section;
  exam: Exam | null;
}

interface HistoryScreenProps {
  history: MockTestHistory[];
  incorrectQuestions: IncorrectQuestionItem[];
  favoriteQuestions: FavoriteQuestionItem[];
  initialTab?: TabType;
}

type TabType = "history" | "incorrect" | "favorite";

export default function HistoryScreen({
  history,
  incorrectQuestions,
  favoriteQuestions,
  initialTab = "history",
}: HistoryScreenProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [favoriteFilters, setFavoriteFilters] = useState<{
    1: boolean;
    2: boolean;
    3: boolean;
  }>({
    1: true,
    2: true,
    3: true,
  });
  const [filterMode, setFilterMode] = useState<"or" | "and">("or");
  const texts = APP_TEXTS.dashboard.features.learningHistory; // テキスト再利用

  // Propsからのデータをローカルステートで管理して更新を即時反映させる
  const [localFavoriteQuestions, setLocalFavoriteQuestions] =
    useState(favoriteQuestions);
  const [localIncorrectQuestions, setLocalIncorrectQuestions] =
    useState(incorrectQuestions);

  useEffect(() => {
    setLocalFavoriteQuestions(favoriteQuestions);
    setLocalIncorrectQuestions(incorrectQuestions);
  }, [favoriteQuestions, incorrectQuestions]);

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    // URLを更新して履歴に残す（リロード時にタブを維持）
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.pushState({}, "", url.toString());
  };

  const renderTabContent = () => {
    if (activeTab === "history") {
      return history.length > 0 ? (
        <div className="grid gap-4">
          {history.map((item) => {
            const accuracy = Math.round(
              (item.score / item.totalQuestions) * 100,
            );
            const isPassed = accuracy >= 60; // 仮の合格ライン 60%

            return (
              <Card key={item.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      {new Date(item.takenAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">
                        {item.score}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          / {item.totalQuestions} 問正解
                        </span>
                      </span>
                      {isPassed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <Award className="h-3 w-3 mr-1" />
                          Good!
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        正答率
                      </div>
                      <div
                        className={`text-2xl font-bold ${isPassed ? "text-green-600" : "text-orange-500"}`}
                      >
                        {accuracy}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-12 text-center">
          <CardContent>
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{texts.noTests}</h3>
            <Button asChild className="mt-4">
              <Link href="/mock-test">
                {APP_TEXTS.dashboard.features.mockTest.action}
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "incorrect") {
      return localIncorrectQuestions.length > 0 ? (
        <div className="grid gap-4">
          {localIncorrectQuestions.map((item, index) => (
            <Card
              key={`incorrect-${item.question.id}`}
              className="transition-all hover:shadow-md cursor-pointer group"
              onClick={() => router.push(`/sections/${item.section.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                        {item.exam?.title || "試験区分なし"}
                      </span>
                      <span>{item.section?.title}</span>
                      <FavoriteToggles
                        questionId={item.question.id}
                        initialStatus={
                          item.record || {
                            isFavorite1: false,
                            isFavorite2: false,
                            isFavorite3: false,
                            isFavorite: false,
                          }
                        }
                        size="sm"
                        onUpdate={(newStatus) => {
                          setLocalIncorrectQuestions((prev) =>
                            prev.map((p) =>
                              p.question.id === item.question.id
                                ? { ...p, record: newStatus }
                                : p,
                            ),
                          );
                          // Also update favorite list if compatible
                          setLocalFavoriteQuestions((prev) => {
                            const exists = prev.some(
                              (p) => p.question.id === item.question.id,
                            );
                            if (exists) {
                              return prev.map((p) =>
                                p.question.id === item.question.id
                                  ? { ...p, record: newStatus }
                                  : p,
                              );
                            }
                            // If doesn't exist but added, tricky because we miss 'section' object details properly nested?
                            // Actually it's cleaner to reload page or just update if exists.
                            return prev;
                          });
                        }}
                        className="ml-2"
                      />
                    </div>
                    <p className="font-medium text-lg leading-snug group-hover:text-primary transition-colors">
                      {item.question.questionText}
                    </p>
                  </div>
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12 text-center">
          <CardContent>
            <Award className="h-12 w-12 mx-auto text-yellow-500 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">素晴らしい！</h3>
            <p className="text-muted-foreground">
              現在、間違えたままの問題はありません。
            </p>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "favorite") {
      const filteredFavorites = localFavoriteQuestions.filter((item) => {
        const r = item.record;

        const has1 =
          r.isFavorite1 ||
          (r.isFavorite && !r.isFavorite1 && !r.isFavorite2 && !r.isFavorite3);
        const has2 = r.isFavorite2;
        const has3 = r.isFavorite3;

        if (filterMode === "or") {
          return (
            (has1 && favoriteFilters[1]) ||
            (has2 && favoriteFilters[2]) ||
            (has3 && favoriteFilters[3])
          );
        } else {
          // AND mode: Must simulate all SELECTED filters
          if (favoriteFilters[1] && !has1) return false;
          if (favoriteFilters[2] && !has2) return false;
          if (favoriteFilters[3] && !has3) return false;
          // If no filters selected, maybe show nothing or all?
          // If all filters off, OR logic returns false (nothing). AND logic returns true (all).
          // Let's align: if no filter selected, show nothing.
          if (!favoriteFilters[1] && !favoriteFilters[2] && !favoriteFilters[3])
            return false;
          return true;
        }
      });

      return (
        <div className="space-y-6">
          {/* フィルター設定 */}
          <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
            <div className="flex flex-wrap gap-6">
              <div className="space-y-2">
                <span className="text-sm font-medium block">表示対象</span>
                <div className="flex gap-4">
                  {[1, 2, 3].map((level) => (
                    <label
                      key={level}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={favoriteFilters[level as 1 | 2 | 3]}
                        onChange={(e) =>
                          setFavoriteFilters((prev) => ({
                            ...prev,
                            [level]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        お気に入り{level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium block">結合条件</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filterMode"
                      checked={filterMode === "or"}
                      onChange={() => setFilterMode("or")}
                      className="w-4 h-4 border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">OR (いずれか)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filterMode"
                      checked={filterMode === "and"}
                      onChange={() => setFilterMode("and")}
                      className="w-4 h-4 border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">AND (すべて)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {filteredFavorites.length > 0 ? (
            <div className="grid gap-4">
              {filteredFavorites.map((item, index) => {
                const r = item.record;
                const has1 =
                  r.isFavorite1 ||
                  (r.isFavorite &&
                    !r.isFavorite1 &&
                    !r.isFavorite2 &&
                    !r.isFavorite3);
                return (
                  <Card
                    key={`favorite-${index}`}
                    className="transition-all hover:shadow-md cursor-pointer group"
                    onClick={() => router.push(`/sections/${item.section.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                              {item.exam?.title || "試験区分なし"}
                            </span>
                            <span>{item.section?.title}</span>
                            <FavoriteToggles
                              questionId={item.question.id}
                              initialStatus={item.record}
                              size="sm"
                              onUpdate={(newStatus) => {
                                setLocalFavoriteQuestions((prev) =>
                                  prev.map((p) =>
                                    p.question.id === item.question.id
                                      ? { ...p, record: newStatus }
                                      : p,
                                  ),
                                );
                              }}
                              className="ml-2"
                            />
                          </div>
                          <p className="font-medium text-lg leading-snug group-hover:text-primary transition-colors">
                            {item.question.questionText}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/sections/${item.section.id}`;
                          }}
                        >
                          再挑戦
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  条件に一致するお気に入りがありません
                </h3>
                <p className="text-muted-foreground">
                  フィルター条件を変更するか、新しい問題をお気に入り登録してください。
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{texts.title}</h1>
              <p className="text-muted-foreground">{texts.description}</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              トップに戻る
            </Link>
          </Button>
        </div>

        {/* タブ切り替え（ドロップダウン） */}
        <div className="mb-6">
          <div className="relative w-fit">
            <select
              value={activeTab}
              onChange={(e) =>
                handleTabChange(
                  e.target.value as "history" | "incorrect" | "favorite",
                )
              }
              className="appearance-none bg-white border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-sm font-medium shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer hover:bg-gray-50 transition-colors w-[240px]"
            >
              <option value="history">学習履歴</option>
              <option value="incorrect">
                間違えた問題
                {localIncorrectQuestions.length > 0
                  ? ` (${localIncorrectQuestions.length})`
                  : ""}
              </option>
              <option value="favorite">
                お気に入り
                {localFavoriteQuestions.length > 0
                  ? ` (${localFavoriteQuestions.length})`
                  : ""}
              </option>
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* コンテンツ */}
        {renderTabContent()}
      </div>
    </div>
  );
}
