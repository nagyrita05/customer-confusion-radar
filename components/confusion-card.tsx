import { ConfusionPattern } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConfusionCardProps {
  pattern: ConfusionPattern;
  index: number;
}

export function ConfusionCard({ pattern, index }: ConfusionCardProps) {
  const severityStyles = {
    critical: "bg-red-50 border-red-200 text-red-700",
    moderate: "bg-amber-50 border-amber-200 text-amber-700",
    minor: "bg-teal-50 border-teal-200 text-teal-700",
  };

  const severityLabel = {
    critical: "Critical",
    moderate: "Moderate",
    minor: "Minor",
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
        <div className="mb-4 space-y-2">
          {pattern.exampleComments.map((comment, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground"
            >
              &ldquo;{comment}&rdquo;
            </blockquote>
          ))}
        </div>
      )}

      <div className="bg-secondary/50 rounded-lg p-4 border border-border">
        <p className="text-sm font-medium text-foreground mb-1">
          Fix this week:
        </p>
        <p className="text-sm text-muted-foreground">
          {pattern.actionableAdvice}
        </p>
      </div>
    </div>
  );
}
