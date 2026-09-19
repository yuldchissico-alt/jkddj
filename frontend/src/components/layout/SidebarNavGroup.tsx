import type { RemixiconComponentType } from "@remixicon/react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  icon: RemixiconComponentType;
  url: string;
}

interface SidebarNavGroupProps {
  label: string;
  items: NavItem[];
  currentPath: string;
  onNavigate: (url: string) => void;
}

export function SidebarNavGroup({
  label: _label,
  items,
  currentPath,
  onNavigate,
}: SidebarNavGroupProps) {
  return (
    <SidebarGroup className="py-1">
      <SidebarMenu className="gap-0.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={currentPath === item.url}
              onClick={() => onNavigate(item.url)}
              className="cursor-pointer h-9 px-3 gap-3 text-sm font-medium rounded-lg"
            >
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
