import { useEffect, useState } from "react";
import Badge from "../../components/common/Badge";
import { getTesterAssignedProjects } from "../../services/testerDashboardService";

const formatDate = (value) => {
  if (!value) return "No deadline";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "No deadline"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const statusTone = (status) => {
  if (status === "Completed") return "success";
  if (status === "Cancelled") return "danger";
  if (status === "Testing") return "info";
  return "neutral";
};

function ProjectCard({ project }) {
  const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));

  return (
    <article className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-cm-text">
            {project.name}
          </h2>
          <p className="mt-1 text-xs text-cm-text-muted">
            Project ID: {project.uuid.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <Badge tone={statusTone(project.status)}>
          {project.status || "Not set"}
        </Badge>
      </div>

      <div className="mt-4 rounded-cm-md bg-cm-bg p-3">
        <p className="text-xs text-cm-text-muted">Project Lead</p>
        <p className="mt-1 text-sm font-medium text-cm-text">
          {project.projectLead}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-cm-text-muted">Project progress</p>
          <p className="text-xs font-medium text-cm-text">{progress}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-cm-border">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-cm-border pt-3">
        <p className="text-xs text-cm-text-muted">Project deadline</p>
        <p className="mt-1 text-sm text-cm-text">
          {formatDate(project.deadline)}
        </p>
      </div>
    </article>
  );
}

export default function AssignedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getTesterAssignedProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load assigned projects.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Assigned Projects</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Projects assigned to you for testing.
        </p>
      </div>

      {loading ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-6 text-sm text-cm-text-muted">
          Loading assigned projects...
        </div>
      ) : error ? (
        <div className="rounded-cm-lg border border-rose-200 bg-cm-card p-6">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-6">
          <p className="font-medium text-cm-text">
            No projects assigned yet
          </p>
          <p className="mt-1 text-sm text-cm-text-muted">
            Projects assigned to you by Admin in Project Operations will appear
            here.
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-cm-text-muted">
            {projects.length} assigned {projects.length === 1 ? "project" : "projects"}
          </div>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.uuid} project={project} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}