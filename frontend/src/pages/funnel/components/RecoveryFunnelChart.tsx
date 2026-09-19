import { Card, CardContent } from "@/components/ui/card";
import { RecoveryStageHeader } from "./RecoveryStageHeader";
import { RecoverySvg } from "./RecoverySvg";
import {
  buildRecoveryFunnelGeometry,
} from "./recoveryFunnelGeometry";

interface RecoveryFunnelChartProps {
  funnel: {
    productId: string;
    productName: string;
    stages: Array<{
      name: string;
      value: number;
      revenue?: number;
    }>;
  };
}

export function RecoveryFunnelChart({ funnel }: RecoveryFunnelChartProps) {
  const geometry = buildRecoveryFunnelGeometry(funnel.stages);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{funnel.productName}</h2>
            <p className="text-sm text-muted-foreground">Funil de Recuperação</p>
          </div>
          
          <div className="space-y-2">
            {funnel.stages.map((stage, idx) => (
              <RecoveryStageHeader
                key={idx}
                name={stage.name}
                value={stage.value}
                revenue={stage.revenue}
                index={idx}
              />
            ))}
          </div>

          <RecoverySvg
            geometry={geometry}
            stages={funnel.stages}
          />
        </div>
      </CardContent>
    </Card>
  );
}
