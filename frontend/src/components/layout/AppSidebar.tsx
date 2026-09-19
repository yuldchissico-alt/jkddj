import {
  RiDashboardLine,
  RiMegaphoneLine,
  RiLineChartLine,
  RiGroupLine,
  RiBox1Line,
  RiFilter2Line,
  RiWalletLine,
  RiMetaLine,
  RiRepeatLine,
  RiBankCardLine,
} from "@remixicon/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { SidebarUser } from "./SidebarUser";
import { AiTrainingProfile } from "./AiTrainingProfile";
import { getStoredUser } from "@/services/auth";
import { useAdvancedFeatures } from "@/contexts/AdvancedFeaturesContext";
import type { RemixiconComponentType } from "@remixicon/react";

type UserRole = "owner" | "admin" | "viewer";

interface NavItem {
  title: string;
  icon: RemixiconComponentType;
  url: string;
  roles?: UserRole[]; // if omitted, visible to all
  featureKey?: "stripe_enabled"; // ties to advanced features
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Análise",
    items: [
      { title: "Dashboard", icon: RiDashboardLine, url: "/dashboard" },
      { title: "Campanhas", icon: RiMegaphoneLine, url: "/campaigns" },
      { title: "Assinatura", icon: RiRepeatLine, url: "/subscriptions", featureKey: "stripe_enabled" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { title: "Vendas", icon: RiLineChartLine, url: "/sales" },
      { title: "Clientes", icon: RiGroupLine, url: "/customers" },
    ],
  },
  {
    label: "Produtos",
    items: [
      { title: "Produtos", icon: RiBox1Line, url: "/products", roles: ["owner", "admin", "viewer"] },
      { title: "Funil", icon: RiFilter2Line, url: "/funnel" },
    ],
  },
  {
    label: "Integrações",
    items: [
      { title: "Plataformas", icon: RiWalletLine, url: "/platforms", roles: ["owner", "admin"] },
      { title: "Facebook Ads", icon: RiMetaLine, url: "/facebook-ads", roles: ["owner", "admin"] },
      { title: "Stripe", icon: RiBankCardLine, url: "/stripe", roles: ["owner", "admin"], featureKey: "stripe_enabled" },
    ],
  },
];

function filterNavGroups(
  groups: NavGroup[],
  role: UserRole,
  features: Record<string, boolean>
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.roles && !item.roles.includes(role)) return false;
        if (item.featureKey && !features[item.featureKey]) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const role: UserRole = user?.role ?? "owner";
  const { features } = useAdvancedFeatures();

  const visibleGroups = filterNavGroups(navGroups, role, { ...features });

  return (
    <Sidebar
      variant="sidebar"
      collapsible="none"
      className="h-full border-r-0"
    >
      <SidebarHeader className="px-4 pt-4 pb-3">
        <img
          src="/logo_lomustrack.png"
          alt="LomusTrack"
          className="h-10 w-auto object-contain"
        />
      </SidebarHeader>
      <SidebarContent className="px-3 gap-0">
        {visibleGroups.map((group) => (
          <SidebarNavGroup
            key={group.label}
            label={group.label}
            items={group.items}
            currentPath={location.pathname}
            onNavigate={(url: string) => navigate(url)}
          />
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <AiTrainingProfile />
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
