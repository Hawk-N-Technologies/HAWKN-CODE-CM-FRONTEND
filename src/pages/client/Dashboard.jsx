import { useEffect, useState } from "react";
import { FolderKanban, ListChecks, Bug, CheckCircle2 } from "lucide-react";
import { getClientProjects, getErrorMessage } from "../../services/clientProjectService";

// ---------------------------------------------------------------------------
// Still static until the Tasks / Bugs / Activity modules exist
// ---------------------------------------------------------------------------
const STATIC_ASSIGNED_TASKS = 8;
const STATIC_OPEN_BUGS = 3;

const activities = [
  {
    title: "New build submitted",
    project: "Acme Retail ERP",
    time: "10 min ago",
  },
  {
    title: "Phase testing completed",
    project: "Internal HRMS",
    time: "1 hour ago",
  },
  {
    title: "Bug returned for retest",
    project: "Acme Retail ERP",
    time: "Yesterday",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Same short ID as Admin / Developer project pages
const shortId = (uuid) => `PRJ-${uuid.slice(0, 6).toUpperCase()}`;

// "2026-10-15" → "15 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "Not set";
  const [year, month, day] = String(yyyyMmDd).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Status pill colours (same family as the existing blue pill)
const STATUS_STYLE = {
  Planning: "bg-gray-100 text-gray-700",
  "In Development": "bg-blue-50 text-blue-700",
  Testing: "bg-amber-50 text-amber-700",
  Completed: "bg-green-50 text-green-700",
  "On Hold": "bg-amber-50 text-amber-700",
  Cancelled: "bg-red-50 text-red-700",
};

function DeadlineNote({ project }) {
  if (project.isOverdue) {
    return <span className="ml-2 font-medium text-red-600">· Overdue by {Math.abs(project.daysLeft)}d</span>;
  }
  if (project.isDueSoon) {
    return (
      <span className="ml-2 font-medium text-amber-600">
        · {project.daysLeft === 0 ? "Due today" : `${project.daysLeft}d left`}
      </span>
    );
  }
  return null;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false; // page closed before the answer arrived → drop it
    getClientProjects()
      .then((result) => {
        if (ignore) return;
        setData(result);
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

  const projects = data?.projects ?? [];
  const live = (value) => (isLoading ? "…" : loadError ? "—" : value);

  const stats = [
    { label: "Active Projects", value: live(data?.summary.active ?? 0), icon: FolderKanban },
    { label: "Assigned Tasks", value: STATIC_ASSIGNED_TASKS, icon: ListChecks },
    { label: "Open Bugs", value: STATIC_OPEN_BUGS, icon: Bug },
    { label: "Completed Projects", value: live(data?.summary.completed ?? 0), icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Client Dashboard</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Overview of your projects, testing and delivery progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <section
            key={label}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <Icon className="h-5 w-5 text-blue-600" />
            <p className="mt-4 text-sm text-cm-text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold text-cm-text">{value}</p>
          </section>
        ))}
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">My Projects</h2>

        {isLoading && <p className="mt-4 text-sm text-cm-text-muted">Loading your projects…</p>}

        {!isLoading && loadError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={retry}
              className="rounded-md border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !loadError && projects.length === 0 && (
          <p className="mt-4 text-sm text-cm-text-muted">No projects yet — they'll appear here once they're set up.</p>
        )}

        {!isLoading && !loadError && projects.length > 0 && (
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <article key={project.uuid} className="rounded-lg border border-cm-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-cm-text-muted">{shortId(project.uuid)}</p>
                    <h3 className="mt-1 font-semibold text-cm-text">{project.name}</h3>
                    <p className="mt-1 text-xs text-cm-text-muted">
                      Lead: {project.leadName || "To be assigned"} · Deadline: {formatDate(project.deadline)}
                      <DeadlineNote project={project} />
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[project.status] ?? "bg-blue-50 text-blue-700"}`}
                  >
                    {project.status}
                  </span>
                </div>

                <div
                  className="mt-4 h-2 rounded-full bg-cm-border"
                  role="progressbar"
                  aria-valuenow={project.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${project.name} progress`}
                >
                  <div
                    className={`h-full rounded-full ${project.progress === 100 ? "bg-green-600" : "bg-blue-600"}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <p className="mt-2 text-right text-xs text-cm-text-muted">{project.progress}% complete</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">Recent Activity</h2>

        <div className="mt-4 space-y-3">
          {activities.map((activity) => (
            <div
              key={`${activity.title}-${activity.time}`}
              className="rounded-lg border border-cm-border p-4"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cm-text">{activity.title}</p>
                  <p className="mt-1 text-xs text-cm-text-muted">{activity.project}</p>
                </div>
                <span className="text-xs text-cm-text-muted">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}