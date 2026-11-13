import { NavLink, Outlet } from "react-router-dom";

const NAV = [
  { to: "/manage", label: "Home", end: true },
  { to: "/manage/skus", label: "SKUs & UIDs" },
  { to: "/manage/batches", label: "UID batches" },
  { to: "/manage/configurations", label: "Box configurations" },
  { to: "/manage/sections", label: "Packing sections" },
  { to: "/manage/users", label: "Users" },
  { to: "/op", label: "Packing screen" },
  { to: "/verify", label: "Verify a box" },
];

/** Admin area: side menu on desktop, scrollable tab row on phones. */
export default function AdminLayout() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row">
      <nav aria-label="Admin" className="border-b border-cm-border bg-cm-card md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible md:p-3">
          {NAV.map((item) => (
            <li key={item.to} className="shrink-0">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-cm-md px-3 py-2 text-sm font-medium whitespace-nowrap ${
                    isActive ? "bg-cm-blue-50 text-cm-blue-700" : "text-cm-navy-950 hover:bg-cm-bg"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
