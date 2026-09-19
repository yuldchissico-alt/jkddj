import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { getStoredUser, logout } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { 
  RiLogoutBoxLine, 
  RiDashboardLine, 
  RiTeamLine,
  RiSettings4Line,
  RiShieldStarLine,
  RiArrowLeftLine,
  RiGeminiLine,
} from "@remixicon/react";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  label: string;
  icon: typeof RiDashboardLine;
  path: string;
  disabled?: boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", icon: RiDashboardLine, path: "/admin/dashboard" },
  { label: "Usuários", icon: RiTeamLine, path: "/admin/users" },
  { label: "Gemini API", icon: RiGeminiLine, path: "/admin/gemini" },
  { label: "Configurações", icon: RiSettings4Line, path: "/admin/settings" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  useEffect(() => {
    // Check if user is logged in and has admin/owner role
    if (!user) {
      navigate("/admin-login");
      return;
    }

    if (user.role !== "owner" && user.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  const handleBackToApp = () => {
    navigate("/dashboard");
  };

  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
              <RiShieldStarLine className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Nexuscale</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => !item.disabled && navigate(item.path)}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand text-white"
                    : "text-foreground hover:bg-muted",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleBackToApp}
          >
            <RiArrowLeftLine className="h-4 w-4" />
            Voltar ao App
          </Button>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand font-semibold text-sm">
              {user.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <RiLogoutBoxLine className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
