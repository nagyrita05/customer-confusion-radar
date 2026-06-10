import { ConfusionPattern } from "@/lib/types";

interface ActionCardProps {
  pattern: ConfusionPattern;
  index: number;
}

export function ActionCard({ pattern, index }: ActionCardProps) {
  return (
    <div className="bg-[#0A2C6E] rounded-lg p-4 border border-[#1A2744]">
      <p className="text-sm font-bold text-accent mb-1">
        {index + 1}. {pattern.topic}
      </p>
      <p className="text-sm text-[#D6DEF2]">
        {pattern.actionableAdvice}
      </p>
    </div>
  );
}
