import { NavLink } from "react-router-dom";
import logo from "../../assets/hawkn-logo-2.png";

function Sidebar({ sections = [], isOpen = false, onClose = () => {} }) {
  return (
    <>
      {/* Mobile scrim */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={[
          // Pin to viewport, fixed height = full screen
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col",
          "bg-cm-navy-950 text-cm-text-inverse",
          "transition-transform duration-200 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo — fixed at top, never scrolls */}
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/10 px-5">
          <img
            src={logo}
            alt="Hawk'N Technologies"
            className="h-14 w-auto rounded bg-white/5 p-1"
          />
        </div>

        {/* Nav — the ONLY part that scrolls, with its own scrollbar */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.title ?? section.items[0]?.path}>
              {section.title && (
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-cm-text-inverse/40">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 rounded-cm-md px-3 py-2 text-sm font-medium",
                          "transition-colors duration-150",
                          isActive
                            ? "bg-[#000052] text-white"
                            : "text-cm-text-inverse/70 hover:bg-white/5 hover:text-white",
                        ].join(" ")
                      }
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center"
                        aria-hidden="true"
                      >
                        {item.icon ?? (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
