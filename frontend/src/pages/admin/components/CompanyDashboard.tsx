import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RiMoneyDollarCircleLine, 
  RiLineChartLine, 
  RiPercentLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCalendarLine,
} from "@remixicon/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/hooks/use-company";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

function KpiCard({ title, value, change, icon: Icon, loading }: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          {change !== undefined && <Skeleton className="h-4 w-16 mt-1" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn(
            "text-xs flex items-center gap-1 mt-1",
            change >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {change >= 0 ? (
              <RiArrowUpLine className="h-3 w-3" />
            ) : (
              <RiArrowDownLine className="h-3 w-3" />
            )}
            {Math.abs(change).toFixed(1)}% vs mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface MonthlyChartData {
  month: string;
  revenue: number;
  spend: number;
  profit: number;
}

function MonthlyChart({ data, loading }: { data: MonthlyChartData[], loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desempenho Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.spend)));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(-6).map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.month}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Receita: MT {item.revenue.toLocaleString('pt-MZ')}</span>
                  <span>Gasto: MT {item.spend.toLocaleString('pt-MZ')}</span>
                  <span className={cn(
                    "font-semibold",
                    item.profit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    Lucro: MT {item.profit.toLocaleString('pt-MZ')}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 h-8">
                <div 
                  className="bg-green-500 rounded-sm transition-all"
                  style={{ width: `${(item.revenue / maxValue) * 100}%` }}
                />
                <div 
                  className="bg-red-500 rounded-sm transition-all"
                  style={{ width: `${(item.spend / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span>Receita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <span>Investimento</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompanyDashboard() {
  const { dashboard, dashboardLoading, settings, settingsLoading } = useCompany();
  const selectedYear = new Date().getFullYear();

  const loading = dashboardLoading || settingsLoading;

  // Calculate KPIs from dashboard data
  const currentMonth = dashboard?.monthly[dashboard.monthly.length - 1];
  const previousMonth = dashboard?.monthly[dashboard.monthly.length - 2];

  const totalRevenue = dashboard?.monthly.reduce((sum, m) => sum + m.revenue, 0) ?? 0;
  const totalSpend = dashboard?.monthly.reduce((sum, m) => sum + m.spend, 0) ?? 0;
  const totalProfit = totalRevenue - totalSpend;
  const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

  const revenueChange = currentMonth && previousMonth
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    : 0;

  const chartData: MonthlyChartData[] = dashboard?.monthly.map(m => ({
    month: m.month,
    revenue: m.revenue,
    spend: m.spend,
    profit: m.revenue - m.spend,
  })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard Empresa</h2>
          <p className="text-sm text-muted-foreground">
            Visão geral do desempenho financeiro e operacional
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RiCalendarLine className="h-4 w-4" />
          <span>Ano {selectedYear}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Receita Total"
          value={`MT ${(totalRevenue / 1000).toFixed(1)}k`}
          change={revenueChange}
          icon={RiMoneyDollarCircleLine}
          loading={loading}
        />
        <KpiCard
          title="Investimento Total"
          value={`MT ${(totalSpend / 1000).toFixed(1)}k`}
          icon={RiLineChartLine}
          loading={loading}
        />
        <KpiCard
          title="Lucro Líquido"
          value={`MT ${(totalProfit / 1000).toFixed(1)}k`}
          icon={RiMoneyDollarCircleLine}
          loading={loading}
        />
        <KpiCard
          title="ROI"
          value={`${roi.toFixed(1)}%`}
          icon={RiPercentLine}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyChart data={chartData} loading={loading} />
        
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Taxa de Impostos</span>
                  <span className="text-sm text-muted-foreground">{settings?.tax_rate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Custos Operacionais</span>
                  <span className="text-sm text-muted-foreground">
                    {settings?.operational_costs?.length ?? 0} itens
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Total Custos Mensais</span>
                  <span className="text-sm font-semibold">
                    MT {(settings?.operational_costs?.reduce((sum, c) => sum + c.amount, 0) ?? 0).toLocaleString('pt-MZ')}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
