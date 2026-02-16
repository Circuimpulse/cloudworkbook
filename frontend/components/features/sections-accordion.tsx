"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SectionItem {
  id: number;
  title: string;
  order: number;
  examTitle?: string | null;
}

interface SectionsAccordionProps {
  sections: SectionItem[];
}

const CHUNK_SIZE = 10;

const chunkSections = (sections: SectionItem[]): SectionItem[][] => {
  return Array.from(
    { length: Math.ceil(sections.length / CHUNK_SIZE) },
    (_, i) => sections.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
  );
};

const pad2 = (value: number): string => value.toString().padStart(2, "0");

export function SectionsAccordion({ sections }: SectionsAccordionProps) {
  const router = useRouter();
  const groups = useMemo(() => chunkSections(sections), [sections]);
  const [openGroupIndex, setOpenGroupIndex] = useState<number>(0);

  if (groups.length === 0) {
    return (
      <div className="mt-6 rounded-[40px] border border-black/30 bg-white p-8">
        <p className="text-lg">まだセクションが登録されていません。</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {groups.map((group, groupIndex) => {
        const isOpen = groupIndex === openGroupIndex;
        // Use actual order from the first and last item in the group
        const startNo = group.length > 0 ? group[0].order : 0;
        const endNo = group.length > 0 ? group[group.length - 1].order : 0;
        const rangeLabel = `#${pad2(startNo)} ~ #${pad2(endNo)}`;

        return (
          <div
            key={rangeLabel}
            className="rounded-[40px] border border-black/30 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenGroupIndex(isOpen ? -1 : groupIndex)}
              className="w-full text-left"
            >
              <div className="px-8 py-8">
                <div className="flex items-center gap-3 text-2xl md:text-[32px]">
                  {isOpen ? (
                    <ChevronDown className="h-7 w-7 shrink-0" />
                  ) : (
                    <ChevronRight className="h-7 w-7 shrink-0" />
                  )}
                  <span>{rangeLabel}</span>
                </div>
                <p className="mt-2 pl-10 text-xl text-black/60 md:text-[32px]">
                  {group.length}セクション
                </p>
              </div>
            </button>

            {isOpen && (
              <div className="px-14 pb-10">
                <div className="space-y-3">
                  {group.map((section) => (
                    <div key={section.id}>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            // 進捗をリセット
                            const response = await fetch(
                              `/api/learning/units/${section.id}/reset`,
                              {
                                method: "POST",
                              },
                            );
                            
                            if (!response.ok) {
                              throw new Error("Failed to reset progress");
                            }
                            
                            // リセット完了後、フルリロードで遷移（キャッシュを完全にバイパス）
                            const timestamp = Date.now();
                            window.location.href = `/sections/${section.id}?retry=${timestamp}`;
                          } catch (err) {
                            console.error("Failed to reset progress", err);
                            alert("進捗のリセットに失敗しました");
                          }
                        }}
                        className="inline-block text-left text-2xl text-[#78BFC7] hover:opacity-80 md:text-[32px]"
                      >
                        {section.examTitle && (
                          <span className="block text-base text-gray-500 mb-1 pointer-events-none">
                            {section.examTitle}
                          </span>
                        )}
                        {section.title}
                      </button>
                      <div className="mt-1 h-px w-[204px] bg-[#78BFC7]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
