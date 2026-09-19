import { RefreshButton } from "@/components/RefreshButton";
import { NotificationBell } from "@/components/NotificationBell";
import { RiTrophyLine, RiInformationLine } from "@remixicon/react";

interface DashboardHeaderProps {
  onRefresh: () => Promise<void>;
  currentRevenue?: number; // Faturamento atual em reais
}

export function DashboardHeader({ onRefresh, currentRevenue = 0 }: DashboardHeaderProps) {

  // Calcular progresso dos prêmios
  // Backend armazena em BRL, convertemos para MZN (1 BRL = 13 MZN)
  const BRL_TO_MZN = 13;
  const prizeGoalBRL = 76_923; // ~77k BRL = 1M MZN (1.000.000 / 13)
  const prizeGoalMZN = 1_000_000; // MT 1 milhão
  
  const currentRevenueValue = currentRevenue || 0;
  const currentRevenueMZN = currentRevenueValue * BRL_TO_MZN;
  const prizeProgress = Math.min((currentRevenueValue / prizeGoalBRL) * 100, 100);
  
  // Garantir que a barra tenha pelo menos 1% de largura se houver algum valor
  const displayProgress = currentRevenueValue > 0 && prizeProgress < 1 ? 1 : prizeProgress;
  
  // Formatar valores em Metical
  const formatPrize = (value: number) => {
    if (value >= 1_000_000) {
      const millions = value / 1_000_000;
      // Se for número inteiro, não mostrar decimal
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}k`;
    }
    return value.toFixed(0);
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Dashboard - Principal
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Visão geral do desempenho
        </p>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <RefreshButton onRefresh={onRefresh} />
        
        {/* Prêmios com barra de progresso */}
        <div className="hidden sm:flex flex-col mx-1">
          <div className="flex flex-row items-center">
            <div className="mr-1 text-primary">
              <RiTrophyLine className="size-5" strokeWidth={2.15} />
            </div>
            <span className="mr-6">
              <span className="font-semibold text-primary">Prêmios</span>
              <span className="ml-1" title={`${prizeProgress.toFixed(2)}% da meta atingido`}>
                <RiInformationLine className="inline size-[15px] mb-[2px] cursor-help" strokeWidth={2.75} />
              </span>
            </span>
            <span className="space-x-1">
              <span className="font-bold">{formatPrize(currentRevenueMZN)} MT</span>
              <span className="font-bold">/</span>
              <span className="font-bold">{formatPrize(prizeGoalMZN)} MT</span>
            </span>
          </div>
          <div className="w-full mt-2 h-2 bg-muted rounded-full overflow-hidden" title={`Progresso: ${prizeProgress.toFixed(1)}%`}>
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out shadow-sm" 
              style={{ 
                width: `${displayProgress}%`, 
                background: displayProgress > 0 
                  ? 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)' 
                  : 'transparent',
                minWidth: displayProgress > 0 ? '4px' : '0'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
