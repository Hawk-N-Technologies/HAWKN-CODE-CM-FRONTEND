import StatCard from "../../components/cards/StatCard";
import { MOCK_EMPLOYEES } from "../../data/employees";

/**
 * Admin overview dashboard.
 *
 * Total Employees is real (src/data/employees.js). The rest are still
 * static placeholders — src/data/clients.js and projects.js are still
 * empty stubs (Client Management / Project Management haven't been
 * built yet, and belong to BD/Project Lead, not Admin). Swap those
 * once those modules land; nothing else on this page should need to
 * change.
 */
const ICONS = {
  employees: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6M16 11a3 3 0 1 0 0-6M17 21c0-2.2-.9-4-2.3-5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M9 3v4H5M9 3l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 3-3.87" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  approvals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  deadline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const kpis = [
  { label: "Total Employees", value: String(MOCK_EMPLOYEES.length), icon: ICONS.employees, accent: "blue" },
  { label: "Active Projects", value: "0", icon: ICONS.projects, accent: "success" },
  { label: "Active Clients", value: "0", icon: ICONS.clients, accent: "purple" },
  { label: "Pending Approvals", value: "0", icon: ICONS.approvals, accent: "warning" },
  { label: "Projects Near Deadline", value: "0", icon: ICONS.deadline, accent: "warning" },
];

const pendingApprovals = [];
const activityFeed = [];

function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Welcome back, Admin</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Here's what's happening across the company today.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Overview panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-cm-text">Pending BRD Approvals</h2>
          {pendingApprovals.length === 0 ? (
            <p className="mt-4 text-sm text-cm-text-muted">
              Nothing waiting on your approval right now.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pendingApprovals.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-cm-text">{item.name}</span>
                  <span className="text-cm-text-muted">{item.date}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-cm-text">Recent Activity</h2>
          {activityFeed.length === 0 ? (
            <p className="mt-4 text-sm text-cm-text-muted">No recent activity to show yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activityFeed.map((item) => (
                <li key={item.id} className="text-sm text-cm-text">
                  {item.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;