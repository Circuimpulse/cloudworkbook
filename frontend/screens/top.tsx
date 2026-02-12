import Link from "next/link";
import { CheckCircle2, Cloud } from "lucide-react";
import { APP_TEXTS } from "@/frontend/constants/descriptions";
import { PageContainer } from "@/frontend/components/common/page-container";
import type { Exam } from "@/backend/db/schema";

/**
 * トップ画面（最初に表示される画面）
 * 過去問一覧を表示し、各セクションへの導線を提供
 */
interface TopScreenProps {
  exams: Exam[];
}

export default function TopScreen({ exams }: TopScreenProps) {
  const texts = APP_TEXTS.top;

  return (
    <PageContainer className="bg-white">
      {/* ブランドセクション */}
      <div className="flex items-center gap-3">
        <Cloud className="h-[42px] w-[42px]" />
        <h1 className="text-[32px] font-normal md:text-[40px]">{texts.title}</h1>
      </div>

      {/* 説明セクション */}
      <section className="mt-8 md:mt-[34px]">
        <h2 className="text-[32px] font-extrabold md:text-[40px]">{texts.title}</h2>
        <hr className="mt-5 border-black" />
        <p className="mt-5 text-[18px] font-normal leading-tight md:text-[24px]">
          {texts.description.line1}
          <br />
          {texts.description.line2}
        </p>
      </section>

      {/* 過去問一覧セクション */}
      <section className="mt-10 md:mt-12">
        <h3 className="text-[32px] font-extrabold md:text-[40px]">
          {texts.sectionListTitle}
        </h3>
        <hr className="mt-5 border-black" />

        <div className="mt-8 grid grid-cols-1 gap-[10px] md:grid-cols-2">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={`/sections?examId=${exam.id}`}
              className="flex flex-col gap-[10px] rounded-[10px] border border-black bg-white px-6 py-6 transition-colors hover:bg-muted/40 md:px-[46px] md:py-[23px]"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-[30px] w-[30px] shrink-0" />
                <p className="text-[24px] font-extrabold leading-none md:text-[40px]">
                  {exam.title}
                </p>
              </div>
              <p className="pl-[42px] text-[16px] font-normal leading-tight md:text-[24px]">
                {exam.description || ""}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
