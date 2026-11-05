
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  RefreshCw,
  Save,
  Bug,
  CalendarDays,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
  Clock3,
  CircleDot,
} from "lucide-react";

import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

const DEVELOPER_STATUSES = ["Assigned", "In Progress", "Fixed"];

const STATUS_STYLES = {
  Assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Fixed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const SEVERITY_STYLES = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-red-50 text-red-700",
};

const getPayload = (response) => response?.data?.data ?? response?.data;

const getList = (response) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.bugs)) return payload.bugs;

  return [];
};

const normalizeBug = (bug) => ({
  ...bug,
  id: bug.uuid ?? bug.id,
  title: bug.title ?? "Untitled bug",
  description: bug.description ?? "",
  severity: bug.severity ?? "Medium",
  status: bug.status ?? "Assigned",
  createdAt: bug.createdAt ?? bug.created_at ?? null,
});

const getProjectUuid = (project) =>
  String(project?.uuid ?? project?.id ?? "");

const getSelectValue = (eventOrValue) =>
  eventOrValue?.target?.value ?? eventOrValue;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* -------------------------------------------------------------------------- */
/* Standardized developer page header                                        */
/* -------------------------------------------------------------------------- */

function PageHeader({ title, subtitle, metadata, action }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 px-5 py-5 shadow-sm sm:px-6 sm:py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-28 -z-10 h-[290px] w-[290px] rounded-full border border-blue-100"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-5 -top-20 -z-10 h-[220px] w-[220px] rounded-full border border-blue-100"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-1/3 bg-gradient-to-l from-blue-50/50 to-transparent"
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[13px] bg-[#0b1833] text-base font-bold tracking-wide text-white shadow-sm sm:h-[62px] sm:w-[62px]">
            DEV
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700 sm:text-xs">
              Development
            </p>

            <h1 className="mt-1.5 break-words text-[25px] font-bold leading-tight tracking-tight text-[#101b32] sm:text-[28px] lg:text-[30px]">
              {title}
            </h1>

            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-500 sm:text-sm">
              {subtitle}
            </p>

            {metadata?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {metadata.map((item, index) => (
                  <span
                    key={`${item.label}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 sm:text-xs"
                  >
                    {item.dot && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {action && (
          <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary cards                                                              */
/* -------------------------------------------------------------------------- */

function SummaryCard({ label, value, description, icon: Icon, iconStyle }) {
  return (
    <article className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500 sm:text-sm">
          {label}
        </p>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-4 text-[28px] font-bold leading-none tracking-tight text-[#101b32] tabular-nums">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function SectionHeading({ title, subtitle, trailing }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#101b32] sm:text-xl">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      {trailing}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bug card                                                                   */
/* -------------------------------------------------------------------------- */

function BugCard({
  bug,
  selectedStatus,
  saving,
  onStatusChange,
  onSave,
}) {
  const statusChanged = selectedStatus !== bug.status;

  return (
    <article className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      {/* Bug heading */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Bug size={12} />
              Bug report
            </span>

            {bug.createdAt && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <CalendarDays size={12} />
                {formatDate(bug.createdAt)}
              </span>
            )}
          </div>

          <h3 className="break-words text-[15px] font-bold leading-snug text-[#17233b] sm:text-base">
            {bug.title}
          </h3>

          {bug.description && (
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-500">
              {bug.description}
            </p>
          )}
        </div>

        <span
          className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
            SEVERITY_STYLES[bug.severity] ?? SEVERITY_STYLES.Medium
          }`}
        >
          <AlertCircle size={13} />
          {bug.severity}
        </span>
      </div>

      {/* Current status */}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <span className="text-[11px] font-medium text-slate-400">
          Current status
        </span>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
            STATUS_STYLES[bug.status] ??
            "bg-slate-100 text-slate-700 ring-slate-200"
          }`}
        >
          <CircleDot size={12} />
          {bug.status}
        </span>
      </div>

      {/* Status update */}

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
        <div className="mb-3">
          <p className="text-xs font-bold text-[#17233b]">
            Update bug status
          </p>

          <p className="mt-1 text-[11px] text-slate-500">
            Select the new status and save your changes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full flex-1 sm:max-w-xs">
            <Select
              label="New status"
              name={`status-${bug.id}`}
              value={selectedStatus}
              options={DEVELOPER_STATUSES.map((status) => ({
                value: status,
                label: status,
              }))}
              onChange={onStatusChange}
              disabled={saving}
            />
          </div>

          <Button
            type="button"
            onClick={onSave}
            disabled={saving || !statusChanged}
          >
            <span className="inline-flex items-center gap-2">
              {saving ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}

              {saving ? "Saving..." : "Save Status"}
            </span>
          </Button>
        </div>

        {statusChanged && (
          <p className="mt-2 text-[11px] font-medium text-blue-700">
            Unsaved change: {bug.status} → {selectedStatus}
          </p>
        )}
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function BugFixing() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [projectMap, setProjectMap] = useState({});

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [savingBugId, setSavingBugId] = useState(null);
  const [statusChanges, setStatusChanges] = useState({});

  /* Fetch available projects */

  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);

      try {
        const response = await axios.get("/api/bugs/projects-dropdown", {
          withCredentials: true,
        });

        const payload = getPayload(response);

        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.projects)
            ? payload.projects
            : [];

        const idMap = Object.fromEntries(
          list.map((project) => [
            getProjectUuid(project),
            project.id,
          ]),
        );

        if (active) {
          setProjects(list);
          setProjectMap(idMap);

          if (list.length) {
            setProjectId((current) => current || getProjectUuid(list[0]));
          }
        }
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message || "Failed to load projects.",
          );
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    };

    fetchProjects();

    return () => {
      active = false;
    };
  }, []);

  /* Fetch bugs assigned to the developer */

  const fetchAssignedBugs = useCallback(async () => {
    if (!projectId) {
      setBugs([]);
      setStatusChanges({});
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const numericProjectId = projectMap[projectId];

      if (!numericProjectId) {
        setBugs([]);
        showToast.error("Could not resolve the selected project ID.");
        return;
      }

      const response = await axios.get(
        `/api/bugs/projects/${encodeURIComponent(numericProjectId)}/assigned-bugs`,
        { withCredentials: true },
      );

      const list = getList(response).map(normalizeBug);

      setBugs(list);
      setStatusChanges({});
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Failed to load assigned bugs.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, projectMap]);

  useEffect(() => {
    fetchAssignedBugs();
  }, [fetchAssignedBugs]);

  /* Save bug status */

  const handleStatusSave = async (bug) => {
    const nextStatus = statusChanges[bug.id] ?? bug.status;

    if (nextStatus === bug.status) {
      showToast.error("Choose a different status before saving.");
      return;
    }

    setSavingBugId(bug.id);

    try {
      const response = await axios.put(
        `/api/bugs/developer/${bug.uuid}/status`,
        { status: nextStatus },
        { withCredentials: true },
      );

      if (response.status === 200) {
        showToast.success("Bug status updated successfully.");
        await fetchAssignedBugs();
      }
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Failed to update bug status.",
      );
    } finally {
      setSavingBugId(null);
    }
  };

  /* Summary metrics */

  const summary = useMemo(
    () => ({
      total: bugs.length,
      assigned: bugs.filter((bug) => bug.status === "Assigned").length,
      inProgress: bugs.filter((bug) => bug.status === "In Progress").length,
      fixed: bugs.filter((bug) => bug.status === "Fixed").length,
    }),
    [bugs],
  );

  const selectedProject = projects.find(
    (project) => getProjectUuid(project) === projectId,
  );

  const summaryCards = [
    {
      label: "Assigned Bugs",
      value: summary.total,
      description: "Total bugs assigned to you",
      icon: Bug,
      iconStyle: "bg-blue-50 text-blue-700",
    },
    {
      label: "Assigned",
      value: summary.assigned,
      description: "Awaiting development",
      icon: CircleDot,
      iconStyle: "bg-slate-100 text-slate-700",
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      description: "Currently being worked on",
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      label: "Fixed",
      value: summary.fixed,
      description: "Marked as fixed",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <main className="flex min-w-0 flex-col gap-6">
      {/* Standardized page header */}

      <PageHeader
        title="Bug Fixing"
        subtitle="Review bugs assigned to you, track their severity, and update fixing progress."
        metadata={[
          { label: "Development workspace", dot: true },
          {
            label: loadingProjects
              ? "Loading projects..."
              : `${projects.length} available project${projects.length === 1 ? "" : "s"}`,
          },
        ]}
        action={
          <Button
            type="button"
            onClick={fetchAssignedBugs}
            disabled={loading || !projectId}
            variant="outline"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </span>
          </Button>
        }
      />

      {/* Project selection */}

      <section className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <FolderKanban size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-[#101b32]">
              Project Workspace
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Select a project to view bugs assigned to you.
            </p>

            <div className="mt-3 max-w-xl">
              <Select
                label="Select project"
                name="projectId"
                required
                value={projectId}
                options={projects.map((project) => ({
                  value: getProjectUuid(project),
                  label:
                    project.name ??
                    project.projectName ??
                    `Project ${getProjectUuid(project)}`,
                }))}
                placeholder={
                  loadingProjects ? "Loading projects..." : "Select project"
                }
                disabled={loadingProjects || projects.length === 0}
                onChange={(eventOrValue) => {
                  const value = getSelectValue(eventOrValue);

                  setProjectId(value);
                  setBugs([]);
                  setStatusChanges({});
                }}
              />
            </div>

            {selectedProject && (
              <p className="mt-2 text-xs font-medium text-blue-700">
                Selected:{" "}
                {selectedProject.name ?? selectedProject.projectName}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Summary */}

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Bug Overview"
          subtitle="Current status of bugs assigned to you."
          trailing={
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
              {loading ? "Updating..." : "Current totals"}
            </span>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <SummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      {/* Assigned bugs */}

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Assigned Bugs"
          subtitle="Review each bug and update its current fixing status."
          trailing={
            <span className="text-xs font-medium text-slate-500">
              {bugs.length} {bugs.length === 1 ? "bug" : "bugs"}
            </span>
          }
        />

        {!projectId ? (
          <div className="rounded-[16px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <FolderKanban
              className="mx-auto mb-3 text-slate-300"
              size={30}
            />

            <p className="text-sm font-semibold text-[#17233b]">
              Select a project
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Choose a project above to view your assigned bugs.
            </p>
          </div>
        ) : loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-[16px] border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw
                className="animate-spin text-blue-600"
                size={24}
              />

              <p className="text-sm text-slate-500">
                Loading assigned bugs...
              </p>
            </div>
          </div>
        ) : bugs.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Bug size={23} />
            </div>

            <p className="mt-3 text-sm font-bold text-[#17233b]">
              No assigned bugs found
            </p>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Bugs assigned to you for this project will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bugs.map((bug) => (
              <BugCard
                key={bug.id}
                bug={bug}
                selectedStatus={statusChanges[bug.id] ?? bug.status}
                saving={savingBugId === bug.id}
                onStatusChange={(eventOrValue) => {
                  const value = getSelectValue(eventOrValue);

                  setStatusChanges((previous) => ({
                    ...previous,
                    [bug.id]: value,
                  }));
                }}
                onSave={() => handleStatusSave(bug)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
