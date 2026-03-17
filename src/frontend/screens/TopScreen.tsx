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

        {/* 説明セクション（PCのみ） */}
        <section className="hidden md:block mt-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
          <div className="h-1 w-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
          <p className="mt-6 text-2xl font-medium leading-relaxed text-slate-600 text-balance max-w-3xl">
            {texts.description.line1}
            <br />
            {texts.description.line2}
          </p>
        </section>

        {/* 過去問一覧セクション */}
        <section className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both md:mt-24 md:delay-300">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 md:text-3xl">
              {texts.sectionListTitle}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
          </div>

          {/* スマホ: 横長カード(4:1), PC: 従来のカードグリッド */}
          <div className="mt-4 flex flex-col gap-2 md:mt-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/exams/${exam.id}`}
                className="group relative flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm transition-all duration-200 active:scale-[0.98] hover:border-blue-400/50 hover:bg-white hover:shadow-md md:flex-col md:items-start md:rounded-2xl md:p-8 md:hover:-translate-y-1 md:hover:shadow-xl"
              >
                {/* PC用ホバーエフェクト */}
                <div className="absolute -right-20 -top-20 hidden h-40 w-40 rounded-full bg-blue-100/50 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100 md:block" />

                {/* アイコン */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 md:h-14 md:w-14">
                  <CheckCircle2 className="h-5 w-5 md:h-7 md:w-7" />
                </div>

                {/* タイトル */}
                <p className="relative z-10 ml-3 text-sm font-bold text-slate-900 md:ml-0 md:mt-4 md:text-2xl">
                  {exam.title}
                </p>

                {/* 説明（PCのみ） */}
                <p className="relative z-10 mt-3 hidden text-base font-medium leading-relaxed text-slate-500 md:block md:text-lg">
                  {exam.description || "この試験区分の過去問題を学習します"}
                </p>

                {/* 矢印（スマホ: 常時表示, PC: ホバー時） */}
                <span className="relative z-10 ml-auto text-sm font-bold text-blue-500 md:mt-6 md:self-end md:text-blue-600 md:opacity-0 md:transition-all md:duration-300 md:group-hover:opacity-100">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 下部余白 */}
        <div className="pb-12" />
      </div>
    </PageContainer>
  );
}
