import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Layers3, RefreshCw, UserCheck, XCircle } from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import ErrorState from "../../components/common/ErrorState";
import { showToast } from "../../components/common/Toast";
import StatCard from "../../components/cards/StatCard";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import ResultModal from "../../components/testing/ResultModal";
import {
  CLIENT_APPROVAL_TONE,
  RESULT_TONE,
  formatDateTime,
  matches,
} from "../../components/testing/testingUtils";
import { getTestPhases, getTestingError, signOffPhase } from "../../services/testingService";

/**
 * Tester → Phase Testing.
 * Sign off every phase of your projects as Passed or Failed. Phases the lead
 * marked "Needs client approval" go to the client once you pass them.
 */

const FILTERS = ["All", "Pending", "Passed", "Failed"];

export default function PhaseTesting() {
  const [phases, setPhases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("all");
  const [filter, setFilter] = useState("All");
  const [signing, setSigning] = useState(null);

  useEffect(() => {
    let ignore = false;

    getTestPhases()
      .then((list) => {
        if (ignore) return;
        setPhases(list);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getTestingError(error, "Couldn't load phases."));
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

  const projectOptions = useMemo(() => {
    const seen = new Map(phases.map((phase) => [phase.project.uuid, phase.project.name]));
    return [{ value: "all", label: "All projects" }, ...[...seen].map(([value, label]) => ({ value, label }))];
  }, [phases]);

  const inProject = useMemo(
    () => phases.filter((phase) => !project || project === "all" || phase.project.uuid === project),
    [phases, project],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return inProject
      .filter((phase) => filter === "All" || phase.testStatus === filter)
      .filter((phase) => matches(query, phase.name, phase.moduleName, phase.project.name))
      .map((phase) => ({ ...phase, id: phase.uuid }));
  }, [inProject, search, filter]);

  const countOf = (status) => inProject.filter((phase) => phase.testStatus === status).length;
  const live = (value) => (isLoading ? "…" : loadError ? "—" : String(value));

  const save = async (testStatus, testNotes) => {
    try {
      const saved = await signOffPhase(signing.uuid, { testStatus, testNotes });
      showToast.success(
        saved.clientApprovalStatus === "Pending" && testStatus === "Passed"
          ? `"${signing.name}" passed and was sent to the client for approval.`
          : `"${signing.name}" marked as ${testStatus.toLowerCase()}.`,
      );
      setSigning(null);
      reload();
      return true;
    } catch (error) {
      showToast.error(getTestingError(error, "Couldn't save the sign-off."));
      return false;
    }
  };

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
    { key: "status", header: "Work status", render: (row) => <Badge tone="neutral">{row.status}</Badge> },
    {
      key: "test",
      header: "Test result",
      render: (row) => (
        <div className="max-w-[240px]">
          <Badge tone={RESULT_TONE[row.testStatus]}>{row.testStatus}</Badge>
          {row.testNotes && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.testNotes}</p>}
          {row.testedAt && (
            <p className="mt-1 text-[11px] text-slate-400">
              {row.testedBy} · {formatDateTime(row.testedAt)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "client",
      header: "Client approval",
      render: (row) =>
        !row.needsClientApproval ? (
          <span className="text-xs text-slate-400">Not needed</span>
        ) : row.clientApprovalStatus ? (
          <Badge tone={CLIENT_APPROVAL_TONE[row.clientApprovalStatus]}>
            {row.clientApprovalStatus === "Pending" ? "With client" : row.clientApprovalStatus}
          </Badge>
        ) : (
          <span className="text-xs font-medium text-blue-700">Goes to client when passed</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button size="sm" variant={row.testStatus === "Pending" ? "primary" : "outline"} onClick={() => setSigning(row)}>
          {row.testStatus === "Pending" ? "Sign off" : "Re-test"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="TESTING"
        title="Phase Testing"
        description="Sign off each phase of your projects. Phases marked “Needs client approval” go to the client once you pass them."
        icon={Layers3}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="To test" value={live(countOf("Pending"))} icon={<Clock3 size={18} />} accent="warning" />
        <StatCard label="Passed" value={live(countOf("Passed"))} icon={<CheckCircle2 size={18} />} accent="success" />
        <StatCard label="Failed" value={live(countOf("Failed"))} icon={<XCircle size={18} />} accent="purple" />
        <StatCard
          label="With client"
          value={live(inProject.filter((phase) => phase.clientApprovalStatus === "Pending").length)}
          icon={<UserCheck size={18} />}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Phases</h2>
            <p className="text-sm text-slate-500">Every phase of the projects you test.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-center">
          <Select
            aria-label="Project"
            value={project}
            options={projectOptions}
            onChange={(event) => setProject(event.target.value)}
          />
          <TableSearch value={search} onChange={setSearch} placeholder="Search phase, module or project…" />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === item
                    ? "border-[#0b1932] bg-[#0b1932] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <ErrorState title="Couldn't load phases" description={loadError} onRetry={reload} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            isLoading={isLoading}
            emptyMessage={
              phases.length === 0
                ? "No phases yet. They appear here once the project lead adds them."
                : "No phases match this filter or search."
            }
          />
        )}
      </section>

      {signing && (
        <ResultModal
          eyebrow="PHASE TESTING"
          title={`Sign off “${signing.name}”`}
          description={`${signing.project.name} · ${signing.moduleName}${
            signing.needsClientApproval ? " · goes to the client if it passes" : ""
          }`}
          initialNotes={signing.testNotes ?? ""}
          onClose={() => setSigning(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
