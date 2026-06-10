import { ConfusionPattern } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConfusionCardProps {
  pattern: ConfusionPattern;
  index: number;
}

export function ConfusionCard({ pattern, index }: ConfusionCardProps) {
  const severityStyles = {
    critical: "bg-red-500 text-white border-red-600",
    moderate: "bg-amber-500 text-white border-amber-600",
    minor: "bg-teal-500 text-white border-teal-600",
  };

  const severityLabel = {
    critical: "Kritikus",
    moderate: "Közepes",
    minor: "Enyhe",
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {index + 1}. {pattern.topic}
        </h3>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium border shrink-0",
            severityStyles[pattern.severity]
          )}
        >
          {severityLabel[pattern.severity]}
        </span>
      </div>

      <p className="text-muted-foreground mb-4 leading-relaxed">
        {pattern.humanInsight}
      </p>

      {pattern.exampleComments.length > 0 && (
        <div className="mb-4 space-y-3">
          {pattern.exampleComments.map((comment, i) => (
            <blockquote
              key={i}
              className="border-l-4 border-muted-foreground/40 pl-4 py-2 italic text-muted-foreground bg-muted/30 rounded-r-md"
            >
              &ldquo;{comment}&rdquo;
            </blockquote>
          ))}
        </div>
      )}

      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
        <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-1">
          Ezt csináld meg ezen a héten:
        </p>
        <p className="text-sm text-green-700 dark:text-green-400">
          {pattern.actionableAdvice}
        </p>
      </div>
    </div>
  );
}
