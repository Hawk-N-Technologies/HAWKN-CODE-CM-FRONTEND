import { Navigate } from "react-router-dom";
import PageMessage from "../components/PageMessage";
import { homeFor } from "../auth/roles";
import { useAuth } from "../auth/useAuth";

/** "/" sends each user to their own home page (or to login). */
export default function HomeRedirect() {
  const { status, user } = useAuth();
  if (status === "loading") return <PageMessage title="Loading…" />;
  if (status === "authenticated") return <Navigate to={homeFor(user.role)} replace />;
  if (status === "error") return <Navigate to="/status" replace />;
  return <Navigate to="/login" replace />;
}
