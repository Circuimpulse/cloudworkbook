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
    <PageContainer>
      <div className="pt-2 md:pt-4">
        {/* ブランドセクション */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg md:h-20 md:w-20">
            <Cloud className="h-8 w-8 text-white md:h-12 md:w-12" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            {texts.title}
          </h1>
        </div>

        {/* 説明セクション */}
        <section className="mt-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both md:mt-16">
          <div className="h-1 w-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
          <p className="mt-6 text-lg font-medium leading-relaxed text-slate-600 md:text-2xl text-balance max-w-3xl">
            {texts.description.line1}
            <br className="hidden md:block" />
            {texts.description.line2}
          </p>
        </section>

        {/* 過去問一覧セクション */}
        <section className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both md:mt-24">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              {texts.sectionListTitle}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam, index) => (
              <Link
                key={exam.id}
                href={`/exams/${exam.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white/60 p-6 text-left shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-white hover:shadow-xl md:p-8"
              >
                {/* 
                  ホバー時の背景の微細な光芒エフェクト (decoration)
                */}
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-100/50 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-100/50 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative z-10 flex flex-col">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700 md:h-14 md:w-14">
                      <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7" />
                    </div>
                    <div>
                      <p className="text-xl font-bold leading-tight text-slate-900 md:text-2xl">
                        {exam.title}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 pl-16 text-base font-medium leading-relaxed text-slate-500 md:pl-18 md:text-lg">
                    {exam.description || "この試験区分の過去問題を学習します"}
                  </p>
                </div>

                {/* アクセントの矢印 */}
                <div className="relative z-10 mt-6 flex items-center justify-end text-sm font-bold text-blue-600 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4">
                  学習を始める &rarr;
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
