import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RiBellLine, RiNotification3Line } from "@remixicon/react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationSettings() {
  const { permission, isSubscribed, requestPermission, unsubscribe, testNotification } = usePushNotifications();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      await requestPermission();
    } else {
      await unsubscribe();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RiBellLine className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Notificações de Vendas</CardTitle>
            <CardDescription>
              Receba alertas em tempo real quando houver uma nova venda
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications">Ativar notificações push</Label>
            <p className="text-sm text-muted-foreground">
              Funciona mesmo com o app fechado
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={permission === "granted" && isSubscribed}
            onCheckedChange={handleToggle}
            disabled={permission === "denied"}
          />
        </div>

        {permission === "denied" && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">Permissão negada</p>
            <p className="text-xs mt-1">
              Para ativar notificações, você precisa permitir nas configurações do navegador
            </p>
          </div>
        )}

        {permission === "granted" && isSubscribed && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testNotification}
              className="gap-2"
            >
              <RiNotification3Line className="h-4 w-4" />
              Testar Notificação
            </Button>
          </div>
        )}

        {permission === "default" && (
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p>Ative as notificações para receber alertas de novas vendas em tempo real</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
