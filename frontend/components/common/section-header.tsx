import { cn } from "@/lib/utils";

/**
 * セクションヘッダー（タイトル + 区切り線）
 */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  return (
    <section className={className}>
      <h1 className="text-3xl font-normal md:text-[40px]">{title}</h1>
      <hr className="mt-4 border-black/40" />
      {subtitle && (
        <p className="mt-4 text-lg md:text-2xl">{subtitle}</p>
      )}
    </section>
  );
}

/**
 * サブセクションヘッダー（小さめのヘッダー）
 */
interface SubSectionHeaderProps {
  title: string;
  className?: string;
}

export function SubSectionHeader({ title, className }: SubSectionHeaderProps) {
  return (
    <h2 className={cn("text-2xl font-normal md:text-[32px]", className)}>
      {title}
    </h2>
  );
}
