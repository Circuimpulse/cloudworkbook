"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ImageModal from "./ImageModal";

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
