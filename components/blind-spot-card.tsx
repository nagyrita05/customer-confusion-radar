"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BlindSpot } from "@/lib/types";

interface BlindSpotCardProps {
  blindSpot: BlindSpot;
  /** All analyzed comments, 1-based via index+1. Same source as the chart. */
  analyzedComments: string[];
}

export function BlindSpotCard({ blindSpot, analyzedComments }: BlindSpotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Same matching logic as the chart: dedupe + validate the blind spot's indexes.
  const validIndexes = Array.from(new Set(blindSpot.commentIndexes ?? [])).filter(
    (n) => Number.isInteger(n) && n >= 1 && n <= analyzedComments.length
  );
  const matchingComments = validIndexes
    .map((n) => analyzedComments[n - 1])
    .filter((c): c is string => Boolean(c));
  const count = matchingComments.length;

  return (
    <div className="rounded-lg border border-[#EFD98A] bg-[#FFF6D6] p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold text-[#002060] mb-2">{blindSpot.shortLabel}</h4>
        {count > 0 && (
          <span className="shrink-0 rounded-full bg-[#FFCC00] px-2 py-0.5 text-xs font-semibold text-[#002060]">
            {count} komment
          </span>
        )}
      </div>
      <p className="text-[#6B5A12] text-sm leading-relaxed">
        {blindSpot.fullDescription}
      </p>

      {count > 0 && (
        <>
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#8A6D1B] hover:text-[#6B5A12] transition-colors"
          >
            {isExpanded ? "Kommentek elrejtése" : "Kapcsolódó kommentek megtekintése"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>

          {isExpanded && (
            <ul className="mt-2 space-y-2">
              {matchingComments.map((comment, i) => (
                <li
                  key={i}
                  className="rounded-md border border-[#EFD98A] bg-[#FFFBEC] px-3 py-2 text-sm text-[#6B5A12] leading-relaxed"
                >
                  {comment}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
