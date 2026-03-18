"use client";

import { useMemo, useState } from "react";
import { SectionsAccordion } from "@/frontend/components/features/sections-accordion";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import { PageContainer } from "@/frontend/components/common/page-container";
import {
  SectionHeader,
  SubSectionHeader,
} from "@/frontend/components/common/section-header";
import type { Section, Exam } from "@/backend/db/schema";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// AP午後の11分野（問番号順に固定）
const AP_GOGO_CATEGORIES = [
  "情報セキュリティ",
  "経営戦略",
  "プログラミング",
  "システムアーキテクチャ",
  "ネットワーク",
  "データベース",
  "組込みシステム開発",
  "情報システム開発",
  "プロジェクトマネジメント",
  "サービスマネジメント",
  "システム監査",
] as const;

/** セクションdescriptionから分野名を抽出 */
function extractCategory(description?: string | null): string | null {
  if (!description) return null;
  const match = description.match(/午後\s+問\d+\s+(.+)$/);
  return match ? match[1] : null;
}

/**
 * セクション選択画面
 * トップから遷移して問題を選べる画面
 */
interface SectionScreenProps {
  sections: (Pick<Section, "id" | "title" | "order" | "description"> & {
    examTitle?: string | null;
  })[];
  exam?: Exam;
}

export default function SectionScreen({ sections, exam }: SectionScreenProps) {
  const texts = APP_TEXTS.section;
  const router = useRouter();

  const title = exam?.title || texts.title;
  const description = exam?.description || texts.description;

  // AP午後判定
  const isApGogo = exam?.slug === "ap-gogo";

  // 分野フィルタstate（AP午後のみ）
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set(AP_GOGO_CATEGORIES),
  );

  // 各分野のセクション数を計算
  const categoryCounts = useMemo(() => {
    if (!isApGogo) return {};
    const counts: Record<string, number> = {};
    for (const s of sections) {
      const cat = extractCategory(s.description);
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [sections, isApGogo]);

  // フィルタ適用後のセクション
  const filteredSections = useMemo(() => {
    if (!isApGogo || selectedCategories.size === AP_GOGO_CATEGORIES.length) {
      return sections;
    }
    return sections.filter((s) => {
      const cat = extractCategory(s.description);
      return cat && selectedCategories.has(cat);
    });
  }, [sections, isApGogo, selectedCategories]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const selectAll = () => setSelectedCategories(new Set(AP_GOGO_CATEGORIES));
  const deselectAll = () => setSelectedCategories(new Set());

  return (
    <PageContainer>
      {/* タイトルセクション */}
      <SectionHeader title={title} subtitle={description} />

      {/* AP午後: 分野選択フィルタ */}
      {isApGogo && (
        <section className="mt-8">
          <SubSectionHeader title="分野を選択" />
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/60 p-4 md:p-6 shadow-sm backdrop-blur-xl">
            <p className="text-sm text-slate-500 mb-3">
              問1（情報セキュリティ）は必須、問2〜11から4問を選択して解答する試験です。
              学習したい分野を選んでフィルタできます。
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {AP_GOGO_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.has(cat);
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`
                      inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${isSelected
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"}
                    `}
                  >
                    {isSelected && <span className="text-xs">✓</span>}
                    {cat}
                    <span className={`text-xs ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <button onClick={selectAll} className="text-blue-600 hover:text-blue-800 font-medium">
                全選択
              </button>
              <button onClick={deselectAll} className="text-blue-600 hover:text-blue-800 font-medium">
                全解除
              </button>
              <span className="text-slate-400 ml-auto">
                {filteredSections.length}/{sections.length} セクション表示中
              </span>
            </div>
          </div>
        </section>
      )}

      {/* コースセクション */}
      <section className="mt-10">
        <SubSectionHeader title={texts.courseSectionTitle} />
        <SectionsAccordion sections={filteredSections} />
      </section>

      {/* 本試験モード */}
      <section className="mt-10">
        <SubSectionHeader title="本試験モード" />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-8 shadow-sm backdrop-blur-xl">
          <p className="text-lg mb-4">
            試験時間内で全問題に挑戦できます。本番さながらの環境で実力を試しましょう。
          </p>
          <Button
            onClick={() => {
              if (exam) {
                router.push(`/mock-test?examId=${exam.id}`);
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-4 text-lg font-bold"
          >
            本試験モードを開始
          </Button>
        </div>
      </section>

      {/* 学習履歴 */}
      <section className="mt-10">
        <SubSectionHeader title="学習履歴" />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-8 shadow-sm backdrop-blur-xl">
          <p className="text-lg mb-4">
            間違えた問題をセクションごとに確認できます。復習して理解を深めましょう。
          </p>
          <Button
            onClick={() => {
              if (exam) {
                router.push(`/history/incorrect?examId=${exam.id}`);
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8 py-4 text-lg font-bold"
          >
            間違えた問題を見る
          </Button>
        </div>
      </section>

      {/* 注記 */}
      <section className="mt-8">
        <p className="text-sm text-muted-foreground">{texts.note}</p>
      </section>
    </PageContainer>
  );
}
