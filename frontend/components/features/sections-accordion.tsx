"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SectionItem {
  id: number;
  title: string;
}

interface SectionsAccordionProps {
  sections: SectionItem[];
}

const CHUNK_SIZE = 10;

const chunkSections = (sections: SectionItem[]): SectionItem[][] => {
  return Array.from(
    { length: Math.ceil(sections.length / CHUNK_SIZE) },
    (_, i) => sections.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
  );
};

const pad2 = (value: number): string => value.toString().padStart(2, "0");

export function SectionsAccordion({ sections }: SectionsAccordionProps) {
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
        const startNo = groupIndex * CHUNK_SIZE + 1;
        const endNo = startNo + group.length - 1;
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
                      <Link
                        href={`/sections/${section.id}`}
                        className="inline-block text-2xl text-[#78BFC7] hover:opacity-80 md:text-[32px]"
                      >
                        {section.title} #{pad2(section.id)}
                      </Link>
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
