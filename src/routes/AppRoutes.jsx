import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import NotFound from "../pages/NotFound";

/**
 * Route tree for the app.
 *
 * Only auth is wired up so far. Once each role's dashboard shell lands
 * (Phase 2), those routes get added here behind <ProtectedRoutes> /
 * <RoleRoute>, and "/" starts redirecting to the signed-in user's
 * dashboard instead of straight to /login.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;