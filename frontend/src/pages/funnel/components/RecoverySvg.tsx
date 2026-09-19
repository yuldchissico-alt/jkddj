import { convertAndFormatMZN } from "@/utils/format";

interface RecoverySvgProps {
  geometry: {
    viewBox: string;
    pathD?: string;
  };
  stages: Array<{
    name: string;
    value: number;
    revenue?: number;
  }>;
  colors?: {
    fill: string;
    stroke: string;
  };
}

export function RecoverySvg({ geometry, stages, colors }: RecoverySvgProps) {
  const defaultColors = {
    fill: "hsl(var(--primary))",
    stroke: "hsl(var(--primary))",
  };
  
  const finalColors = colors || defaultColors;

  return (
    <svg
      viewBox={geometry.viewBox}
      className="w-full h-auto"
      style={{ maxHeight: "400px" }}
    >
      <defs>
        <linearGradient id="recovery-h-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={finalColors.fill} stopOpacity={0.2} />
          <stop offset="50%" stopColor={finalColors.fill} stopOpacity={0.4} />
          <stop offset="100%" stopColor={finalColors.fill} stopOpacity={0.2} />
        </linearGradient>
      </defs>

      {geometry.pathD && (
        <path d={geometry.pathD} fill="url(#recovery-h-grad)" opacity={0.88} />
      )}

      {stages.map((stage, idx) => {
        const y = 100 + idx * 120;
        const barWidth = Math.max((stage.value / (stages[0]?.value || 1)) * 800, 20);
        
        return (
          <g key={idx}>
            <rect
              x={50}
              y={y}
              width={barWidth}
              height={60}
              fill={finalColors.fill}
              opacity={0.7}
              rx={8}
            />
            <text
              x={60}
              y={y + 25}
              fill="currentColor"
              fontSize="14"
              fontWeight="600"
            >
              {stage.name}
            </text>
            <text
              x={60}
              y={y + 45}
              fill="currentColor"
              fontSize="12"
              opacity={0.7}
            >
              {stage.value.toLocaleString()} {stage.revenue && `• ${convertAndFormatMZN(stage.revenue, 0)}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
