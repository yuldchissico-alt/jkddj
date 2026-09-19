import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileAIChat } from "./MobileAIChat";
import { NotificationBell } from "@/components/NotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardLayout() {
  const isMobile = useIsMobile();
  // On mobile, auto-open AI chat on first load
  const [aiOpen, setAiOpen] = useState(isMobile);

  if (isMobile) {
    return (
      <>
        <div className="flex flex-col min-h-[100dvh]">
          {/* Header fixo no topo no mobile */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <img
              src="/logo_lomustrack.png"
              alt="LomusTrack"
              className="h-7 w-auto object-contain"
            />
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto pb-20">
            <div className="mx-auto w-full min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileBottomNav onOpenAI={() => setAiOpen(true)} />
        <MobileAIChat isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      </>
    );
  }

  return (
    <>
      <SidebarProvider
        style={{ "--sidebar-width": "14.5rem" } as React.CSSProperties}
        className="h-screen"
      >
        <div className="flex flex-1 h-full min-w-0">
          <AppSidebar />
          <SidebarInset className="overflow-y-auto overflow-x-hidden flex-1 min-w-0">
            {/* Barra fixa no topo com o sino de notificações */}
            <header className="sticky top-0 z-30 flex h-12 items-center justify-end px-6 border-b border-border/40 bg-background/80 backdrop-blur-md">
              <NotificationBell />
            </header>
            <div
              className="mx-auto w-full min-h-full bg-background"
              style={{ maxWidth: "min(1600px, 100%)" }}
            >
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}
