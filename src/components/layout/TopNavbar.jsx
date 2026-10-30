import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_LABEL } from "../../constants/roles";
import { showToast } from "../common/Toast";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  UserRound,
  Menu,
  Command,
} from "lucide-react";

function TopNavbar({ onMenuClick = () => {}, notificationCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeys = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        searchRef.current?.blur();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeys);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeys);
    };
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);

    try {
      await logout();
      showToast.info("You've been signed out.");
      navigate("/login", { replace: true });
    } catch {
      showToast.error("Unable to sign out. Please try again.");
    }
  };

  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Guest";

  const initials =
    fullName === "Guest"
      ? "?"
      : fullName
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

  const roleName = String(user?.role?.name ?? user?.role ?? "").toLowerCase();

  const roleLabel =
    ROLE_LABEL[user?.role?.name] ?? ROLE_LABEL[roleName] ?? "Employee";

  const notificationPath = {
    admin: "/admin/notifications",
    hr: "/hr/notifications",
    bde: "/bd/notifications",
  }[roleName];

  const unreadCount = Math.max(0, Number(notificationCount) || 0);

  return (
    <header className="sticky top-0 z-40 h-[74px] shrink-0 border-b border-slate-200/70 bg-white">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* LEFT SECTION */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-cm-navy-950 lg:hidden"
          >
            <Menu size={21} strokeWidth={1.8} />
          </button>

          {/* Search */}
          <div className="group relative w-full max-w-[440px]">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cm-navy-950"
            />

            <input
              ref={searchRef}
              type="search"
              placeholder="Search anything..."
              aria-label="Search dashboard"
              className="h-[42px] w-full rounded-xl border border-transparent bg-[#f4f6f9] pl-10 pr-20 text-[13px] font-medium text-slate-700 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 hover:bg-[#f0f3f7] focus:border-slate-200 focus:bg-white focus:ring-[3px] focus:ring-cm-navy-950/5"
            />

            <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-400 shadow-sm">
              <Command size={11} />K
            </span>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          {/* Notifications */}
          {notificationPath && (
            <button
              type="button"
              onClick={() => navigate(notificationPath)}
              aria-label={`Notifications${
                unreadCount > 0 ? `, ${unreadCount} unread` : ""
              }`}
              title="Notifications"
              className="group relative grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-cm-navy-950"
            >
              <Bell size={20} strokeWidth={1.8} />

              {unreadCount > 0 && (
                <>
                  <span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                  <span className="absolute -right-2 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-cm-navy-950 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Divider */}
          <div className="h-9 w-px bg-slate-200" />

          {/* Profile */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-controls="profile-menu"
              className={`group flex items-center gap-3 rounded-xl py-1.5 pl-1.5 pr-2 transition-all ${
                isMenuOpen ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              {/* Avatar */}
              <span className="relative grid h-[39px] w-[39px] shrink-0 place-items-center rounded-xl bg-cm-navy-950 text-[12px] font-bold tracking-wide text-white shadow-sm">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </span>

              {/* Name */}
              <span className="hidden text-left sm:block">
                <span className="block max-w-[140px] truncate text-[12px] font-bold leading-5 text-slate-800">
                  {fullName}
                </span>
                <span className="block text-[10px] font-medium text-slate-400">
                  {roleLabel}
                </span>
              </span>

              <ChevronDown
                size={15}
                className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {isMenuOpen && (
              <div
                id="profile-menu"
                role="menu"
                className="absolute right-0 top-[calc(100%+13px)] z-50 w-[265px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.13)]"
              >
                {/* Profile Details */}
                <div className="bg-[#f7f9fc] p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cm-navy-950 text-xs font-bold text-white">
                      {initials}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-slate-800">
                        {fullName}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <div className="px-3 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[1.3px] text-slate-400">
                    Account
                  </div>

                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500">
                    <UserRound size={16} />
                    <span className="text-xs font-medium text-slate-600">
                      {fullName}
                    </span>
                  </div>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-medium tracking-wide text-slate-400">
                    HAWK'N TECHNOLOGIES
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
