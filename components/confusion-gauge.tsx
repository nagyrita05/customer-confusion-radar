"use client";

interface ConfusionGaugeProps {
  score: number;
}

export function ConfusionGauge({ score }: ConfusionGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

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
            {clampedScore}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">
        Vakfolt index
      </p>
      <p className="text-sm text-muted-foreground">
        A kommentek {clampedScore}%-a hiányzó vagy nem egyértelmű információra utal
      </p>
      {clampedScore > 70 && (
        <p className="mt-1 text-sm font-semibold text-[#C00000]">
          Kritikus szint
        </p>
      )}
    </div>
  );
}
