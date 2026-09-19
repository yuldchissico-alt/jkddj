import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convertAndFormatMZN } from "@/utils/format";

interface RecoveryFunnelStatsProps {
  funnels: Array<{
    productId: string;
    productName: string;
    stages: Array<{
      name: string;
      value: number;
      revenue?: number;
    }>;
  }>;
}

export function RecoveryFunnelStats({ funnels }: RecoveryFunnelStatsProps) {
  const totalEvents = funnels.reduce(
    (sum, f) => sum + (f.stages[0]?.value || 0),
    0
  );
  
  const totalRecovered = funnels.reduce(
    (sum, f) => sum + (f.stages[f.stages.length - 1]?.value || 0),
    0
  );

  const totalRevenue = funnels.reduce(
    (sum, f) =>
      sum +
      f.stages.reduce((s, stage) => s + (stage.revenue || 0), 0),
    0
  );

  const recoveryRate = totalEvents > 0 ? (totalRecovered / totalEvents) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recuperados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRecovered.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Recuperação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recoveryRate.toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receita Recuperada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {convertAndFormatMZN(totalRevenue, 0)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
