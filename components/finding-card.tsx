import { ConfusionPattern } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FindingCardProps {
  pattern: ConfusionPattern;
  index: number;
}

export function FindingCard({ pattern, index }: FindingCardProps) {
  const severityStyles = {
    critical: "bg-[#C00000] text-white border-[#C00000]",
    moderate: "bg-accent text-accent-foreground border-accent",
    minor: "bg-[#F2ECC8] text-[#6B5A12] border-[#EFD98A]",
  };

  const severityLabel = {
    critical: "Kritikus",
    moderate: "Közepes",
    minor: "Enyhe",
  };

  return (
    <div className="rounded-lg border border-[#EFD98A] bg-[#FFF6D6] p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-[#002060]">
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

      <p className="text-[#6B5A12] mb-4 leading-relaxed">
        {pattern.humanInsight}
      </p>

      {pattern.exampleComments.length > 0 && (
        <div className="space-y-3">
          {pattern.exampleComments.map((comment, i) => (
            <blockquote
              key={i}
              className="border-l-4 border-[#EFD98A] pl-4 py-2 italic text-[#6B5A12] bg-white/60 rounded-r-md"
            >
              &ldquo;{comment}&rdquo;
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}
