import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import NotFound from "../pages/NotFound";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoutes from "./ProtectedRoutes";
import RoleRoute from "./RoleRoute";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminCompanyProfile from "../pages/admin/CompanyProfile";
import AdminCompanyPolicies from "../pages/admin/CompanyPolicies";
import AdminPeopleManagement from "../pages/admin/PeopleManagement";
import AdminSOPManagement from "../pages/admin/SOPManagement";
import AdminHRMS from "../pages/admin/HRMS";
import AdminClientManagement from "../pages/admin/ClientManagement";
import AdminProjectManagement from "../pages/admin/ProjectManagement";
import AdminOperations from "../pages/admin/Operations";
import AdminDeploymentPlanning from "../pages/admin/DeploymentPlanning";
import AdminDevelopmentMonitoring from "../pages/admin/DevelopmentMonitoring";
import AdminDeliveryHandover from "../pages/admin/DeliveryHandover";
import AdminNotifications from "../pages/admin/Notifications";

import BDDashboard from "../pages/bd/Dashboard";
import BDClient from "../pages/bd/Client";
import BDCreateClient from "../pages/bd/CreateClient";
import BDClientDetails from "../pages/bd/ClientDetails";

import { ADMIN_NAV_SECTIONS, BD_NAV_SECTIONS } from "./routeConfig";
import { ROLES, ROLE_DASHBOARD_PATH } from "../constants/roles";
import { useAuth } from "../hooks/useAuth";

/**
 * "/" sends a signed-in user to their own dashboard, and an anonymous
 * visitor to /login.
 */
function RootRedirect() {
  const { isAuthenticated, role } = useAuth();
  const target = isAuthenticated
    ? (ROLE_DASHBOARD_PATH[role] ?? "/login")
    : "/login";

  return <Navigate to={target} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoutes />}>
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<DashboardLayout sections={ADMIN_NAV_SECTIONS} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route
              path="/admin/company-profile"
              element={<AdminCompanyProfile />}
            />
            <Route
              path="/admin/company-policies"
              element={<AdminCompanyPolicies />}
            />
            <Route
              path="/admin/people-management"
              element={<AdminPeopleManagement />}
            />
            <Route
              path="/admin/sop-management"
              element={<AdminSOPManagement />}
            />
            <Route path="/admin/hrms" element={<AdminHRMS />} />
            <Route
              path="/admin/client-management"
              element={<AdminClientManagement />}
            />
            <Route
              path="/admin/project-management"
              element={<AdminProjectManagement />}
            />
            <Route path="/admin/operations" element={<AdminOperations />} />
            <Route
              path="/admin/deployment-planning"
              element={<AdminDeploymentPlanning />}
            />
            <Route
              path="/admin/development-monitoring"
              element={<AdminDevelopmentMonitoring />}
            />
            <Route
              path="/admin/delivery-handover"
              element={<AdminDeliveryHandover />}
            />
            <Route
              path="/admin/notifications"
              element={<AdminNotifications />}
            />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLES.BD]} />}>
          <Route element={<DashboardLayout sections={BD_NAV_SECTIONS} />}>
            <Route path="/bd/dashboard" element={<BDDashboard />} />
            <Route path="/bd/clients" element={<BDClient />} />
            <Route path="/bd/clients/new" element={<BDCreateClient />} />
            <Route path="/bd/clients/:clientId" element={<BDClientDetails />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
