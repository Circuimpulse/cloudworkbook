"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MockTestQuestionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  answers: Record<number, string>;
  questions: { id: number }[];
  currentIndex: number;
  onJump: (index: number) => void;
}

export default function MockTestQuestionListModal({
  isOpen,
  onClose,
  totalQuestions,
  answers,
  questions,
  currentIndex,
  onJump,
}: MockTestQuestionListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">問題一覧</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ステータス説明 */}
        <div className="flex justify-center gap-4 px-4 pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-blue-500" />
            <span>解答済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-white border border-gray-300" />
            <span>未回答</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-primary ring-2 ring-primary ring-offset-1" />
            <span>現在</span>
          </div>
        </div>

        {/* 問題グリッド */}
        <div className="p-4">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((q, index) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = index === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    onJump(index);
                    onClose();
                  }}
                  className={`
                    h-10 w-full flex items-center justify-center rounded-lg
                    text-sm font-bold transition-all
                    ${isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1" : ""}
                    ${!isCurrent && isAnswered ? "bg-blue-500 text-white" : ""}
                    ${!isCurrent && !isAnswered ? "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" : ""}
                    cursor-pointer active:scale-95
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* フッターサマリー */}
        <div className="p-4 border-t border-gray-100 text-center text-sm text-muted-foreground">
          解答済み: {Object.keys(answers).length} / {totalQuestions}問
        </div>
      </div>
    </div>
  );
}
