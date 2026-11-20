import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, MessageSquareWarning, RefreshCw, UserCheck } from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import StatCard from "../../components/cards/StatCard";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import { CLIENT_APPROVAL_TONE, formatDateTime, matches } from "../../components/testing/testingUtils";
import { getTestPhases, getTestingError } from "../../services/testingService";

/**
 * Tester → Client Testing (read-only).
 * Phases that need the client's approval, and what the client said.
 * When the client asks for changes, re-test the phase in Phase Testing
 * once it's fixed — it goes back to the client automatically.
 */

const LABEL = {
  null: "Waiting for your sign-off",
  Pending: "With client",
  Approved: "Approved",
  Rejected: "Rejected",
  "Changes Requested": "Changes requested",
};

export default function ClientTesting() {
  const [phases, setPhases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let ignore = false;

    getTestPhases()
      .then((list) => {
        if (ignore) return;
        setPhases(list.filter((phase) => phase.needsClientApproval));
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getTestingError(error, "Couldn't load client approvals."));
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

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return phases
      .filter((phase) => matches(query, phase.name, phase.project.name, phase.clientApprovalStatus))
      .map((phase) => ({ ...phase, id: phase.uuid }));
  }, [phases, search]);

  const countOf = (status) => phases.filter((phase) => phase.clientApprovalStatus === status).length;
  const live = (value) => (isLoading ? "…" : loadError ? "—" : String(value));

  const columns = [
    {
      key: "phase",
      header: "Phase",
      render: (row) => (
        <div className="min-w-[170px]">
          <div className="font-semibold text-slate-800">{row.name}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {row.project.name} · {row.moduleName}
          </div>
        </div>
      ),
    },
    {
      key: "approval",
      header: "Client approval",
      render: (row) =>
        row.clientApprovalStatus ? (
          <Badge tone={CLIENT_APPROVAL_TONE[row.clientApprovalStatus]}>{LABEL[row.clientApprovalStatus]}</Badge>
        ) : (
          <span className="text-xs font-medium text-slate-500">{LABEL.null}</span>
        ),
    },
    {
      key: "note",
      header: "Client's note",
      render: (row) =>
        row.clientNote ? (
          <p className="max-w-[320px] whitespace-pre-line text-sm text-slate-700">{row.clientNote}</p>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "answered",
      header: "Answered",
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-600">{formatDateTime(row.clientRespondedAt)}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="TESTING"
        title="Client Testing"
        description="Phases the client has to approve, and what they said. If they ask for changes, re-test the phase in Phase Testing once it's fixed."
        icon={UserCheck}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="With client" value={live(countOf("Pending"))} icon={<Clock3 size={18} />} />
        <StatCard label="Approved" value={live(countOf("Approved"))} icon={<CheckCircle2 size={18} />} accent="success" />
        <StatCard
          label="Changes requested"
          value={live(countOf("Changes Requested"))}
          icon={<MessageSquareWarning size={18} />}
          accent="warning"
        />
        <StatCard label="Rejected" value={live(countOf("Rejected"))} icon={<MessageSquareWarning size={18} />} accent="purple" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Client approvals</h2>
            <p className="text-sm text-slate-500">Only phases the project lead marked “Needs client approval”.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        <div className="mb-4">
          <TableSearch value={search} onChange={setSearch} placeholder="Search phase, project or status…" />
        </div>

        {loadError ? (
          <ErrorState title="Couldn't load client approvals" description={loadError} onRetry={reload} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            isLoading={isLoading}
            emptyMessage={
              phases.length === 0
                ? "No phases need client approval yet."
                : "No phases match your search."
            }
          />
        )}
      </section>
    </div>
  );
}
