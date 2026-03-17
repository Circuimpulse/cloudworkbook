"use client";

import { useState } from "react";
import { X, Pencil, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import DrawingCanvas from "./DrawingCanvas";

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageModal({ src, alt, onClose }: ImageModalProps) {
  const [mode, setMode] = useState<"view" | "draw">("view");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <p className="text-sm font-medium text-slate-700 truncate flex-1 mr-4">
            {alt || "図表"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={mode === "view" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("view")}
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              拡大
            </Button>
            <Button
              variant={mode === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("draw")}
            >
              <Pencil className="h-4 w-4 mr-1" />
              書き込み
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-auto p-4">
          {mode === "view" ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-auto rounded-lg"
              style={{ maxHeight: "75vh", objectFit: "contain" }}
            />
          ) : (
            <DrawingCanvas
              imageUrl={src}
              onSave={(dataUrl) => {
                // ダウンロードとして保存
                const link = document.createElement("a");
                link.download = `drawing_${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
              }}
              onClose={() => setMode("view")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
