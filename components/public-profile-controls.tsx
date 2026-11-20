"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function ProfileSectionNav({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  if (!sections.length) return null;
  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-[64px] z-20 -mx-1 overflow-x-auto rounded-xl border border-[#E5ECE8] bg-white/95 px-2 shadow-sm backdrop-blur sm:mx-0"
    >
      <ul className="flex min-w-max items-center gap-1 py-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-[#52635B] transition-colors hover:bg-[#EAF5F0] hover:text-[#267653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FA47B]"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ExpandableSummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 520 || text.split("\n").length > 5;
  return (
    <>
      <p
        className={`whitespace-pre-line leading-7 text-[#52635B] ${isLong && !expanded ? "line-clamp-5" : ""}`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[#267653] hover:text-[#16895C]"
        >
          {expanded ? "Read less" : "Read more"}
          <ChevronDown
            className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </>
  );
}
