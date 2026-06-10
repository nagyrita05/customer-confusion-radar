import { BlindSpot } from "@/lib/types";

interface BlindSpotCardProps {
  blindSpot: BlindSpot;
}

export function BlindSpotCard({ blindSpot }: BlindSpotCardProps) {
  return (
    <div className="rounded-lg border border-[#EFD98A] bg-[#FFF6D6] p-4">
      <h4 className="font-semibold text-[#002060] mb-2">{blindSpot.label}</h4>
      <p className="text-[#6B5A12] text-sm leading-relaxed">
        {blindSpot.description}
      </p>
    </div>
  );
}
