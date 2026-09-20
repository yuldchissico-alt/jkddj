import { RiMetaLine, RiAddCircleLine, RiLink, RiRefreshLine, RiCloseCircleLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { FacebookAdsGuide } from "./FacebookAdsGuide";

interface FacebookHeaderProps {
  onAddAccount: () => void;
}

const META_STATUS_LABELS = {
  not_connected: "Não conectado",
  connecting: "Conectando",
  connected: "Conectado",
  token_expired: "Token expirado",
  error: "Erro de conexão",
} as const;

export function FacebookHeader({ onAddAccount }: FacebookHeaderProps) {
  const [metaStatus, setMetaStatus] = useState<string>("not_connected");
  const [metaAccount, setMetaAccount] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const token = document.cookie.split("access_token=")[1]?.split(";")[0] || "";
        const response = await fetch("/api/meta/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setMetaStatus(data.status || "not_connected");
        setMetaAccount(data.account_name || null);
      } catch {
        setMetaStatus("not_connected");
      }
    };

    const params = new URLSearchParams(window.location.search);
    const metaStatusParam = params.get("meta_status");

    loadStatus();

    if (metaStatusParam) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const connectMeta = async () => {
    setMetaStatus("connecting");
    try {
      const token = document.cookie.split("access_token=")[1]?.split(";")[0] || "";
      const response = await fetch("/api/meta/connect", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch {
      setMetaStatus("error");
    }
  };

  const disconnectMeta = async () => {
    setMetaStatus("not_connected");
    try {
      const token = document.cookie.split("access_token=")[1]?.split(";")[0] || "";
      await fetch("/api/meta/disconnect", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setMetaStatus("error");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#1877F2]/10 p-2.5">
          <RiMetaLine className="size-5 text-[#1877F2]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meta Ads</h1>
          <p className="text-sm text-muted-foreground">
            Conecte seus perfis e gerencie suas contas de anúncio
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground bg-background">
          {META_STATUS_LABELS[metaStatus as keyof typeof META_STATUS_LABELS] ?? "Não conectado"}
          {metaAccount ? ` · ${metaAccount}` : ""}
        </div>
        <FacebookAdsGuide />
        <Button onClick={connectMeta} className="gap-1.5 h-9" variant={metaStatus === "connected" ? "secondary" : "default"}>
          {metaStatus === "connected" ? <RiRefreshLine className="size-4" /> : <RiLink className="size-4" />}
          {metaStatus === "connected" ? "Adicionar perfil" : "Adicionar perfil"}
        </Button>
        {metaStatus === "connected" && (
          <Button onClick={disconnectMeta} variant="outline" className="gap-1.5 h-9 text-destructive border-destructive/30">
            <RiCloseCircleLine className="size-4" />
            Desconectar
          </Button>
        )}
        <Button onClick={onAddAccount} className="gap-1.5 h-9">
          <RiAddCircleLine className="size-4" />
          Adicionar Conta
        </Button>
      </div>
    </div>
  );
}
