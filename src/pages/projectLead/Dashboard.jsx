import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft } from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { getErrorMessage, getMyProjects } from "../../services/developerProjectService";

/**
 * Project Lead → Dashboard.
 * "Assigned projects" = projects where the logged-in developer is the
 * Project Lead (same data as Developer → My Projects, same API).
 */

// Still static until the Phases / Tasks modules exist
const STATIC_KPIS = [
  { label: "Active Phases", value: "7" },
  { label: "Open Tasks", value: "24" },
  { label: "Completed Tasks", value: "38" },
];

// Badge only has: success / warning / danger / info / neutral
const STATUS_TONE = {
  Planning: "neutral",
  "In Development": "info",
  Testing: "warning",
  Completed: "success",
  "On Hold": "warning",
  Cancelled: "danger",
};

// Same short ID as Admin / Developer project pages
const shortId = (uuid) => `PRJ-${uuid.slice(0, 6).toUpperCase()}`;

// "2026-10-15" → "15 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "Not set";
  const [year, month, day] = String(yyyyMmDd).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function DeadlineText({ project }) {
  return (
    <span>
      Deadline: {formatDate(project.deadline)}
      {project.isOverdue && (
        <span className="ml-1 font-medium text-red-600">· Overdue by {Math.abs(project.daysLeft)}d</span>
      )}
      {project.isDueSoon && (
        <span className="ml-1 font-medium text-amber-600">
          · {project.daysLeft === 0 ? "Due today" : `${project.daysLeft}d left`}
        </span>
      )}
    </span>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const switchToDeveloper = () => {
    navigate("/developer/dashboard");
  };

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

  // Average over projects that still count (cancelled ones don't)
  const averageProgress = useMemo(() => {
    const counted = projects.filter((project) => project.status !== "Cancelled");
    if (counted.length === 0) return 0;
    return Math.round(counted.reduce((sum, project) => sum + project.progress, 0) / counted.length);
  }, [projects]);

  const live = (value) => (isLoading ? "…" : loadError ? "—" : value);

  const kpis = [
    { label: "Assigned Projects", value: live(String(projects.length)) },
    ...STATIC_KPIS,
    { label: "Average Progress", value: live(`${averageProgress}%`) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">
            Welcome back, Project Lead
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Track assigned projects, planning, phases, tasks and overall
            delivery progress.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          leftIcon={<ArrowRightLeft size={16} />}
          onClick={switchToDeveloper}
        >
          Switch to Developer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-cm-text">
            Assigned Projects
          </h2>
          <span className="text-xs text-cm-text-muted">Current portfolio</span>
        </div>

        {isLoading && <p className="mt-4 text-sm text-cm-text-muted">Loading your projects…</p>}

        {!isLoading && loadError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-cm-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{loadError}</p>
            <Button size="sm" variant="outline" onClick={retry}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !loadError && projects.length === 0 && (
          <p className="mt-4 text-sm text-cm-text-muted">You're not leading any projects yet.</p>
        )}

        {!isLoading && !loadError && projects.length > 0 && (
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <div
                key={project.uuid}
                className="rounded-cm-md border border-cm-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-cm-text-muted">
                      {shortId(project.uuid)} · {project.client.name}
                    </p>
                    <h3 className="mt-1 font-medium text-cm-text">
                      {project.name}
                    </h3>
                  </div>

                  <Badge tone={STATUS_TONE[project.status] ?? "neutral"}>
                    {project.status}
                  </Badge>
                </div>

                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-cm-border"
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

                <div className="mt-2 flex flex-wrap justify-between gap-3 text-xs text-cm-text-muted">
                  <span>{project.progress}% complete</span>
                  <DeadlineText project={project} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;