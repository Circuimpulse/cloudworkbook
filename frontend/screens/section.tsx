import { SectionsAccordion } from "@/frontend/components/features/sections-accordion";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import { PageContainer } from "@/frontend/components/common/page-container";
import { SectionHeader, SubSectionHeader } from "@/frontend/components/common/section-header";
import type { Section } from "@/backend/db/schema";

/**
 * セクション選択画面
 * トップから遷移して問題を選べる画面
 */
interface SectionScreenProps {
  sections: Pick<Section, "id" | "title">[];
}

export default function SectionScreen({ sections }: SectionScreenProps) {
  const texts = APP_TEXTS.section;

  return (
    <PageContainer>
      {/* タイトルセクション */}
      <SectionHeader title={texts.title} subtitle={texts.description} />
      <p className="mt-6 text-2xl md:text-[32px]">{texts.qualificationTitle}</p>
      <p className="mt-2 text-lg md:text-2xl">{texts.qualificationDescription}</p>

      {/* コースセクション */}
      <section className="mt-10">
        <SubSectionHeader title={texts.courseSectionTitle} />
        <SectionsAccordion sections={sections} />
      </section>

      {/* 注記 */}
      <section className="mt-8">
        <p className="text-sm text-muted-foreground">
          {texts.note}
        </p>
      </section>
    </PageContainer>
  );
}
