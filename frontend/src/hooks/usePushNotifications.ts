import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getCookie } from "@/lib/cookies";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setSubscription(sub);
          }
        })
        .catch((err) => {
          console.warn("Não foi possível verificar subscrição push:", err);
        });
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
        const sub = await subscribeUser();
        if (sub) {
          toast.success("Notificações ativadas com sucesso!");
          return true;
        } else {
          toast.error("Permissão concedida, mas falha ao registrar dispositivo.");
          return false;
        }
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
      
      const token = getCookie("access_token") || "";
      const publicKeyResponse = await fetch("/api/notifications/vapid-public-key", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!publicKeyResponse.ok) {
        throw new Error("VAPID public key indisponível no backend");
      }

      const { public_key } = await publicKeyResponse.json();
      const convertedVapidKey = urlBase64ToUint8Array(public_key);

      // Verificar se já existe uma subscrição
      let sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        // Verificar se a subscrição existente no navegador usava a mesma chave VAPID
        let isMatchingVapid = false;
        if (sub.options && sub.options.applicationServerKey) {
          const currentKeyBytes = new Uint8Array(sub.options.applicationServerKey);
          isMatchingVapid =
            currentKeyBytes.length === convertedVapidKey.length &&
            currentKeyBytes.every((val, i) => val === convertedVapidKey[i]);
        }

        if (!isMatchingVapid) {
          console.warn("Subscrição existente usa chave VAPID antiga ou incompatível. Renovando...");
          await sub.unsubscribe().catch(() => {});
          sub = null;
        }
      }

      if (!sub) {
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
    const token = getCookie("access_token") || "";
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        const token = getCookie("access_token") || "";
        await fetch(`/api/notifications/unsubscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
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
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      const token = getCookie("access_token") || "";
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(data.message || "Notificação de teste enviada!");
      } else {
        toast.error(data.detail || "Erro ao enviar notificação de teste");
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
