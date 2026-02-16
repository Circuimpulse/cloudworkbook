"use client";

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

/**
 * セクション選択画面
 * トップから遷移して問題を選べる画面
 */
interface SectionScreenProps {
  sections: (Pick<Section, "id" | "title" | "order"> & {
    examTitle?: string | null;
  })[];
  exam?: Exam;
}

export default function SectionScreen({ sections, exam }: SectionScreenProps) {
  const texts = APP_TEXTS.section;
  const router = useRouter();

  const title = exam?.title || texts.title;
  const description = exam?.description || texts.description;

  return (
    <PageContainer>
      {/* タイトルセクション */}
      <SectionHeader title={title} subtitle={description} />

      {/* コースセクション */}
      <section className="mt-10">
        <SubSectionHeader title={texts.courseSectionTitle} />
        <SectionsAccordion sections={sections} />
      </section>

      {/* 本試験モード */}
      <section className="mt-10">
        <SubSectionHeader title="本試験モード" />
        <div className="mt-6 rounded-[40px] border border-black/30 bg-white p-8">
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
        <div className="mt-6 rounded-[40px] border border-black/30 bg-white p-8">
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
