import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLE_DASHBOARD_PATH } from "../constants/roles";

/**
 * Role-based authorization guard, nested inside <ProtectedRoutes> so a
 * user is already known to be signed in by the time this runs.
 *
 * If their role isn't in `allowedRoles`, send them to their OWN
 * dashboard rather than an error page — avoids leaking which routes
 * exist for other roles, and never dead-ends the user.
 *
 * Usage: <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
 */
function RoleRoute({ allowedRoles = [] }) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_DASHBOARD_PATH[role] ?? "/login"} replace />;
  }

  return <Outlet />;
}

export default RoleRoute;