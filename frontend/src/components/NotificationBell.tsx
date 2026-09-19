import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RiBellLine, RiBellFill } from "@remixicon/react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const {
    permission,
    isSubscribed,
    requestPermission,
    unsubscribe,
    testNotification,
  } = usePushNotifications();

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        await requestPermission();
      } else {
        await unsubscribe();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await testNotification();
    } finally {
      setTesting(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all cursor-pointer",
            isSubscribed
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-border/60 bg-card/80 text-muted-foreground hover:bg-muted hover:text-foreground",
            className
          )}
          title={isSubscribed ? "Notificações ativadas" : "Ativar notificações"}
          aria-label="Notificações"
        >
          {isSubscribed ? (
            <RiBellFill className="size-4.5 text-primary" />
          ) : (
            <RiBellLine className="size-4.5" />
          )}

          {/* Indicador de status */}
          <span
            className={cn(
              "absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-background",
              isSubscribed
                ? "bg-emerald-500"
                : "bg-amber-500 animate-pulse"
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-4 shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  isSubscribed
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isSubscribed ? (
                  <RiBellFill className="size-4" />
                ) : (
                  <RiBellLine className="size-4" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold leading-tight">
                  Notificações de Vendas
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Alertas em tempo real
                </p>
              </div>
            </div>

            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                isSubscribed
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isSubscribed ? "Ativo" : "Inativo"}
            </span>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="topbar-push-toggle"
                  className="text-xs font-medium cursor-pointer"
                >
                  Notificações Push
                </Label>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Receba avisos sonoros e na tela mesmo com o app fechado
                </p>
              </div>
              <Switch
                id="topbar-push-toggle"
                checked={isSubscribed}
                onCheckedChange={handleToggle}
                disabled={loading || permission === "denied"}
              />
            </div>

            {permission === "denied" && (
              <div className="rounded bg-destructive/10 p-2 text-[11px] text-destructive leading-tight">
                ⚠️ Permissão bloqueada pelo navegador. Permita notificações nas
                configurações do site (no ícone de cadeado na barra de endereço).
              </div>
            )}
          </div>

          {isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing}
              className="w-full text-xs h-8"
            >
              {testing ? "Enviando teste..." : "🔔 Enviar Notificação de Teste"}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
