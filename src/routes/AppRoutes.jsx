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
import { ADMIN_NAV_SECTIONS } from "./routeConfig";
import { ROLES, ROLE_DASHBOARD_PATH } from "../constants/roles";
import { useAuth } from "../hooks/useAuth";

/**
 * "/" sends a signed-in user to their own dashboard, and an anonymous
 * visitor to /login — never a bare shell with nothing on it.
 */
function RootRedirect() {
  const { isAuthenticated, role } = useAuth();
  const target = isAuthenticated ? ROLE_DASHBOARD_PATH[role] ?? "/login" : "/login";
  return <Navigate to={target} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      {/* Every route below requires sign-in, then the right role. */}
      <Route element={<ProtectedRoutes />}>
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<DashboardLayout sections={ADMIN_NAV_SECTIONS} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/company-profile" element={<AdminCompanyProfile />} />
            <Route path="/admin/company-policies" element={<AdminCompanyPolicies />} />
            <Route path="/admin/people-management" element={<AdminPeopleManagement />} />
            <Route path="/admin/sop-management" element={<AdminSOPManagement />} />
            {/* That's every Admin page in the current scaffold — Phase 2
                for Admin is complete. Other roles (HR, BD, Project Lead,
                Developer, Tester, Client) haven't been started yet. */}
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;