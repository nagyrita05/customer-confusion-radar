interface ActionCardProps {
  title: string;
  advice: string;
  index: number;
}

export function ActionCard({ title, advice, index }: ActionCardProps) {
  return (
    <div className="bg-[#0A2C6E] rounded-lg p-4 border border-[#1A2744]">
      <p className="text-sm font-bold text-accent mb-1">
        {index + 1}. {title}
      </p>
      <p className="text-sm text-[#D6DEF2]">
        {advice}
      </p>
    </div>
  );
}
