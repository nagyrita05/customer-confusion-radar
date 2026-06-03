import { ConfusionPattern } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FindingCardProps {
  pattern: ConfusionPattern;
  index: number;
}

export function FindingCard({ pattern, index }: FindingCardProps) {
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
        <div className="space-y-3">
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
    </div>
  );
}
