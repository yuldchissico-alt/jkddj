import { useState } from "react";
import { AdminHeader } from "./components/AdminHeader";
import { AdminTabs } from "./components/AdminTabs";
import { CompanyDashboard } from "./components/CompanyDashboard";
import { UsersPanel } from "./components/UsersPanel";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminHeader />
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === "dashboard" && <CompanyDashboard />}
      {activeTab === "users" && <UsersPanel />}
    </div>
  );
}
