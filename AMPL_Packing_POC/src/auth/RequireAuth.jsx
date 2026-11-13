import { Navigate, useLocation } from "react-router-dom";
import PageMessage from "../components/PageMessage";
import { homeFor } from "./roles";
import { useAuth } from "./useAuth";

/**
 * Shows `children` only to a logged-in user whose role is in `roles`.
 * Others go to /login, or to their own home page.
 */
export default function RequireAuth({ roles, children }) {
  const { status, user, error, refresh } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <PageMessage title="Loading…" />;
  }
  if (status === "error") {
    return (
      <PageMessage title="Cannot reach the server" tone="error">
        <p>{error?.message}</p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 h-12 rounded-cm-lg bg-cm-blue-600 px-6 font-semibold text-white hover:bg-cm-blue-700"
        >
          Try again
        </button>
      </PageMessage>
    );
  }
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return children;
}
