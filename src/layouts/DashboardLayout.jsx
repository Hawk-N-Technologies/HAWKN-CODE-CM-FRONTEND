import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/layout/Sidebar";
import TopNavbar from "../components/layout/TopNavbar";
import {
  NotificationProvider,
  useNotifications,
} from "../context/NotificationContext";

function DashboardLayoutContent({ sections }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-cm-bg">
      <Sidebar
        sections={sections}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onMenuClick={() => setIsSidebarOpen(true)}
          notificationCount={unreadCount}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DashboardLayout({ sections = [] }) {
  const { role } = useAuth();

  return (
    <NotificationProvider
  enabled={["admin", "hr", "bde"].includes(
    String(role || "").toLowerCase(),
  )}
>
      <DashboardLayoutContent sections={sections} />
    </NotificationProvider>
  );
}

export default DashboardLayout;