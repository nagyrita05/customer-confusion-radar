import { ConfusionPattern } from "@/lib/types";

interface ActionCardProps {
  pattern: ConfusionPattern;
  index: number;
}

export function ActionCard({ pattern, index }: ActionCardProps) {
  return (
    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
      <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-1">
        {index + 1}. {pattern.topic}
      </p>
      <p className="text-sm text-green-700 dark:text-green-400">
        {pattern.actionableAdvice}
      </p>
    </div>
  );
}
