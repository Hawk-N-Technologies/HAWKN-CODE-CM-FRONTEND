import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Base authentication guard. Wrap any route block that requires a
 * signed-in user with this; unauthenticated visitors are bounced to
 * /login, with the page they wanted preserved so Login can send them
 * back after a successful sign-in.
 *
 * Frontend-only: this protects the UI, not the data. The backend must
 * independently reject unauthorized requests regardless of what the
 * frontend shows or hides.
 */
function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoutes;