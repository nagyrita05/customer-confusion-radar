import { DataQualityStats } from "@/lib/types";

interface DataQualityPanelProps {
  stats: DataQualityStats;
}

export function DataQualityPanel({ stats }: DataQualityPanelProps) {
  return (
    <div className="mb-6">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Adattisztítás</p>
      <div className="bg-muted/50 border border-border rounded-md px-4 py-3 font-mono text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Beolvasott sorok:</span>
          <span>{stats.totalLines}</span>
        </div>
        <div className="flex justify-between">
          <span>Eltávolított metaadat:</span>
          <span>{stats.removedMetadata}</span>
        </div>
        <div className="flex justify-between">
          <span>Elemzett kommentek:</span>
          <span>{stats.analyzedComments}</span>
        </div>
      </div>
    </div>
  );
}
