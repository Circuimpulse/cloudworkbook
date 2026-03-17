"use client";

import { useState, useCallback, lazy, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ImageModal from "./ImageModal";

const MermaidBlock = lazy(() => import("./MermaidBlock"));

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const handleImageClick = useCallback((src: string, alt: string) => {
    setModalImage({ src, alt });
  }, []);

  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => {
            const imgSrc = String(src || "");
            const imgAlt = String(alt || "");
            return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={imgAlt}
              onClick={() => handleImageClick(imgSrc, imgAlt)}
              className="rounded-lg shadow-md my-3 max-w-full cursor-pointer hover:shadow-lg hover:brightness-95 transition-all active:scale-[0.98]"
              title="タップで拡大・書き込み"
            />
            );
          },
          code: ({ className: codeClassName, children }) => {
            const match = /language-mermaid/.exec(codeClassName || "");
            if (match) {
              const chart = String(children).replace(/\n$/, "");
              return (
                <Suspense fallback={<div className="my-4 text-center text-slate-400 text-sm">図を読み込み中...</div>}>
                  <MermaidBlock chart={chart} />
                </Suspense>
              );
            }
            return <code className={codeClassName}>{children}</code>;
          },
        }}
        className={className}
      >
        {content}
      </ReactMarkdown>

      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </>
  );
}
