import { RiDashboardLine, RiTeamLine, RiSettings4Line } from "@remixicon/react";
import { cn } from "@/lib/utils";

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: RiDashboardLine },
  { id: "users", label: "Usuários", icon: RiTeamLine },
  { id: "settings", label: "Configurações", icon: RiSettings4Line, disabled: true },
];

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="border-b border-border">
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                "border-b-2",
                isActive
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground",
                isDisabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
