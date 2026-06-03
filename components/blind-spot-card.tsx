import { BlindSpot } from "@/lib/types";

interface BlindSpotCardProps {
  blindSpot: BlindSpot;
}

export function BlindSpotCard({ blindSpot }: BlindSpotCardProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h4 className="font-semibold text-amber-800 mb-2">{blindSpot.label}</h4>
      <p className="text-amber-700 text-sm leading-relaxed">
        {blindSpot.description}
      </p>
    </div>
  );
}
