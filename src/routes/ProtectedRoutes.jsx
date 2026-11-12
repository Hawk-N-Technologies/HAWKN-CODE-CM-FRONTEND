import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoutes() {
  const { isAuthenticated, isAuthenticating, user } = useContext(AuthContext);

  console.log("ProtectedRoutes:", {
    user,
    isAuthenticated,
    isAuthenticating,
  });

  if (isAuthenticating) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoutes;
