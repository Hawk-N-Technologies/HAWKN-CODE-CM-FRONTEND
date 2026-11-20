import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BriefcaseBusiness, FileText, FolderPlus, Percent, RefreshCw, UserPlus, UsersRound } from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import AttendanceButton from "../../components/common/AttendanceButton";
import PageHeader from "../../components/layout/PageHeader";

/**
 * BDE Dashboard — real numbers:
 * leads vs converted clients, BRDs by status, projects created this month,
 * plus the latest leads and BRD activity.
 */

const BRD_STATUS = [
  { key: "DRAFT", label: "Draft", tone: "neutral", bar: "bg-slate-400" },
  { key: "PENDING_ADMIN_APPROVAL", label: "Waiting for admin", tone: "warning", bar: "bg-amber-500" },
  { key: "ADMIN_REJECTED", label: "Rejected by admin", tone: "danger", bar: "bg-rose-500" },
  { key: "PENDING_CLIENT_APPROVAL", label: "Waiting for client", tone: "info", bar: "bg-blue-500" },
  { key: "CLIENT_REJECTED", label: "Rejected by client", tone: "danger", bar: "bg-rose-400" },
  { key: "APPROVED", label: "Approved", tone: "success", bar: "bg-emerald-500" },
];
const BRD_LABEL = Object.fromEntries(BRD_STATUS.map((item) => [item.key, item]));

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const thisMonth = new Date().toLocaleDateString("en-IN", { month: "long", timeZone: "Asia/Kolkata" });

function Card({ title, description, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    axios
      .get("/api/bd/dashboard", { withCredentials: true })
      .then((response) => {
        if (ignore) return;
        setData(response.data.data);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(error?.response?.data?.message || "Couldn't load the dashboard.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  const live = (value, suffix = "") => (isLoading ? "…" : loadError ? "—" : `${value ?? 0}${suffix}`);
  const clients = data?.clients;
  const leadShare = clients?.total ? Math.round((clients.leads / clients.total) * 100) : 0;
  const maxBrd = Math.max(1, ...BRD_STATUS.map((item) => data?.brds.byStatus[item.key] ?? 0));

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="BUSINESS DEVELOPMENT"
        title="BDE Dashboard"
        description="Your pipeline at a glance: leads, converted clients, BRDs and new projects."
        icon={BriefcaseBusiness}
        actions={<AttendanceButton />}
      />

      {loadError ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ErrorState title="Couldn't load the dashboard" description={loadError} onRetry={reload} />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Open leads" value={live(clients?.leads)} icon={<UserPlus size={18} />} accent="warning" />
            <StatCard label="Converted clients" value={live(clients?.converted)} icon={<UsersRound size={18} />} accent="success" />
            <StatCard label="Conversion rate" value={live(clients?.conversionRate, "%")} icon={<Percent size={18} />} />
            <StatCard
              label={`Projects created in ${thisMonth}`}
              value={live(data?.projects.createdThisMonth)}
              icon={<FolderPlus size={18} />}
              accent="purple"
            />
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card
              title="Leads vs converted clients"
              description={
                clients ? `${clients.newLeadsThisMonth} new ${clients.newLeadsThisMonth === 1 ? "lead" : "leads"} in ${thisMonth}.` : " "
              }
              action={
                <Link to="/bd/clients" className="text-sm font-semibold text-blue-700 hover:underline">
                  Open clients
                </Link>
              }
            >
              {clients && clients.total > 0 ? (
                <>
                  <div className="flex h-4 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${clients.leads} leads, ${clients.converted} converted`}>
                    <div className="h-full bg-amber-500" style={{ width: `${leadShare}%` }} />
                    <div className="h-full bg-emerald-500" style={{ width: `${100 - leadShare}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Leads
                      <span className="font-semibold tabular-nums">{clients.leads}</span>
                    </span>
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Converted
                      <span className="font-semibold tabular-nums">{clients.converted}</span>
                    </span>
                    <span className="text-slate-500">Total {clients.total}</span>
                  </div>
                </>
              ) : (
                <p className="py-4 text-sm text-slate-500">{isLoading ? "Loading…" : "No clients yet."}</p>
              )}

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Latest leads</p>
                {data?.recentLeads.length ? (
                  <ul className="divide-y divide-slate-100">
                    {data.recentLeads.map((lead) => (
                      <li key={lead.uuid} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-800">{lead.name}</span>
                          <span className="block truncate text-xs text-slate-500">{lead.email}</span>
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">{formatDate(lead.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">{isLoading ? "Loading…" : "No open leads."}</p>
                )}
              </div>
            </Card>

            <Card
              title="BRDs by status"
              description={data ? `${data.brds.total} ${data.brds.total === 1 ? "BRD" : "BRDs"} in total.` : " "}
              action={
                <Link to="/bd/brd" className="text-sm font-semibold text-blue-700 hover:underline">
                  Open BRDs
                </Link>
              }
            >
              <ul className="space-y-3">
                {BRD_STATUS.map((item) => {
                  const count = data?.brds.byStatus[item.key] ?? 0;
                  return (
                    <li key={item.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="font-semibold tabular-nums text-slate-900">{isLoading ? "…" : count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${(count / maxBrd) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Latest BRD activity</p>
                {data?.recentBrds.length ? (
                  <ul className="divide-y divide-slate-100">
                    {data.recentBrds.map((brd) => (
                      <li key={brd.uuid} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="min-w-0">
                          <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-800">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{brd.title}</span>
                          </span>
                          <span className="block truncate text-xs text-slate-500">{brd.projectName}</span>
                        </span>
                        <Badge tone={BRD_LABEL[brd.status]?.tone ?? "neutral"}>{BRD_LABEL[brd.status]?.label ?? brd.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">{isLoading ? "Loading…" : "No BRDs yet."}</p>
                )}
              </div>
            </Card>
          </div>

          <Card
            title="Projects"
            action={
              <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
                Refresh
              </Button>
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: `Created in ${thisMonth}`, value: data?.projects.createdThisMonth },
                { label: "Active (not completed)", value: data?.projects.active },
                { label: "All projects", value: data?.projects.total },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{live(item.value)}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
