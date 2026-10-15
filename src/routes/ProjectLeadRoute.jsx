import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import axios from "axios";
import { ROLE_DASHBOARD_PATH } from "../constants/roles";

function ProjectLeadRoute() {
  const { role, isAuthenticating } = useAuth();
  const [hasAccess, setHasAccess] = useState(null);

  useEffect(() => {
    let cancelled = false;

    axios
      .get("/api/auth/mee", {
        withCredentials: true,
      })
      .then((res) => {
        if (!cancelled) {
          setHasAccess(res.data.data.allowed === true);
        }
      })
      .catch(() => {
        if (!cancelled) setHasAccess(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isAuthenticating || hasAccess === null) return null;

  if (!hasAccess) {
    return <Navigate to={ROLE_DASHBOARD_PATH[role] ?? "/login"} replace />;
  }

  return <Outlet />;
}

export default ProjectLeadRoute;
