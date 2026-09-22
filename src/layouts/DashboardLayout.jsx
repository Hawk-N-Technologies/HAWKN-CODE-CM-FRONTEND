import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import TopNavbar from "../components/layout/TopNavbar";

/**
 * Shared shell for every internal (non-client) dashboard: fixed sidebar +
 * top navbar + scrollable content area rendering the matched child route.
 *
 * Each role wraps its own routes with this layout and passes its own
 * nav `sections` — the layout itself has no role-specific knowledge.
 * Usage (in routeConfig / AppRoutes once those land):
 *
 *   <Route element={<DashboardLayout sections={adminNavSections} />}>
 *     <Route path="/admin/dashboard" element={<AdminDashboard />} />
 *     ...
 *   </Route>
 *
 * `notificationCount` is passed through to TopNavbar until
 * NotificationContext is wired up.
 */
function DashboardLayout({ sections = [], notificationCount = 0 }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cm-bg">
      <Sidebar
        sections={sections}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onMenuClick={() => setIsSidebarOpen(true)}
          notificationCount={notificationCount}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;