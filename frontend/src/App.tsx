import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppGuard } from "@/components/layout/AppGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import SetupPage from "@/pages/setup";
import LoginPage from "@/pages/login";
import AdminLoginPage from "@/pages/admin-login";
import DashboardPage from "@/pages/dashboard";
import CampaignsPage from "@/pages/campaigns";
import SalesPage from "@/pages/sales";
import CustomersPage from "@/pages/customers";
import ProductsPage from "@/pages/products";
import FunnelPage from "@/pages/funnel";
import PlatformsPage from "@/pages/platforms";
import FacebookAdsPage from "@/pages/facebook-ads";
import ProfilePage from "@/pages/profile";
import CampaignsCreatePage from "@/pages/campaigns-create";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminUsersPage from "@/pages/admin-users";
import AdminGeminiPage from "@/pages/admin-gemini";
import AdminSettingsPage from "@/pages/admin-settings";
import StripePage from "@/pages/stripe";
import SubscriptionsPage from "@/pages/subscriptions";
import { AIChatProvider } from "@/components/ai-chat/AIChatProvider";
import { Toaster } from "@/components/ui/sonner";
import { PageDataProvider } from "@/contexts/PageDataContext";
import { AdvancedFeaturesProvider } from "@/contexts/AdvancedFeaturesContext";
import { ValueDisplayProvider } from "@/contexts/ValueDisplayContext";
import { MockModeBanner } from "@/components/MockModeBanner";

import { PublishProgressProvider } from "@/contexts/PublishProgressContext";

export default function App() {
  return (
    <PageDataProvider>
    <AdvancedFeaturesProvider>
    <ValueDisplayProvider>
    <PublishProgressProvider>
    <BrowserRouter>
      <TooltipProvider>
        <AppGuard>
          <Routes>
            {/* Public routes (outside AppGuard protection) */}
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />

            {/* Main app routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/create" element={<CampaignsCreatePage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/funnel" element={<FunnelPage />} />
              <Route path="/platforms" element={<PlatformsPage />} />
              <Route path="/facebook-ads" element={<FacebookAdsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/stripe" element={<StripePage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
            </Route>

            {/* Admin panel routes (separate layout) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/gemini" element={<AdminGeminiPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppGuard>
      </TooltipProvider>
      <Toaster richColors position="top-right" />
      <AIChatProvider />
      <MockModeBanner />
    </BrowserRouter>
    </PublishProgressProvider>
    </ValueDisplayProvider>
    </AdvancedFeaturesProvider>
    </PageDataProvider>
  );
}
