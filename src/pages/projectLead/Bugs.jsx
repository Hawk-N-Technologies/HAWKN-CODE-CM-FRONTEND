import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/TextArea";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

const SEVERITIES = ["Low", "Medium", "High", "Critical"];

const STATUSES = [
  "Open",
  "Assigned",
  "In Progress",
  "Fixed",
  "Ready for Retest",
  "Reopened",
  "Closed",
  "Rejected",
];

const DISCOVERY_SOURCES = ["Client", "developer", "bde"];

const STATUS_STYLES = {
  Open: "bg-red-50 text-red-700 ring-red-200",
  Assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Fixed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Ready for Retest": "bg-violet-50 text-violet-700 ring-violet-200",
  Reopened: "bg-orange-50 text-orange-700 ring-orange-200",
  Closed: "bg-slate-100 text-slate-700 ring-slate-200",
  Rejected: "bg-slate-100 text-slate-500 ring-slate-200",
};

const SEVERITY_STYLES = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-red-50 text-red-700",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  severity: "Medium",
  status: "Open",
  discoverySource: "Testing",
  assignedTo: "",
};

// Keep these paths aligned with the existing Express routes.
const API = {
  projects: "/api/project-lead/planning/projects",
  employees: "/api/bugs/developers",
  modules: (projectId) => `/api/projects/${projectId}/modules`,
  bug: (projectId, bugId) =>
    `/api/bugs/projects/${projectId}/bugs/${bugId}`,
  createBug: "/api/bugs/createBug",
  projectBugs: (projectId, moduleId) =>
    moduleId
      ? `/api/bugs/projects/${encodeURIComponent(projectId)}/bugs?module=${encodeURIComponent(moduleId)}`
      : `/api/bugs/projects/${encodeURIComponent(projectId)}/bugs`,
};

const getPayload = (response) =>
  response?.data?.data ?? response?.data;

const getList = (response, key) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];

  return [];
};

// Project selection uses UUIDs in the existing project API.
const getId = (item) =>
  String(item?.uuid ?? item?.id ?? "");

// Module foreign keys in project_bugs use integer database IDs.
const getModuleId = (item) =>
  String(item?.id ?? "");

const getEmployeeName = (employee) =>
  employee?.full_name ??
  employee?.fullName ??
  employee?.name ??
  "Unnamed employee";

const normalizeBug = (bug) => ({
  ...bug,
  projectId: bug.projectId ?? bug.project_id,
  moduleId: bug.moduleId ?? bug.module_id ?? null,
  discoverySource:
    bug.discoverySource ??
    bug.discovery_source ??
    "Client",
  assignedTo:
    bug.assignedTo ??
    bug.assigned_to ??
    null,
  reportedBy:
    bug.reportedBy ??
    bug.reported_by ??
    null,
  createdAt:
    bug.createdAt ??
    bug.created_at ??
    bug.reportedAt ??
    null,
});

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SectionHeading = ({
  eyebrow,
  title,
  description,
  action,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0">
      {eyebrow && (
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          {eyebrow}
        </p>
      )}

      <h2 className="text-base font-bold text-slate-800">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      )}
    </div>

    {action}
  </div>
);

const MetricCard = ({
  icon: Icon,
  label,
  value,
  description,
  accent,
}) => (
  <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
    >
      <Icon size={21} />
    </div>

    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold leading-none text-slate-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 truncate text-xs text-slate-400">
          {description}
        </p>
      )}
    </div>
  </div>
);

const ModalHeader = ({
  eyebrow,
  title,
  description,
  onClose,
}) => (
  <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-5 text-white">
    <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
    <div className="pointer-events-none absolute -right-2 -top-10 h-36 w-36 rounded-full border border-white/10" />

    <div className="relative flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">
            {eyebrow}
          </p>
        )}

        <h2 className="text-xl font-bold text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-300">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        <X size={18} />
      </button>
    </div>
  </div>
);

const ModalShell = ({
  children,
  onClose,
  eyebrow,
  title,
  description,
  maxWidth = "max-w-3xl",
}) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`my-auto w-full ${maxWidth} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
    >
      <ModalHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        onClose={onClose}
      />

      {children}
    </div>
  </div>
);

const BugBadge = ({ value, styles, fallback }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
      styles[value] || fallback
    }`}
  >
    {value || "Unknown"}
  </span>
);

