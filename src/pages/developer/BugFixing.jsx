import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  RefreshCw,
  Save,
  Bug,
  CalendarDays,
  AlertCircle,
  Sparkles,
  FolderKanban,
  CheckCircle2,
  Clock3,
  CircleDot,
} from "lucide-react";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

// Keep these values aligned with the statuses accepted by your backend.
const DEVELOPER_STATUSES = ["Assigned", "In Progress", "Fixed"];

const STATUS_STYLES = {
  Assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Fixed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const SEVERITY_STYLES = {
  Low: "bg-gray-100 text-gray-700",
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

// The dropdown uses the project's public UUID.
// The assigned-bugs controller expects the internal numeric projects.id.
const getProjectUuid = (project) =>
  String(project?.uuid ?? project?.id ?? "");

export default function BugFixing() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [projectMap, setProjectMap] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingBugId, setSavingBugId] = useState(null);
  const [statusChanges, setStatusChanges] = useState({});

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
          ])
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
            error.response?.data?.message || "Failed to load projects."
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

  const fetchAssignedBugs = useCallback(async () => {
    if (!projectId) {
      setBugs([]);
      setStatusChanges({});
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
        `/api/bugs/projects/${encodeURIComponent(
          numericProjectId
        )}/assigned-bugs`,
        { withCredentials: true }
      );

      const list = getList(response).map(normalizeBug);

      setBugs(list);
      setStatusChanges({});
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Failed to load assigned bugs."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, projectMap]);

  useEffect(() => {
    fetchAssignedBugs();
  }, [fetchAssignedBugs]);

  const handleStatusSave = async (bug) => {
    const nextStatus = statusChanges[bug.id] ?? bug.status;

    if (nextStatus === bug.status) {
      showToast.error("Choose a different status before saving.");
      return;
    }

    setSavingBugId(bug.id);

    try {
      const res = await axios.put(
        `/api/bugs/developer/${bug.uuid}/status`,
        { status: nextStatus },
        { withCredentials: true }
      );

      if (res.status == 200) {
        showToast.success("Bug status updated successfully.");
        await fetchAssignedBugs();
      }
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Failed to update bug status."
      );
    } finally {
      setSavingBugId(null);
    }
  };

  const selectedProject = projects.find(
    (project) => getProjectUuid(project) === projectId
  );

  const projectName = selectedProject
    ? selectedProject.name ??
      selectedProject.projectName ??
      `Project ${projectId}`
    : "No project selected";

  const assignedCount = bugs.length;
  const fixedCount = bugs.filter((bug) => bug.status === "Fixed").length;
  const inProgressCount = bugs.filter(
    (bug) => bug.status === "In Progress"
  ).length;
  const assignedStatusCount = bugs.filter(
    (bug) => bug.status === "Assigned"
  ).length;

  const severityCount = {
    Critical: bugs.filter((bug) => bug.severity === "Critical").length,
    High: bugs.filter((bug) => bug.severity === "High").length,
    Medium: bugs.filter((bug) => bug.severity === "Medium").length,
    Low: bugs.filter((bug) => bug.severity === "Low").length,
  };

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-12 h-52 w-52 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-[-100px] left-[38%] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-100">
              <Sparkles size={13} />
              Personal Workspace
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px]">
              Bug Fixing
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
              Review bugs assigned to you, track their severity, and update
              their resolution status.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
                <FolderKanban size={14} className="text-blue-300" />
                {projectName}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
                <Bug size={14} className="text-blue-300" />
                {assignedCount} assigned{" "}
                {assignedCount === 1 ? "bug" : "bugs"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="min-w-[145px] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Selected project
              </p>
              <p className="mt-1 max-w-[180px] truncate text-base font-semibold text-white">
                {projectName}
              </p>
            </div>

            <Button
              type="button"
              onClick={fetchAssignedBugs}
              disabled={loading || !projectId}
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Project Selection */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FolderKanban size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Project Selection
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Select a project to view your assigned bugs.
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <Select
            label="Project"
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
            disabled={loadingProjects}
            onChange={(eventOrValue) => {
              const value = eventOrValue?.target?.value ?? eventOrValue;

              setProjectId(value);
              setBugs([]);
              setStatusChanges({});
            }}
          />
        </div>
      </section>

      {/* Summary Cards */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Your bug summary
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your assigned bug-fixing workload.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Assigned Bugs"
            value={assignedCount}
            description="Total assigned to you"
            icon={Bug}
            iconClass="bg-indigo-50 text-indigo-600"
            dotClass="bg-indigo-500"
          />

          <SummaryCard
            label="Assigned"
            value={assignedStatusCount}
            description="Awaiting progress"
            icon={CircleDot}
            iconClass="bg-blue-50 text-blue-600"
            dotClass="bg-blue-500"
          />

          <SummaryCard
            label="In Progress"
            value={inProgressCount}
            description="Currently being worked on"
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600"
            dotClass="bg-amber-500"
          />

          <SummaryCard
            label="Fixed"
            value={fixedCount}
            description="Marked as fixed"
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
            dotClass="bg-emerald-500"
          />
        </div>
      </section>

      {/* Severity Overview */}
      {projectId && !loading && bugs.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Severity breakdown
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Distribution of bugs assigned to you by severity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(severityCount).map(([severity, count]) => (
              <div
                key={severity}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      SEVERITY_STYLES[severity]
                    }`}
                  >
                    {severity}
                  </span>
                  <span className="text-xl font-semibold tabular-nums text-slate-900">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Assigned Bugs */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Assigned Bugs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review bug details and manage their status.
            </p>
          </div>

          {projectId && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              {assignedCount}{" "}
              {assignedCount === 1 ? "record" : "records"}
            </span>
          )}
        </div>

        {!projectId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FolderKanban size={22} />
            </div>
            <p className="font-semibold text-slate-800">
              Select a project
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Choose a project above to view your assigned bugs.
            </p>
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
            <RefreshCw
              size={25}
              className="mx-auto mb-3 animate-spin text-indigo-500"
            />
            <p className="text-sm font-medium text-slate-700">
              Loading assigned bugs...
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Retrieving your project bug records.
            </p>
          </div>
        ) : bugs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Bug size={23} />
            </div>
            <p className="font-semibold text-slate-800">
              No assigned bugs found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Bugs assigned to you for this project will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bugs.map((bug) => {
              const selectedStatus = statusChanges[bug.id] ?? bug.status;
              const isSaving = savingBugId === bug.id;

              return (
                <article
                  key={bug.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            <Bug size={12} />
                            Bug report
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              SEVERITY_STYLES[bug.severity] ??
                              SEVERITY_STYLES.Medium
                            }`}
                          >
                            <AlertCircle
                              className="mr-1 inline"
                              size={13}
                            />
                            {bug.severity}
                          </span>
                        </div>

                        <h3 className="break-words text-base font-semibold text-slate-900 sm:text-lg">
                          {bug.title}
                        </h3>

                        {bug.description && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                            {bug.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span
                            className={`rounded-full px-3 py-1.5 font-medium ring-1 ring-inset ${
                              STATUS_STYLES[bug.status] ??
                              "bg-gray-100 text-gray-700 ring-gray-200"
                            }`}
                          >
                            {bug.status}
                          </span>

                          {bug.createdAt && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5">
                              <CalendarDays size={13} />
                              {new Date(
                                bug.createdAt
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-end">
                      <div className="w-full sm:max-w-xs">
                        <Select
                          label="Update status"
                          name={`status-${bug.id}`}
                          value={selectedStatus}
                          options={DEVELOPER_STATUSES.map((status) => ({
                            value: status,
                            label: status,
                          }))}
                          onChange={(eventOrValue) => {
                            const value =
                              eventOrValue?.target?.value ?? eventOrValue;

                            setStatusChanges((previous) => ({
                              ...previous,
                              [bug.id]: value,
                            }));
                          }}
                          disabled={isSaving}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleStatusSave(bug)}
                        disabled={
                          isSaving || selectedStatus === bug.status
                        }
                      >
                        <span className="inline-flex items-center gap-2">
                          <Save size={16} />
                          {isSaving ? "Saving..." : "Save Status"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
  dotClass,
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <span
        className={`absolute right-5 top-5 h-2.5 w-2.5 rounded-full ${dotClass}`}
      />

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={20} />
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </article>
  );
}
