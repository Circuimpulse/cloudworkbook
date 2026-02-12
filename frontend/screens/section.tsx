import { SectionsAccordion } from "@/frontend/components/features/sections-accordion";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import { PageContainer } from "@/frontend/components/common/page-container";
import {
  SectionHeader,
  SubSectionHeader,
} from "@/frontend/components/common/section-header";
import type { Section, Exam } from "@/backend/db/schema";

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

      {/* 注記 */}
      <section className="mt-8">
        <p className="text-sm text-muted-foreground">{texts.note}</p>
      </section>
    </PageContainer>
  );
}