export default function Bugs() {
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bugs, setBugs] = useState([]);

  const [projectId, setProjectId] = useState("");
  const [moduleId, setModuleId] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingBug, setEditingBug] = useState(null);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingBugs, setLoadingBugs] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const selectedProject = projects.find(
    (item) => getId(item) === projectId,
  );

  const selectedModule = modules.find(
    (item) => getModuleId(item) === String(moduleId),
  );

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const projectOptions = useMemo(
    () =>
      projects.map((item) => ({
        value: getId(item),
        label:
          item.name ??
          item.projectName ??
          `Project ${getId(item)}`,
      })),
    [projects],
  );

  const moduleOptions = useMemo(
    () =>
      modules.map((item) => ({
        value: getModuleId(item),
        label:
          item.name ??
          item.title ??
          `Module ${getModuleId(item)}`,
      })),
    [modules],
  );

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: getId(employee),
        label: getEmployeeName(employee),
      })),
    [employees],
  );

  const visibleBugs = useMemo(
    () =>
      bugs.filter(
        (bug) =>
          !moduleId ||
          String(bug.moduleId ?? bug.module_id ?? "") ===
            String(moduleId),
      ),
    [bugs, moduleId],
  );

  const bugStats = useMemo(() => {
    const total = visibleBugs.length;

    const open = visibleBugs.filter(
      (bug) => bug.status === "Open",
    ).length;

    const inProgress = visibleBugs.filter(
      (bug) => bug.status === "In Progress",
    ).length;

    const fixedClosed = visibleBugs.filter(
      (bug) => ["Fixed", "Closed"].includes(bug.status),
    ).length;

    const critical = visibleBugs.filter(
      (bug) => bug.severity === "Critical",
    ).length;

    const unassigned = visibleBugs.filter(
      (bug) => !bug.assignedTo,
    ).length;

    return {
      total,
      open,
      inProgress,
      fixedClosed,
      critical,
      unassigned,
    };
  }, [visibleBugs]);

  const getAssigneeName = useCallback(
    (bug) => {
      if (!bug.assignedTo) return "Unassigned";

      const employee = employees.find(
        (item) => getId(item) === String(bug.assignedTo),
      );

      return employee
        ? getEmployeeName(employee)
        : `Employee #${bug.assignedTo}`;
    },
    [employees],
  );

  const fetchBugs = useCallback(async () => {
    if (!projectId) {
      setBugs([]);
      setLoadingBugs(false);
      return;
    }

    setLoadingBugs(true);

    try {
      const response = await axios.get(
        API.projectBugs(projectId, moduleId),
        {
          withCredentials: true,
        },
      );

      const list = getList(response, "bugs").map(normalizeBug);

      setBugs(list);
    } catch (error) {
      setBugs([]);

      showToast.error(
        error.response?.data?.message ||
          "Failed to load project bugs.",
      );
    } finally {
      setLoadingBugs(false);
      setRefreshing(false);
    }
  }, [projectId, moduleId]);

  // Initial project loading.
  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);

      try {
        const response = await axios.get(API.projects, {
          withCredentials: true,
        });

        if (active) {
          const list = getList(response, "projects");

          setProjects(list);
          setProjectId(list[0] ? getId(list[0]) : "");
        }
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message ||
              "Failed to load projects.",
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

  // Load modules when the selected project changes.
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
        const response = await axios.get(
          API.modules(projectId),
          { withCredentials: true },
        );

        if (active) {
          setModules(getList(response, "modules"));
        }
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message ||
              "Failed to load modules.",
          );
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

  // Load developers available for bug assignment.
  useEffect(() => {
    let active = true;

    const fetchEmployees = async () => {
      setLoadingEmployees(true);

      try {
        const response = await axios.get(API.employees, {
          withCredentials: true,
        });

        if (active) {
          setEmployees(getList(response, "employees"));
        }
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message ||
              "Failed to load developers.",
          );
        }
      } finally {
        if (active) setLoadingEmployees(false);
      }
    };

    fetchEmployees();

    return () => {
      active = false;
    };
  }, []);

  // Reload bugs whenever project or module selection changes.
  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  // Close the modal with Escape.
  useEffect(() => {
    if (!showForm) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        setShowForm(false);
        resetForm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showForm, saving]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingBug(null);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (bug) => {
    setEditingBug(bug);

    setForm({
      title: bug.title ?? "",
      description: bug.description ?? "",
      severity: bug.severity ?? "Medium",
      status: bug.status ?? "Open",
      discoverySource: bug.discoverySource ?? "Client",
      assignedTo:
        bug.assignedTo == null || bug.assignedTo === ""
          ? ""
          : String(bug.assignedTo),
    });

    setModuleId(
      bug.moduleId == null
        ? ""
        : String(bug.moduleId),
    );

    setShowForm(true);
  };

  const handleSaveBug = async (event) => {
    event.preventDefault();

    if (!projectId || !form.title.trim()) {
      showToast.error(
        "Select a project and enter a bug title.",
      );
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      severity: form.severity,
      status: form.status,
      discoverySource: form.discoverySource,
      assignedTo: form.assignedTo
        ? Number(form.assignedTo)
        : null,
      // The existing API expects the internal module database ID.
      moduleId: moduleId ? Number(moduleId) : null,
    };

    setSaving(true);

    try {
      if (editingBug) {
        await axios.patch(
          API.bug(projectId, editingBug.uuid),
          payload,
          {
            withCredentials: true,
          },
        );

        showToast.success("Bug updated successfully.");
      } else {
        await axios.post(
          API.createBug,
          {
            ...payload,
            projectId,
          },
          {
            withCredentials: true,
          },
        );

        showToast.success("Bug reported successfully.");
      }

      setShowForm(false);
      resetForm();

      await fetchBugs();
    } catch (error) {
      showToast.error(
        error.response?.data?.message ||
          (editingBug
            ? "Failed to update bug."
            : "Failed to report bug."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (!projectId || loadingBugs) return;

    setRefreshing(true);
    await fetchBugs();
  };

  const handleProjectChange = (value) => {
    setProjectId(value);
    setModuleId("");
    setShowForm(false);
    resetForm();
  };

  const handleModuleChange = (value) => {
    setModuleId(value);
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">

      {/* PAGE HEADER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-6 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-24 top-10 h-32 w-32 rounded-full border border-white/10" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-300" />

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                Project Management Workspace
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Bug Reporting
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Review reported issues, track severity, manage bug
              status and assign developers across your projects.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5">
                Project Lead
              </span>

              <span className="text-slate-500">/</span>

              <span>Bug Reporting</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">
                Reported Bugs
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                {bugStats.total}
              </p>
            </div>

            <button
              type="button"
              onClick={startCreate}
              disabled={!projectId || loadingProjects}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#101a3a] shadow-lg transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-[#101a3a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Report Bug
            </button>
          </div>
        </div>
      </section>

      {/* BUG OVERVIEW */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Bug}
          label="Total Bugs"
          value={bugStats.total}
          description="In current project selection"
          accent="bg-blue-50 text-blue-700"
        />

        <MetricCard
          icon={AlertCircle}
          label="Open"
          value={bugStats.open}
          description="Awaiting action"
          accent="bg-red-50 text-red-700"
        />

        <MetricCard
          icon={Clock3}
          label="In Progress"
          value={bugStats.inProgress}
          description="Currently being addressed"
          accent="bg-amber-50 text-amber-700"
        />

        <MetricCard
          icon={CheckCircle2}
          label="Fixed / Closed"
          value={bugStats.fixedClosed}
          description="Resolved or closed issues"
          accent="bg-emerald-50 text-emerald-700"
        />
      </section>

      {/* ADDITIONAL ISSUE INDICATORS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShieldAlert size={19} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">
                Critical Severity
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Issues requiring priority attention
              </p>
            </div>
          </div>

          <p className="shrink-0 text-2xl font-bold text-red-600">
            {bugStats.critical}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Users size={19} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">
                Unassigned Bugs
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Issues without a developer assignment
              </p>
            </div>
          </div>

          <p className="shrink-0 text-2xl font-bold text-amber-600">
            {bugStats.unassigned}
          </p>
        </div>
      </section>

      {/* PROJECT AND MODULE FILTERS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="Workspace Filters"
          title="Project & Module Selection"
          description="Choose a project and optionally narrow the bug list to a specific module."
          action={
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!projectId || loadingBugs}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  loadingBugs || refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          }
        />

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Select
              label="Project"
              name="projectId"
              required
              value={projectId}
              options={projectOptions}
              placeholder={
                loadingProjects
                  ? "Loading projects..."
                  : "Select project"
              }
              disabled={loadingProjects}
              onChange={(event) =>
                handleProjectChange(event.target.value)
              }
            />
          </div>

          <div className="min-w-0">
            <Select
              label="Module (Optional)"
              name="moduleId"
              value={moduleId}
              options={moduleOptions}
              placeholder={
                loadingModules
                  ? "Loading modules..."
                  : "All modules"
              }
              disabled={!projectId || loadingModules}
              onChange={(event) =>
                handleModuleChange(event.target.value)
              }
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Viewing
          </span>

          <span className="inline-flex max-w-full items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {selectedProject?.name ??
              selectedProject?.projectName ??
              "No project selected"}
          </span>

          <span className="text-slate-300">/</span>

          <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {selectedModule?.name ??
              selectedModule?.title ??
              "All modules"}
          </span>
        </div>

        {loadingProjects && (
          <p className="mt-3 text-xs text-slate-400">
            Loading assigned projects...
          </p>
        )}

        {!loadingProjects && !projects.length && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No assigned projects are available. Select an assigned
            project to manage its reported bugs.
          </div>
        )}

        {!loadingModules &&
          projectId &&
          !modules.length && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No modules are available for this project. You can
              still view project-level bugs.
            </div>
          )}
      </section>

      {/* BUG LIST */}
      <section className="flex min-w-0 flex-col gap-4">
        <SectionHeading
          eyebrow="Issue Tracking"
          title="Reported Bugs"
          description={
            loadingBugs
              ? "Retrieving reported issues..."
              : `${visibleBugs.length} bug(s) in the current selection.`
          }
          action={
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {visibleBugs.length} Records
            </span>
          }
        />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Bug size={19} />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800">
                  Bug Register
                </h3>

                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {selectedProject?.name ??
                    selectedProject?.projectName ??
                    "Select a project"}
                  {selectedModule
                    ? ` / ${selectedModule.name ?? selectedModule.title}`
                    : " / All modules"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startCreate}
              disabled={!projectId || loadingProjects}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} />
              Add Bug
            </button>
          </div>

          {loadingBugs ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <RefreshCw size={21} className="animate-spin" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading project bugs
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Fetching the latest reported issues...
              </p>
            </div>
          ) : !projectId ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Filter size={25} />
              </div>

              <p className="mt-4 font-semibold text-slate-700">
                Select a project
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Choose a project to fetch its reported bugs.
              </p>
            </div>
          ) : visibleBugs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Bug size={25} />
              </div>

              <p className="mt-4 font-semibold text-slate-700">
                No bugs found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                There are no bugs for this project or module yet.
              </p>

              <button
                type="button"
                onClick={startCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#111b3c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b2b58]"
              >
                <Plus size={15} />
                Report First Bug
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleBugs.map((bug) => (
                <article
                  key={bug.uuid ?? bug.id}
                  className="space-y-4 p-5 transition-colors hover:bg-slate-50/70 sm:p-6"
                >
                  {/* BUG TITLE AND STATUS */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <Bug size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold text-slate-800">
                          {bug.title}
                        </h3>

                        <p className="mt-1 text-xs font-medium tracking-wide text-slate-400">
                          BUG-{String(
                            bug.uuid ?? bug.id,
                          ).padStart(4, "0")}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <BugBadge
                        value={bug.severity || "Medium"}
                        styles={SEVERITY_STYLES}
                        fallback="bg-slate-100 text-slate-600"
                      />

                      <BugBadge
                        value={bug.status || "Open"}
                        styles={STATUS_STYLES}
                        fallback="bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                      />
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  {bug.description && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:ml-[52px]">
                      <div className="mb-2 flex items-center gap-2">
                        <FileText
                          size={14}
                          className="text-slate-400"
                        />

                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Description
                        </span>
                      </div>

                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {bug.description}
                      </p>
                    </div>
                  )}

                  {/* BUG METADATA */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500 sm:ml-[52px]">
                    <span className="inline-flex items-center gap-1.5">
                      <Users
                        size={14}
                        className="text-slate-400"
                      />
                      <span className="font-medium text-slate-400">
                        Assigned:
                      </span>
                      <span className="font-semibold text-slate-600">
                        {getAssigneeName(bug)}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays
                        size={14}
                        className="text-slate-400"
                      />
                      <span className="font-medium text-slate-400">
                        Reported:
                      </span>
                      <span className="font-semibold text-slate-600">
                        {formatDate(bug.createdAt)}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <FileText
                        size={14}
                        className="text-slate-400"
                      />
                      <span className="font-medium text-slate-400">
                        Source:
                      </span>
                      <span className="font-semibold text-slate-600">
                        {bug.discoverySource || "Client"}
                      </span>
                    </span>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:ml-[52px]">
                    <div className="flex flex-wrap items-center gap-2">
                      {bug.status === "Open" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Requires attention
                        </span>
                      )}

                      {bug.status === "Fixed" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2 size={13} />
                          Fixed
                        </span>
                      )}

                      {bug.status === "Ready for Retest" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600">
                          <RefreshCw size={13} />
                          Awaiting retest
                        </span>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => startEdit(bug)}
                      disabled={saving}
                    >
                      <span className="flex items-center gap-2">
                        <Edit3 size={15} />
                        Edit / Assign
                      </span>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CREATE / EDIT BUG MODAL */}
      {showForm && (
        <ModalShell
          eyebrow="Bug Management"
          title={
            editingBug
              ? "Edit Reported Bug"
              : "Report a New Bug"
          }
          description={
            editingBug
              ? "Update issue details, workflow status and developer assignment."
              : "Record a project issue and provide the information needed for investigation."
          }
          onClose={closeForm}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleSaveBug}>
            <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">

              {/* ISSUE INFORMATION */}
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Bug size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Issue Information
                    </h3>

                    <p className="text-xs text-slate-400">
                      Describe the issue and its discovery context.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0 md:col-span-2">
                    <Input
                      label="Bug Title"
                      name="title"
                      required
                      value={form.title}
                      onChange={(event) =>
                        updateForm("title", event.target.value)
                      }
                      placeholder="e.g. Login fails with valid credentials"
                    />
                  </div>

                  <div className="min-w-0">
                    <Select
                      label="Severity"
                      name="severity"
                      required
                      value={form.severity}
                      options={SEVERITIES.map((value) => ({
                        value,
                        label: value,
                      }))}
                      onChange={(event) =>
                        updateForm("severity", event.target.value)
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <Select
                      label="Discovery Source"
                      name="discoverySource"
                      value={form.discoverySource}
                      options={[
                        ...new Set([
                          form.discoverySource,
                          ...DISCOVERY_SOURCES,
                        ]),
                      ].map((value) => ({
                        value,
                        label: value,
                      }))}
                      onChange={(event) =>
                        updateForm(
                          "discoverySource",
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="min-w-0 md:col-span-2">
                    <Textarea
                      label="Description"
                      name="description"
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      placeholder="Describe the issue, steps to reproduce, and expected behavior..."
                    />
                  </div>
                </div>
              </div>

              {/* WORKFLOW AND ASSIGNMENT */}
              <div>
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Users size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Workflow & Assignment
                    </h3>

                    <p className="text-xs text-slate-400">
                      Set the current issue status and responsible developer.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0">
                    <Select
                      label="Status"
                      name="status"
                      required
                      value={form.status}
                      options={STATUSES.map((value) => ({
                        value,
                        label: value,
                      }))}
                      onChange={(event) =>
                        updateForm("status", event.target.value)
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <Select
                      label="Assign Developer (Optional)"
                      name="assignedTo"
                      value={form.assignedTo}
                      options={employeeOptions}
                      placeholder={
                        loadingEmployees
                          ? "Loading developers..."
                          : "Unassigned"
                      }
                      disabled={loadingEmployees}
                      onChange={(event) =>
                        updateForm(
                          "assignedTo",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                {loadingEmployees && (
                  <p className="mt-2 text-xs text-slate-400">
                    Loading available developers...
                  </p>
                )}

                {!loadingEmployees && !employees.length && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    No developers are currently available for assignment.
                    The bug can still be reported as unassigned.
                  </div>
                )}
              </div>

              {/* SELECTED PROJECT CONTEXT */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Filter
                    size={15}
                    className="text-slate-500"
                  />

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Report Context
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      Project
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                      {selectedProject?.name ??
                        selectedProject?.projectName ??
                        "No project selected"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      Module
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                      {selectedModule?.name ??
                        selectedModule?.title ??
                        "All modules"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
              <p className="text-xs text-slate-400">
                <span className="text-red-500">*</span> Required fields
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Reset
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={saving || !projectId}
                >
                  <span className="flex items-center gap-2">
                    <Save size={16} />

                    {saving
                      ? "Saving..."
                      : editingBug
                        ? "Save Changes"
                        : "Submit Bug"}
                  </span>
                </Button>
              </div>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}