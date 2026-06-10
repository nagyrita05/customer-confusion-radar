"use client";

import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";

interface ConfusionGaugeProps {
  flaggedCount: number;
  analyzedCount: number;
  flaggedComments?: string[];
}

export function ConfusionGauge({
  flaggedCount,
  analyzedCount,
  flaggedComments = [],
}: ConfusionGaugeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const safeAnalyzed = Math.max(0, analyzedCount);
  const safeFlagged = Math.max(0, Math.min(flaggedCount, safeAnalyzed || flaggedCount));
  const percent = safeAnalyzed > 0
    ? Math.round((safeFlagged / safeAnalyzed) * 100)
    : 0;
  const clampedScore = Math.max(0, Math.min(100, percent));

  // SVG circle calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const hasFlaggedComments = flaggedComments.length > 0;

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#F2ECC8"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#FFCC00"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-[#002060]">
            {clampedScore}%
          </span>
        </div>
      </div>

      {/* Label with info tooltip */}
      <div className="mt-2 flex items-center gap-1.5">
        <p className="text-sm font-semibold text-foreground">Vakfolt index</p>
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="Mit jelent a Vakfolt index?"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            onClick={() => setShowTooltip((v) => !v)}
          >
            <Info className="h-4 w-4" />
          </button>
          {showTooltip && (
            <div
              role="tooltip"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-10 rounded-md bg-primary px-3 py-2 text-xs leading-relaxed text-primary-foreground shadow-lg"
            >
              Az index azt mutatja, az elemzett kommentek hány százaléka utal
              hiányzó vagy nem egyértelmű információra a kommunikációban.
            </div>
          )}
        </div>
      </div>

      {/* Transparent count-based summary */}
      <p className="text-sm text-muted-foreground text-center text-balance">
        {safeFlagged} a {safeAnalyzed} elemzett kommentből hiányzó vagy nem
        egyértelmű információra utal.
      </p>

      {clampedScore > 70 && (
        <p className="mt-1 text-sm font-semibold text-[#C00000]">
          Kritikus szint
        </p>
      )}

      {/* Verifiable list of flagged comments */}
      {hasFlaggedComments && (
        <div className="mt-3 w-full">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 mx-auto text-sm font-medium text-[#002060] hover:underline"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Megjelölt kommentek elrejtése" : "Mely kommentek lettek megjelölve?"}
          </button>
          {expanded && (
            <ul className="mt-3 space-y-2 text-left">
              {flaggedComments.map((comment, i) => (
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
      )}
    </div>
  );
}
