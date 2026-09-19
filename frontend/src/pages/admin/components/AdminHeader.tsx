import { RiShieldStarLine } from "@remixicon/react";

export function AdminHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
          <RiShieldStarLine className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Administração</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie configurações e usuários do sistema
          </p>
        </div>
      </div>
    </div>
  );
}
