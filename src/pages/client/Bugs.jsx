import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Badge from "../../components/common/Badge";
import { showToast } from "../../components/common/Toast";

const getList = (response, key) => {
  const data = response?.data?.data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const severityVariant = {
  Low: "success",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

const statusVariant = {
  Submitted: "info",
  Open: "danger",
  Assigned: "info",
  "In Progress": "warning",
  Fixed: "success",
  "Ready for Retest": "info",
  Reopened: "warning",
  Closed: "success",
  Rejected: "secondary",
};

export default function Bugs() {
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [issues, setIssues] = useState([]);

  const [projectId, setProjectId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [search, setSearch] = useState("");

  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);

  const fetchReportedIssues = useCallback(async () => {
    setLoadingIssues(true);

    try {
      const response = await axios.get("/api/bugs/issued-bugs", {
        withCredentials: true,
      });

      if (response.status === 200) {
        setIssues(getList(response, "issues"));
      }
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Failed to fetch reported issues."),
      );
    } finally {
      setLoadingIssues(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);

      try {
        const response = await axios.get("/api/clients/projects-dropdown", {
          withCredentials: true,
        });

        if (active) setProjects(getList(response, "projects"));
      } catch (error) {
        if (active) {
          showToast.error(getErrorMessage(error, "Failed to load projects."));
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    };

    fetchProjects();
    fetchReportedIssues();

    return () => {
      active = false;
    };
  }, [fetchReportedIssues]);

  useEffect(() => {
    let active = true;

    setModules([]);
    setModuleId("");

    if (!projectId) {
      setLoadingModules(false);
      return () => {
        active = false;
      };
    }

    const fetchModules = async () => {
      setLoadingModules(true);

      try {
        const response = await axios.get(`/api/projects/${projectId}/modules`, {
          withCredentials: true,
        });

        if (active) setModules(getList(response, "modules"));
      } catch (error) {
        if (active) {
          showToast.error(getErrorMessage(error, "Failed to load modules."));
        }
      } finally {
        if (active) setLoadingModules(false);
      }
    };

    fetchModules();

    return () => {
      active = false;
    };
  }, [projectId]);

  const selectedProject = projects.find(
    (project) => String(project.id) === projectId,
  );

  const selectedModule = modules.find(
    (module) => String(module.id) === moduleId,
  );

  const visibleIssues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesProject =
        !projectId || String(issue.projectId) === projectId;
      const matchesModule =
        !moduleId || String(issue.moduleId ?? "") === moduleId;
      const matchesSearch =
        !normalizedSearch ||
        [
          issue.title,
          issue.description,
          issue.classification,
          issue.status,
          issue.severity,
          issue.uuid,
          issue.id,
        ]
          .filter((value) => value !== null && value !== undefined)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

      return matchesProject && matchesModule && matchesSearch;
    });
  }, [issues, projectId, moduleId, search]);

  const summary = useMemo(
    () => [
      {
        label: "Total Issues",
        value: visibleIssues.length,
        icon: Bug,
      },
      {
        label: "Submitted",
        value: visibleIssues.filter((issue) => issue.status === "Submitted")
          .length,
        icon: AlertCircle,
      },
      {
        label: "In Progress",
        value: visibleIssues.filter((issue) => issue.status === "In Progress")
          .length,
        icon: Clock3,
      },
      {
        label: "Resolved",
        value: visibleIssues.filter((issue) =>
          ["Fixed", "Closed"].includes(issue.status),
        ).length,
        icon: CheckCircle2,
      },
    ],
    [visibleIssues],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cm-text">Reported Issues</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            View and filter issues reported across your projects.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={fetchReportedIssues}
          disabled={loadingIssues}
        >
          <span className="flex items-center gap-2">
            <RefreshCw
              size={16}
              className={loadingIssues ? "animate-spin" : ""}
            />
            Refresh
          </span>
        </Button>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Project"
            name="projectId"
            value={projectId}
            options={projects.map((project) => ({
              value: String(project.id),
              label:
                project.name || project.projectName || `Project ${project.id}`,
            }))}
            placeholder={
              loadingProjects ? "Loading projects..." : "All projects"
            }
            disabled={loadingProjects}
            onChange={(event) => setProjectId(event.target.value)}
          />

          <Select
            label="Module"
            name="moduleId"
            value={moduleId}
            options={modules.map((module) => ({
              value: String(module.id),
              label: module.name || module.moduleName || `Module ${module.id}`,
            }))}
            placeholder={
              !projectId
                ? "Select a project first"
                : loadingModules
                  ? "Loading modules..."
                  : "All modules"
            }
            disabled={!projectId || loadingModules}
            onChange={(event) => setModuleId(event.target.value)}
          />

          <Input
            label="Search issues"
            name="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, description, status..."
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-cm-text-muted">{label}</p>
              <Icon size={18} className="text-cm-text-muted" />
            </div>
            <p className="mt-3 text-2xl font-bold text-cm-text">{value}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cm-border p-5">
          <div>
            <h2 className="font-semibold text-cm-text">Issue List</h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              {selectedProject?.name ||
                selectedProject?.projectName ||
                "All projects"}
              {selectedModule
                ? ` / ${selectedModule.name || selectedModule.moduleName}`
                : ""}
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {visibleIssues.length}{" "}
            {visibleIssues.length === 1 ? "issue" : "issues"}
          </span>
        </div>

        {loadingIssues ? (
          <div className="flex min-h-48 items-center justify-center p-10">
            <Loader />
          </div>
        ) : visibleIssues.length === 0 ? (
          <div className="p-10 text-center">
            <Bug size={32} className="mx-auto text-cm-text-muted" />
            <p className="mt-3 font-medium text-cm-text">No issues found</p>
            <p className="mt-1 text-sm text-cm-text-muted">
              Try changing the project, module, or search term.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cm-border">
            {visibleIssues.map((issue) => (
              <article
                key={issue.uuid || issue.id}
                className="space-y-3 p-5 transition-colors hover:bg-cm-bg/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-1 rounded-lg bg-red-50 p-2 text-red-600">
                      <Bug size={18} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-cm-text">
                        {issue.title || "Untitled issue"}
                      </h3>
                      <p className="mt-1 break-all text-xs text-cm-text-muted">
                        ISSUE-{issue.id} · {issue.uuid}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant[issue.severity] || "info"}>
                      {issue.severity || "Unspecified"}
                    </Badge>
                    <Badge variant={statusVariant[issue.status] || "secondary"}>
                      {issue.status || "Unknown"}
                    </Badge>
                  </div>
                </div>

                {issue.description && (
                  <p className="text-sm leading-6 text-cm-text-muted md:pl-11">
                    {issue.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-cm-text-muted md:pl-11">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={13} />
                    {formatDate(issue.createdAt)}
                  </span>
                </div>

                {(issue.reviewNotes || issue.reviewedBy != null) && (
                  <div className="rounded-lg bg-cm-bg p-3 text-sm md:ml-11">
                    <p className="font-medium text-cm-text">Review details</p>
                    {issue.reviewedBy != null && (
                      <p className="mt-1 text-cm-text-muted">
                        Reviewed by: {issue.reviewedBy}
                      </p>
                    )}
                    {issue.reviewNotes && (
                      <p className="mt-1 text-cm-text-muted">
                        {issue.reviewNotes}
                      </p>
                    )}
                    {issue.reviewedAt && (
                      <p className="mt-1 text-xs text-cm-text-muted">
                        Reviewed on: {formatDate(issue.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
