import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import { getErrorMessage, getMyProjects } from "../../services/developerProjectService";

/**
 * Developer → My Projects: the projects this developer LEADS
 * (set by Admin / BDE in Project Management). Read-only.
 */

// Badge only has: success / warning / danger / info / neutral
const STATUS_TONE = {
  Planning: "neutral",
  "In Development": "info",
  Testing: "warning",
  Completed: "success",
  "On Hold": "warning",
  Cancelled: "danger",
};

// "2026-10-15" → "15 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "—";
  const [year, month, day] = String(yyyyMmDd).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Same short ID as Admin → Project Management
const shortId = (uuid) => `PRJ-${uuid.slice(0, 6).toUpperCase()}`;

function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-24 overflow-hidden rounded-full bg-cm-border"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${value === 100 ? "bg-green-600" : "bg-blue-600"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-cm-text-muted">{value}%</span>
    </div>
  );
}

function DeadlineCell({ project }) {
  return (
    <div className="flex flex-col gap-1">
      <span>{formatDate(project.deadline)}</span>
      {project.isOverdue && <Badge tone="danger">Overdue by {Math.abs(project.daysLeft)}d</Badge>}
      {project.isDueSoon && <Badge tone="warning">{project.daysLeft === 0 ? "Due today" : `${project.daysLeft}d left`}</Badge>}
    </div>
  );
}

function ProjectDetails({ project, onClose }) {
  return (
    <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-cm-text-muted">{shortId(project.uuid)}</p>
          <h2 className="mt-1 text-lg font-semibold text-cm-text">{project.name}</h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            {project.client.name} · {project.tier}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[project.status] ?? "neutral"}>{project.status}</Badge>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Timeline", `${formatDate(project.startDate)} → ${formatDate(project.deadline)}`],
          ["Internal Deadline", formatDate(project.internalDeadline)],
          ["Client Contact", [project.client.email, project.client.phone].filter(Boolean).join(" · ") || "—"],
          ["Progress", `${project.progress}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-cm-border p-4">
            <p className="text-xs text-cm-text-muted">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-cm-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-cm-border p-4">
        <p className="text-xs text-cm-text-muted">Description</p>
        <p className="mt-1 text-sm text-cm-text">{project.description || "No description added."}</p>
      </div>
    </section>
  );
}

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let ignore = false; // page closed before the answer arrived → drop it
    getMyProjects()
      .then((list) => {
        if (ignore) return;
        setProjects(list);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, "Couldn't load your projects."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = query
      ? projects.filter((p) =>
          [p.name, p.client.name, p.status, p.tier, shortId(p.uuid)]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query)),
        )
      : projects;
    return list.map((p) => ({ ...p, id: p.uuid }));
  }, [projects, q]);

  const columns = [
    { key: "id", header: "Project ID", render: (r) => <span className="text-xs text-cm-text-muted">{shortId(r.uuid)}</span> },
    { key: "name", header: "Project", render: (r) => <span className="font-medium text-cm-text">{r.name}</span> },
    { key: "client", header: "Client", render: (r) => r.client.name },
    { key: "deadline", header: "Deadline", render: (r) => <DeadlineCell project={r} /> },
    { key: "progress", header: "Progress", render: (r) => <ProgressBar value={r.progress} /> },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">My Projects</h1>
        <p className="mt-1 text-sm text-cm-text-muted">Projects you lead.</p>
      </div>

      {selected && <ProjectDetails project={selected} onClose={() => setSelected(null)} />}

      {loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load your projects" description={loadError} onRetry={retry} />
        </div>
      ) : (
        <>
          <TableSearch value={q} onChange={setQ} placeholder="Search my projects…" />
          <DataTable
            columns={columns}
            rows={rows}
            isLoading={isLoading}
            emptyMessage={q ? "No projects match your search." : "You're not leading any projects yet."}
          />
        </>
      )}
    </div>
  );
}