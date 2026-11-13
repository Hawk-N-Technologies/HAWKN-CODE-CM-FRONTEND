import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROLE_LABEL } from "../auth/roles";
import { useAuth } from "../auth/useAuth";

export default function AppHeader() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleLogout = async () => {
    setLeaving(true);
    try {
      await logout();
    } finally {
      setLeaving(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="bg-cm-navy-950 text-cm-text-inverse">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span>AMPL Packing</span>
        </Link>

        {status === "authenticated" ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:inline">
              {user.display_name}
              <span className="ml-2 rounded-full bg-cm-navy-800 px-2 py-0.5 text-xs">
                {ROLE_LABEL[user.role] || user.role}
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={leaving}
              className="h-10 rounded-cm-md border border-cm-navy-700 px-3 text-sm font-medium hover:bg-cm-navy-800 disabled:opacity-60"
            >
              {leaving ? "Signing out…" : "Sign out"}
            </button>
          </div>
        ) : (
          <span className="text-xs text-cm-blue-100/80">Hawk N Technologies</span>
        )}
      </div>
    </header>
  );
}
