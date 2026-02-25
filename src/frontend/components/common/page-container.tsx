import { cn } from "@/lib/utils";

/**
 * ページ共通コンテナ
 * 最大幅、余白、背景色を統一
 */
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "min-h-[calc(100vh-73px)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-cyan-50 text-slate-900",
        className,
      )}
    >
      <div
        className={cn(
          "px-6 py-8 md:px-12 md:py-12",
          !fullWidth && "mx-auto max-w-[1440px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
