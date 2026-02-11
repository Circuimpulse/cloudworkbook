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

export function PageContainer({ children, className, fullWidth = false }: PageContainerProps) {
  return (
    <div className={cn("min-h-[calc(100vh-73px)] bg-[#f5f5f5]", className)}>
      <div
        className={cn(
          "px-8 py-6 md:px-12 md:py-8",
          !fullWidth && "mx-auto max-w-[1440px]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
