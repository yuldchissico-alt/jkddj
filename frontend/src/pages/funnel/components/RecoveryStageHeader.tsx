import { convertAndFormatMZN } from "@/utils/format";

interface RecoveryStageHeaderProps {
  name: string;
  value: number;
  revenue?: number;
  index: number;
}

export function RecoveryStageHeader({
  name,
  value,
  revenue,
  index,
}: RecoveryStageHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
          {index + 1}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {value.toLocaleString()} eventos
            {revenue !== undefined && ` • ${convertAndFormatMZN(revenue, 0)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
