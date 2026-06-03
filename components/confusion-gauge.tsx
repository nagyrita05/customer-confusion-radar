"use client";

interface ConfusionGaugeProps {
  score: number;
}

export function ConfusionGauge({ score }: ConfusionGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Determine color based on score
  const getColor = (s: number) => {
    if (s <= 40) return { stroke: "#22c55e", text: "text-green-600" };
    if (s <= 70) return { stroke: "#f59e0b", text: "text-amber-600" };
    return { stroke: "#ef4444", text: "text-red-600" };
  };
  
  const color = getColor(clampedScore);
  
  // SVG circle calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${color.text}`}>
            {clampedScore}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">
        Felreertesi index
      </p>
      <p className="text-sm text-muted-foreground">
        A kommentek {clampedScore}%-a tartalmaz felreertest
      </p>
    </div>
  );
}
