import { useEffect, useState } from "react";
import StatCard from "../../components/cards/StatCard";
import * as clientService from "../../services/clientService";

/**
 * BD overview dashboard. Client counts are real (fetched via
 * clientService). Project/BRD KPIs are static placeholders until
 * Project Management and BRD Upload are built.
 */
const ICONS = {
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 3-3.87" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  lead: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M9 3v4H5M9 3l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  brd: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 3v5a2 2 0 0 0 2 2h5M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function Dashboard() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    clientService
      .getClients()
      .then(setClients)
      .finally(() => setIsLoading(false));
  }, []);

  const totalClients = clients.length;
  const totalLeads = clients.filter((c) => c.status === "Lead").length;

  const kpis = [
    { label: "Total Clients", value: isLoading ? "…" : String(totalClients), icon: ICONS.clients, accent: "blue" },
    { label: "Open Leads", value: isLoading ? "…" : String(totalLeads), icon: ICONS.lead, accent: "warning" },
    { label: "Active Projects", value: "0", icon: ICONS.projects, accent: "success" },
    { label: "Pending BRDs", value: "0", icon: ICONS.brd, accent: "warning" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Welcome back</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Here's your business development overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;