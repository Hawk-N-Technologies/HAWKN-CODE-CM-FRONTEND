import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_LABEL } from "../../constants/roles";
import { showToast } from "../common/Toast";

/**
 * Top navbar shared by every role's DashboardLayout: search, notification
 * bell, and the user profile menu (with Logout). Sidebar visibility on
 * mobile is controlled by the parent layout via `onMenuClick`.
 *
 * `notificationCount` is a prop rather than pulled from context here —
 * NotificationContext/NotificationBell wiring is a later phase; this
 * keeps the navbar usable standalone in the meantime.
 */
function TopNavbar({ onMenuClick = () => {}, notificationCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    showToast.info("You've been signed out.");
    navigate("/login", { replace: true });
  };

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-cm-border bg-cm-card px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-cm-md text-cm-text-muted hover:bg-cm-bg lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Search */}
      <div className="relative hidden max-w-md flex-1 sm:block">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          type="search"
          placeholder="Search…"
          aria-label="Search"
          className="h-9 w-full rounded-cm-md border border-cm-border bg-cm-bg pl-9 pr-3 text-sm text-cm-text placeholder:text-cm-text-muted focus:outline-none focus:ring-2 focus:ring-cm-blue-500"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-cm-md text-cm-text-muted hover:bg-cm-bg"
          aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ""}`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cm-danger-600 px-1 text-[10px] font-semibold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-cm-md py-1 pl-1 pr-2 hover:bg-cm-bg"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cm-blue-100 text-xs font-semibold text-cm-blue-700">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-cm-text">
                {user?.name ?? "Guest"}
              </span>
              <span className="block text-xs leading-tight text-cm-text-muted">
                {user?.role ? ROLE_LABEL[user.role] : ""}
              </span>
            </span>
            <svg className="h-4 w-4 text-cm-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-48 rounded-cm-md border border-cm-border bg-cm-card py-1 shadow-lg"
            >
              <div className="border-b border-cm-border px-3 py-2 sm:hidden">
                <p className="text-sm font-medium text-cm-text">{user?.name ?? "Guest"}</p>
                <p className="text-xs text-cm-text-muted">{user?.role ? ROLE_LABEL[user.role] : ""}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-cm-danger-600 hover:bg-cm-danger-100"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m16 17 5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;