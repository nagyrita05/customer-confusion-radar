"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TopicBreakdownItem } from "@/lib/types";

interface VakfoltChartProps {
  topicBreakdown: TopicBreakdownItem[];
  /** All analyzed comments, 1-based via index+1. */
  analyzedComments: string[];
  /** Number of unique flagged comments (for the summary line). */
  flaggedCount: number;
  /** Total analyzed comments (for the summary line). */
  analyzedCount: number;
}

interface ChartRow {
  label: string;
  count: number;
  comments: string[];
}

export function VakfoltChart({
  topicBreakdown,
  analyzedComments,
  flaggedCount,
  analyzedCount,
}: VakfoltChartProps) {
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);

  // Build rows: count = number of topic mentions (comments can appear in multiple topics)
  const rows: ChartRow[] = topicBreakdown
    .map((topic) => {
      const validIndexes = Array.from(new Set(topic.commentIndexes)).filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= analyzedComments.length
      );
      const comments = validIndexes
        .map((n) => analyzedComments[n - 1])
        .filter((c): c is string => Boolean(c));
      return { label: topic.label, count: validIndexes.length, comments };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  if (rows.length === 0) {
    return null;
  }

  const maxCount = Math.max(...rows.map((r) => r.count));
  // Whole-number ticks from 0 to maxCount
  const ticks = Array.from({ length: maxCount + 1 }, (_, i) => i);

  return (
    <div className="w-full rounded-xl border border-border bg-card p-5 md:p-6">
      <h3 className="text-xl font-semibold text-foreground">
        Kommunikációs vakfoltok
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Hány komment utal az egyes hiányzó információkra.
      </p>

      {/* Bars */}
      <div className="mt-6 flex flex-col gap-3">
        {rows.map((row) => {
          const widthPct = maxCount > 0 ? (row.count / maxCount) * 100 : 0;
          const isExpanded = expandedLabel === row.label;
          return (
            <div key={row.label}>
              <div className="flex items-center gap-3">
                {/* Label */}
                <div className="w-28 sm:w-36 shrink-0 text-sm font-medium text-foreground text-right">
                  {row.label}
                </div>
                {/* Bar track */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-label={`${row.label}: ${row.count} komment. Kattints a kommentek megtekintéséhez.`}
                  onClick={() =>
                    setExpandedLabel((cur) => (cur === row.label ? null : row.label))
                  }
                  className="group relative flex-1 h-8 rounded-md bg-muted overflow-hidden text-left"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-md bg-[#FFCC00] transition-all duration-500 ease-out group-hover:bg-[#F5B700]"
                    style={{ width: `${Math.max(widthPct, 4)}%` }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center text-sm font-semibold text-[#002060]">
                    {row.count}
                  </span>
                </button>
                {/* Expand toggle */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedLabel((cur) => (cur === row.label ? null : row.label))
                  }
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`${row.label} kommentek ki/be kapcsolása`}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Expanded comments behind this topic */}
              {isExpanded && row.comments.length > 0 && (
                <ul className="mt-2 ml-0 sm:ml-[9.75rem] space-y-2">
                  {row.comments.map((comment, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-[#EFD98A] bg-[#FFF6D6] px-3 py-2 text-sm text-[#6B5A12] leading-relaxed"
                    >
                      {comment}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis: whole-number comment counts */}
      <div className="mt-3 flex items-center gap-3">
        <div className="w-28 sm:w-36 shrink-0" />
        <div className="flex-1 flex justify-between text-xs text-muted-foreground">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="w-4 shrink-0" />
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Komment említések száma
      </p>

      {/* Overall summary line — counts UNIQUE flagged comments, not topic mentions */}
      <p className="mt-5 text-center text-sm text-muted-foreground text-balance">
        {flaggedCount} a {analyzedCount} elemzett kommentből hiányzó vagy nem
        egyértelmű információra utal.
      </p>
    </div>
  );
}
