import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  ChevronRight,
  PanelLeftClose,
  LayoutDashboard,
  Circle,
} from "lucide-react";
import logo from "../../assets/hawkn-logo-2.png";

function Sidebar({ sections = [], isOpen = false, onClose = () => {} }) {
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[3px]",
          "transition-opacity duration-300 lg:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar
          Mobile: fixed drawer
          Desktop: sticky sidebar in normal layout flow */}
      <aside
        id="app-sidebar"
        aria-label="Application sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[272px]",
          "flex-col overflow-hidden",
          "border-r border-white/[0.07]",
          "bg-cm-navy-950 text-white",
          "shadow-[12px_0_48px_rgba(2,6,23,0.12)]",
          "transition-transform duration-300 ease-out",
          "lg:sticky lg:top-0 lg:z-40 lg:shrink-0",
          "lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Ambient accent */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/[0.08] blur-3xl"
          aria-hidden="true"
        />

        {/* Brand */}
        <div className="relative flex h-[84px] shrink-0 items-center gap-3 border-b border-white/[0.09] px-5">
          <div className="flex h-12 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] px-3">
            <img
              src={logo}
              alt="Hawk'N Technologies"
              className="max-h-10 w-auto max-w-full object-contain"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
          >
            <PanelLeftClose size={19} strokeWidth={1.8} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Primary navigation"
          className="sidebar-scroll relative flex-1 space-y-7 overflow-y-auto px-3 py-6"
        >
          {sections.map((section, sectionIndex) => (
            <div
              key={section.title ?? section.items?.[0]?.path ?? sectionIndex}
              className="space-y-2"
            >
              {section.title && (
                <div className="flex items-center gap-3 px-3 pb-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/40">
                    {section.title}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.08]" />
                </div>
              )}

              <ul className="space-y-1">
                {(section.items ?? []).map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/admin"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          "group relative flex min-h-[44px] items-center gap-3",
                          "overflow-hidden rounded-xl border px-3",
                          "text-[13px] font-medium",
                          "transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2",
                          "focus-visible:ring-inset focus-visible:ring-blue-400",
                          isActive
                            ? [
                                "border-blue-400/20",
                                "bg-gradient-to-r from-blue-500/[0.19] to-blue-400/[0.06]",
                                "text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                              ].join(" ")
                            : [
                                "border-transparent text-white/65",
                                "hover:border-white/[0.07]",
                                "hover:bg-white/[0.055]",
                                "hover:text-white",
                              ].join(" "),
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-blue-400"
                              aria-hidden="true"
                            />
                          )}

                          {/* Icon */}
                          <span
                            className={[
                              "relative flex h-9 w-9 shrink-0 items-center justify-center",
                              "rounded-lg transition-all duration-200",
                              isActive
                                ? "bg-blue-400/15 text-blue-200"
                                : "text-white/55 group-hover:bg-white/[0.07] group-hover:text-white",
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            {item.icon ?? (
                              <Circle size={16} strokeWidth={1.7} />
                            )}
                          </span>

                          {/* Label */}
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>

                          {/* Active indicator */}
                          <span
                            className={[
                              "flex h-6 w-6 shrink-0 items-center justify-center",
                              "rounded-md transition-all duration-200",
                              isActive
                                ? "text-blue-200"
                                : "text-transparent group-hover:translate-x-0.5 group-hover:text-white/40",
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            <ChevronRight size={15} strokeWidth={1.8} />
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Workspace footer */}
        <div className="relative shrink-0 border-t border-white/[0.09] p-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/10 text-blue-200">
              <LayoutDashboard size={17} strokeWidth={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white/90">
                Hawk'N Workspace
              </p>
              <p className="mt-0.5 text-[10px] tracking-wide text-white/40">
                MANAGEMENT PORTAL
              </p>
            </div>

            <span
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]"
              title="Workspace active"
              aria-label="Workspace active"
            />
          </div>
        </div>
      </aside>

      {/* Custom scrollbar */}
      <style>{`
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.14) transparent;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.14);
          border-radius: 999px;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.26);
        }

        @media (prefers-reduced-motion: reduce) {
          #app-sidebar {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}

export default Sidebar;
