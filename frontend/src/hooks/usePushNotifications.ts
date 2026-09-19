import { useEffect, useState } from "react";
import { toast } from "sonner";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notificações não suportadas neste navegador");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      toast.error("Service Worker não suportado");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        await subscribeUser();
        toast.success("Notificações ativadas com sucesso!");
        return true;
      } else if (result === "denied") {
        toast.error("Permissão para notificações negada");
        return false;
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      toast.error("Erro ao ativar notificações");
      return false;
    }

    return false;
  };

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Verificar se já existe uma subscrição
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        // Chave pública VAPID do backend
        const vapidPublicKey = "BJcZLn4wys-g6n0TH_Q_x5TLmAfp01-sKdRRaqjmBIVpuehfIRoXlY38Fs8N7l-L9v_rebHCzS84e8eaY4bNSRc";
        
        // Converter para Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Criar nova subscrição
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      setSubscription(sub);
      
      // Enviar subscrição para o backend
      await sendSubscriptionToBackend(sub);
      
      return sub;
    } catch (error) {
      console.error("Erro ao criar subscrição push:", error);
      return null;
    }
  };

  const sendSubscriptionToBackend = async (sub: PushSubscription) => {
    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
            auth: arrayBufferToBase64(sub.getKey("auth")),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar subscrição ao servidor");
      }
    } catch (error) {
      console.error("Erro ao enviar subscrição:", error);
    }
  };

  // Helper para converter VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Helper para converter ArrayBuffer para Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
    if (!buffer) return "";
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const unsubscribe = async () => {
    if (subscription) {
      try {
        // Notificar backend primeiro
        await fetch(`/api/notifications/unsubscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: "DELETE",
        });
        
        // Depois cancelar localmente
        await subscription.unsubscribe();
        setSubscription(null);
        toast.success("Notificações desativadas");
      } catch (error) {
        console.error("Erro ao cancelar subscrição:", error);
        toast.error("Erro ao desativar notificações");
      }
    }
  };

  // Simular notificação de venda (para teste)
  const testNotification = async () => {
    if (permission !== "granted") {
      await requestPermission();
      return;
    }

    try {
      // Usar endpoint do backend para enviar notificação de teste
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Notificação de teste enviada!");
      } else {
        toast.error("Erro ao enviar notificação de teste");
      }
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      toast.error("Erro ao enviar notificação");
    }
  };

  return {
    permission,
    subscription,
    isSubscribed: !!subscription,
    requestPermission,
    unsubscribe,
    testNotification,
  };
}
