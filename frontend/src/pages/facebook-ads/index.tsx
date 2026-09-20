import { useEffect, useState } from "react";
import { FacebookHeader } from "./components/FacebookHeader";
import { FacebookTable } from "./components/FacebookTable";
import { AddAccountModal } from "./components/AddAccountModal";
import { SyncAccountsModal } from "./components/SyncAccountsModal";
import { UpdateTokenModal } from "./components/UpdateTokenModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { useFacebookAccounts } from "@/hooks/useFacebookAccounts";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";
import type { FacebookAccountAPI } from "@/services/integrations";

type MetaAdAccount = {
  id: number;
  account_id: string;
  name: string;
  status: string;
  is_active: boolean;
  business_id?: string | null;
};

export default function FacebookAdsPage() {
  const {
    accounts, isLoading, addAccount, bulkAddAccounts,
    removeAccount, removeAccounts, syncAccounts, updateToken,
  } = useFacebookAccounts();

  const [modalOpen, setModalOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncTarget, setSyncTarget] = useState<{ token: string; businessId: string }>({ token: "", businessId: "" });
  const [deleteTargets, setDeleteTargets] = useState<FacebookAccountAPI[]>([]);
  const [updateTokenTargets, setUpdateTokenTargets] = useState<FacebookAccountAPI[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);
  const [prefillToken, setPrefillToken] = useState<string | undefined>();
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaProfileName, setMetaProfileName] = useState<string | null>(null);
  const [metaAccounts, setMetaAccounts] = useState<MetaAdAccount[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  const loadMetaAccounts = async () => {
    try {
      setMetaLoading(true);
      const token = getCookie("access_token") || "";
      const response = await fetch("/api/meta/adaccounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Falha ao buscar contas da Meta");
      }
      const nextAccounts = data.accounts || [];
      setMetaAccounts(nextAccounts);
      setMetaProfileName(data.profile_name || null);
      setMetaConnected(!!nextAccounts.length || !!data.profile_name);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao buscar contas da Meta";
      toast.error(message);
      setMetaAccounts([]);
      setMetaConnected(false);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metaStatusParam = params.get("meta_status");
    const metaAccountParam = params.get("meta_account");

    if (metaStatusParam === "connected") {
      setMetaConnected(true);
      setMetaProfileName(metaAccountParam ? decodeURIComponent(metaAccountParam) : "Meta Ads");
      void loadMetaAccounts();
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (metaStatusParam === "error") {
      const detail = params.get("detail");
      toast.error(detail ? decodeURIComponent(detail) : "Erro ao conectar com a Meta");
      setMetaConnected(false);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    const checkMetaStatus = async () => {
      try {
        const token = getCookie("access_token") || "";
        const response = await fetch("/api/meta/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setMetaConnected(Boolean(data.connected));
        setMetaProfileName(data.account_name || null);
        if (data.connected) await loadMetaAccounts();
      } catch {
        setMetaConnected(false);
      }
    };
    void checkMetaStatus();
  }, []);

  const openAddModal = () => {
    setPrefillToken(undefined);
    setModalOpen(true);
  };

  const openDuplicateModal = (account: FacebookAccountAPI) => {
    setPrefillToken(account.access_token);
    setModalOpen(true);
  };

  const handleAdd = async (label: string, accountId: string, accessToken: string, businessId?: string) => {
    try {
      setIsAdding(true);
      await addAccount(label, accountId, accessToken, businessId);
      setModalOpen(false);
    } catch {
      toast.error("Erro ao adicionar conta Facebook");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkAdd = async (
    items: { label: string; account_id: string }[],
    accessToken: string,
    businessId?: string
  ) => {
    try {
      setIsAdding(true);
      await bulkAddAccounts(items, accessToken, businessId);
      setModalOpen(false);
    } catch {
      toast.error("Erro ao adicionar contas Facebook");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteClick = (account: FacebookAccountAPI) => setDeleteTargets([account]);
  const handleDeleteGroupClick = (group: FacebookAccountAPI[]) => setDeleteTargets(group);

  const handleConfirmDelete = async () => {
    if (!deleteTargets.length) return;
    try {
      setIsDeleting(true);
      if (deleteTargets.length === 1) {
        await removeAccount(deleteTargets[0].id);
      } else {
        await removeAccounts(deleteTargets.map((a) => a.id));
      }
      setDeleteTargets([]);
    } catch {
      toast.error("Erro ao excluir conta(s) Facebook");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncGroup = (token: string, businessId: string | null) => {
    setSyncTarget({ token, businessId: businessId ?? "" });
    setSyncOpen(true);
  };

  const handleUpdateToken = (group: FacebookAccountAPI[]) => {
    setUpdateTokenTargets(group);
  };

  const handleConfirmUpdateToken = async (accessToken: string) => {
    try {
      setIsUpdatingToken(true);
      await Promise.all(updateTokenTargets.map((a) => updateToken(a.id, accessToken)));
      setUpdateTokenTargets([]);
      toast.success("Token atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar token");
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const deleteLabel = deleteTargets[0]?.label ?? "";
  const deleteDescription = deleteTargets.length > 1
    ? `Tem certeza que deseja excluir as ${deleteTargets.length} contas de "${deleteLabel}"? Esta ação não pode ser desfeita.`
    : `Tem certeza que deseja excluir a conta "${deleteLabel}"? Esta ação não pode ser desfeita.`;

  const toggleMetaAccount = async (accountId: number, checked: boolean) => {
    try {
      const token = getCookie("access_token") || "";
      const response = await fetch(`/api/facebook/accounts/${accountId}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: checked }),
      });
      if (!response.ok) throw new Error("Não foi possível salvar a seleção da conta");
      setMetaAccounts((current) => current.map((account) => account.id === accountId ? { ...account, is_active: checked, status: checked ? "active" : "paused" } : account));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar a conta");
    }
  };

  const toggleAllMetaAccounts = async (checked: boolean) => {
    try {
      const token = getCookie("access_token") || "";
      await Promise.all(
        metaAccounts.map((account) => fetch(`/api/facebook/accounts/${account.id}/toggle`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: checked }),
        }))
      );
      setMetaAccounts((current) => current.map((account) => ({ ...account, is_active: checked, status: checked ? "active" : "paused" })));
    } catch {
      toast.error("Erro ao atualizar as contas selecionadas");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <FacebookHeader onAddAccount={openAddModal} />

      {metaConnected && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Contas de Anúncio (Meta)</h2>
              <p className="text-sm text-muted-foreground">
                {metaProfileName ? `Perfil conectado: ${metaProfileName}` : "Perfil conectado"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleAllMetaAccounts(!metaAccounts.every((account) => account.is_active))}
              className="rounded-md border px-3 py-2 text-sm font-medium"
            >
              Ativar todas
            </button>
          </div>

          <p className="mb-3 text-sm text-muted-foreground">
            {metaAccounts.length > 0
              ? `Você possui ${metaAccounts.length} conta(s) de anúncio disponível(s).`
              : metaLoading
                ? "Buscando contas de anúncio..."
                : "Nenhuma conta de anúncios foi encontrada para este perfil."}
          </p>

          {metaAccounts.length > 0 && (
            <div className="space-y-3">
              {metaAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.status || "discovered"}</div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={account.is_active}
                      onChange={(event) => void toggleMetaAccount(account.id, event.target.checked)}
                    />
                    Ativado
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <FacebookTable
        accounts={accounts}
        isLoading={isLoading}
        onDelete={handleDeleteClick}
        onDeleteGroup={handleDeleteGroupClick}
        onDuplicate={openDuplicateModal}
        onSync={handleSyncGroup}
        onUpdateToken={handleUpdateToken}
      />
      <AddAccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAdd={handleAdd}
        onBulkAdd={handleBulkAdd}
        isLoading={isAdding}
        prefillToken={prefillToken}
      />
      <SyncAccountsModal
        open={syncOpen}
        onOpenChange={setSyncOpen}
        onSync={syncAccounts}
        prefillToken={syncTarget.token}
        prefillBusinessId={syncTarget.businessId}
      />
      <UpdateTokenModal
        open={updateTokenTargets.length > 0}
        onOpenChange={(open) => !open && setUpdateTokenTargets([])}
        onUpdate={handleConfirmUpdateToken}
        accountLabel={updateTokenTargets[0]?.label ?? ""}
        isLoading={isUpdatingToken}
      />
      <ConfirmDeleteModal
        open={deleteTargets.length > 0}
        onOpenChange={(open) => !open && setDeleteTargets([])}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Excluir conta Facebook"
        description={deleteDescription}
      />
    </div>
  );
}
