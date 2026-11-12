import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  X,
} from "lucide-react";

import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { showToast } from "../../components/common/Toast";

// API response helper.
const getList = (response, key) => {
  const payload = response?.data?.data ?? response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];

  return [];
};

const normalizeProject = (project) => ({
  ...project,
  id: String(project.uuid ?? project.projectId),
  name:
    project.name ??
    project.projectName ??
    project.project_name ??
    `Project ${project.uuid ?? project.projectId}`,
});

const normalizeModule = (module) => ({
  ...module,
  id: String(module.uuid ?? module.moduleId ?? module.module_id),
  name:
    module.name ??
    module.moduleName ??
    module.module_name ??
    `Module ${module.uuid ?? module.moduleId ?? module.module_id}`,
});

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

// What a tester may change a bug's status to (same rules as the backend):
// a fix waiting for retest → Closed (passed) / Reopened (failed, back to the
// project lead); a new Open bug → Rejected (withdrawn).
const TESTER_TRANSITIONS = {
  "Ready for Retest": ["Closed", "Reopened"],
  Open: ["Rejected"],
};

// New bugs always start as Open; when editing: current status + allowed moves
const testerStatusOptions = (isEditing, currentStatus) => {
  const values = isEditing
    ? [currentStatus, ...(TESTER_TRANSITIONS[currentStatus] || [])]
    : ["Open"];

  return values.filter(Boolean).map((value) => ({ value, label: value }));
};

const DISCOVERY_SOURCES = [
  "Client",
  "Testing",
  "Development",
  "Code Review",
  "Production",
  "Retesting",
];

const initialBugs = [];

const emptyForm = {
  projectId: "",
  moduleId: "",
  title: "",
  description: "",
  severity: "Medium",
  status: "Open",
  discoverySource: "Testing",
};

const getProjectName = (projects, projectId) =>
  projects.find((project) => String(project.uuid) === String(projectId))
    ?.name || `Project ${projectId || "—"}`;

const getModuleName = (modulesByProject, projectId, moduleId) =>
  (modulesByProject[String(projectId)] || []).find(
    (module) => String(module.uuid) === String(moduleId),
  )?.name || "No module";

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

const severityTone = {
  Low: "success",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

const statusTone = {
  Open: "danger",
  Assigned: "info",
  "In Progress": "warning",
  Fixed: "success",
  "Ready for Retest": "info",
  Reopened: "warning",
  Closed: "success",
  Rejected: "secondary",
};

function FieldError({ children }) {
  if (!children) return null;

  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}

function ModalHeader({ eyebrow, title, description, onClose }) {
  return (
    <div className="relative overflow-hidden rounded-t-[22px] bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-6 sm:px-8">
      <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 -top-10 h-36 w-36 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute right-12 top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
            {eyebrow}
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
            {title}
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>

        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="shrink-0 rounded-xl border border-white/15 bg-white/10 p-2 text-slate-200 transition hover:bg-white/20 hover:text-white"
        >
          <X size={19} />
        </button>
      </div>
    </div>
  );
}

export default function Bugs() {
  const [bugs, setBugs] = useState(initialBugs);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");

  const [createModules, setCreateModules] = useState([]);
  const [editModules, setEditModules] = useState([]);
  const [createModulesLoading, setCreateModulesLoading] = useState(false);
  const [editModulesLoading, setEditModulesLoading] = useState(false);
  const [modulesByProject, setModulesByProject] = useState({});

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const [editingBug, setEditingBug] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectId, setProjectId] = useState("");

  // Fetch tester bugs.
  const getBugs = async () => {
    try {
      const res = await axios.get("/api/bugs/tester/bugs", {
        withCredentials: true,
      });

      if (res.status === 200) {
        const list = getList(res, "bugs").map((bug) => ({
          ...bug,
          projectId: String(bug.projectId ?? bug.project?.uuid ?? ""),
          moduleId: bug.moduleId == null ? "" : String(bug.moduleId),
          projectName: bug.project?.name ?? "",
          moduleName: bug.module?.name ?? "",
          assignedTo: bug.assignedTo ?? "",
          fixNotes: bug.fixNotes ?? "",
        }));

        setBugs(list);
      }
    } catch (error) {
      showToast.error(
        error?.response?.data?.message || "Failed to fetch bugs.",
      );
    }
  };

  useEffect(() => {
    getBugs();
  }, []);

  // Load projects.
  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      setProjectsLoading(true);
      setProjectsError("");

      try {
        const response = await axios.get("/api/bugs/projects-dropdown", {
          withCredentials: true,
        });

        if (!active) return;

        const list = getList(response, "projects").map(normalizeProject);

        setProjectId(list[0]?.id || "");
        setProjects(list);

        if (list.length === 0) {
          setProjectsError("No projects are available for your account.");
        }
      } catch (error) {
        if (!active) return;

        const message =
          error?.response?.data?.message || "Failed to load projects.";

        setProjectsError(message);
        showToast.error(message);
      } finally {
        if (active) setProjectsLoading(false);
      }
    };

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  // Load modules when the create-form project changes.
  useEffect(() => {
    let active = true;

    setCreateModules([]);

    if (!form.projectId) {
      setCreateModulesLoading(false);

      return () => {
        active = false;
      };
    }

    const loadModules = async () => {
      setCreateModulesLoading(true);

      try {
        const response = await axios.get(
          `/api/projects/${encodeURIComponent(form.projectId)}/modules`,
          { withCredentials: true },
        );

        if (!active) return;

        const list = getList(response, "modules").map(normalizeModule);

        setCreateModules(list);

        setModulesByProject((current) => ({
          ...current,
          [String(form.projectId)]: list,
        }));
      } catch (error) {
        if (!active) return;

        setCreateModules([]);

        showToast.error(
          error?.response?.data?.message || "Failed to load project modules.",
        );
      } finally {
        if (active) setCreateModulesLoading(false);
      }
    };

    loadModules();

    return () => {
      active = false;
    };
  }, [form.projectId]);

  // Load modules when the edit-form project changes.
  useEffect(() => {
    let active = true;

    setEditModules([]);

    if (!editForm?.projectId) {
      setEditModulesLoading(false);

      return () => {
        active = false;
      };
    }

    const loadModules = async () => {
      setEditModulesLoading(true);

      try {
        const response = await axios.get(
          `/api/projects/${encodeURIComponent(editForm.projectId)}/modules`,
          { withCredentials: true },
        );

        if (!active) return;

        const list = getList(response, "modules").map(normalizeModule);

        setEditModules(list);

        setModulesByProject((current) => ({
          ...current,
          [String(editForm.projectId)]: list,
        }));
      } catch (error) {
        if (!active) return;

        setEditModules([]);

        showToast.error(
          error?.response?.data?.message || "Failed to load project modules.",
        );
      } finally {
        if (active) setEditModulesLoading(false);
      }
    };

    loadModules();

    return () => {
      active = false;
    };
  }, [editForm?.projectId]);

  // Filter bugs.
  const visibleBugs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bugs.filter((bug) => {
      const matchesProject =
        !filterProjectId || String(bug.projectId) === filterProjectId;

      const matchesStatus = !filterStatus || bug.status === filterStatus;

      const matchesSearch =
        !query ||
        [bug.title, bug.description, bug.severity, bug.status, bug.id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesProject && matchesStatus && matchesSearch;
    });
  }, [bugs, filterProjectId, filterStatus, search]);

  // Dashboard metrics.
  const stats = useMemo(
    () => [
      { label: "Total bugs", value: bugs.length, icon: Bug },
      {
        label: "Open",
        value: bugs.filter((bug) => bug.status === "Open").length,
        icon: AlertCircle,
      },
      {
        label: "In progress",
        value: bugs.filter((bug) => bug.status === "In Progress").length,
        icon: Clock3,
      },
      {
        label: "Fixed",
        value: bugs.filter((bug) => bug.status === "Fixed").length,
        icon: CheckCircle2,
      },
    ],
    [bugs],
  );

  // Validation.
  const validateBug = (values, availableModules = []) => {
    const nextErrors = {};

    if (!values.projectId) {
      nextErrors.projectId = "Please select a project.";
    }

    if (!values.title.trim()) {
      nextErrors.title = "Bug title is required.";
    } else if (values.title.trim().length > 255) {
      nextErrors.title = "Title must be 255 characters or fewer.";
    }

    if (values.description.trim().length > 5000) {
      nextErrors.description =
        "Description must be 5000 characters or fewer.";
    }

    if (!SEVERITIES.includes(values.severity)) {
      nextErrors.severity = "Select a valid severity.";
    }

    if (!STATUSES.includes(values.status)) {
      nextErrors.status = "Select a valid status.";
    }

    if (!DISCOVERY_SOURCES.includes(values.discoverySource)) {
      nextErrors.discoverySource = "Select a valid discovery source.";
    }

    if (
      values.moduleId &&
      !availableModules.some(
        (module) => String(module.uuid) === String(values.moduleId),
      )
    ) {
      nextErrors.moduleId =
        "Select a module belonging to the chosen project.";
    }

    return nextErrors;
  };

  const handleCreateChange = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "projectId") {
        next.moduleId = "";
      }

      return next;
    });

    setErrors((current) => ({ ...current, [name]: undefined }));

    if (name === "projectId") {
      setErrors((current) => ({
        ...current,
        projectId: undefined,
        moduleId: undefined,
      }));
    }
  };

  const closeCreateForm = () => {
    setForm(emptyForm);
    setErrors({});
    setShowCreateForm(false);
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setErrors({});
    setShowCreateForm(true);
  };

  // Create a bug through the existing API.
  const handleCreateBug = async (event) => {
    event.preventDefault();

    const validationErrors = validateBug(form, createModules);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      showToast.error("Please correct the highlighted fields.");
      return;
    }

    const payload = {
      ...form,
      projectId: form.projectId,
      moduleId: form.moduleId || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
    };

    try {
      const res = await axios.post("/api/bugs/createByTester", payload, {
        withCredentials: true,
      });

      if (res.status === 200 || res.status === 201) {
        setForm(emptyForm);
        setErrors({});
        setShowCreateForm(false);

        await getBugs();

        showToast.success(
          res.data?.message || "Bug reported successfully.",
        );
      }
    } catch (error) {
      showToast.error(
        error?.response?.data?.message || "Failed to report bug.",
      );
    }
  };

  // Open edit dialog.
  const openEdit = (bug) => {
    setEditingBug(bug);

    setEditForm({
      projectId: String(
        bug.project?.uuid ?? bug.projectId ?? "",
      ),
      moduleId:
        bug.module?.uuid != null
          ? String(bug.module.uuid)
          : bug.moduleId != null
            ? String(bug.moduleId)
            : "",
      title: bug.title || "",
      description: bug.description || "",
      severity: bug.severity || "Medium",
      status: bug.status || "Open",
      discoverySource: bug.discoverySource || "Testing",
      fixNotes: bug.fixNotes || "",
    });

    setEditErrors({});
  };

  const closeEditForm = () => {
    setEditingBug(null);
    setEditForm(null);
    setEditErrors({});
  };

  const handleEditChange = (name, value) => {
    setEditForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "projectId") {
        next.moduleId = "";
      }

      return next;
    });

    setEditErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    if (name === "projectId") {
      setEditErrors((current) => ({
        ...current,
        projectId: undefined,
        moduleId: undefined,
      }));
    }
  };

  // Update bug through the existing API.
  const handleUpdateBug = async (event) => {
    event.preventDefault();

    if (!editingBug || !editForm) return;

    const validationErrors = validateBug(editForm, editModules);

    setEditErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      showToast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      const res = await axios.patch(
        `/api/bugs/tester/bugs/${editingBug.uuid}`,
        editForm,
        { withCredentials: true },
      );

      if (res.status === 200 || res.status === 201) {
        closeEditForm();
        await getBugs();

        showToast.success("Bug updated successfully.");
      }
    } catch (error) {
      showToast.error(
        error?.response?.data?.message || "Failed to update bug.",
      );
    }
  };

  // Shared create/edit form fields.
  const renderBugForm = ({
    values,
    fieldErrors,
    onChange,
    modules,
    isEditing = false,
  }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <Select
          label="Project *"
          name="projectId"
          value={values.projectId}
          options={projects.map((project) => ({
            value: String(project.uuid),
            label: project.name,
          }))}
          placeholder={
            projectsLoading
              ? "Loading projects..."
              : projects.length
                ? "Select project"
                : "No projects available"
          }
          disabled={projectsLoading || projects.length === 0}
          onChange={(event) => {
            onChange("projectId", event.target.value);
            setProjectId(event.target.value);
          }}
        />

        <FieldError>
          {fieldErrors.projectId || projectsError}
        </FieldError>
      </div>

      <div>
        <Select
          label="Module"
          name="moduleId"
          value={values.moduleId}
          options={modules.map((module) => ({
            value: String(module.uuid),
            label: module.name,
          }))}
          placeholder={
            !values.projectId
              ? "Select project first"
              : (isEditing ? editModulesLoading : createModulesLoading)
                ? "Loading modules..."
                : modules.length
                  ? "Select module (optional)"
                  : "No modules available"
          }
          disabled={
            !values.projectId ||
            (isEditing ? editModulesLoading : createModulesLoading)
          }
          onChange={(event) => onChange("moduleId", event.target.value)}
        />

        <FieldError>{fieldErrors.moduleId}</FieldError>
      </div>

      <div className="md:col-span-2">
        <Input
          label="Bug title *"
          name="title"
          value={values.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Describe the issue in one line"
          maxLength={255}
        />

        <FieldError>{fieldErrors.title}</FieldError>
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-cm-text">
          Description
        </label>

        <textarea
          name="description"
          rows={4}
          maxLength={5000}
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Steps to reproduce, expected result, actual result..."
          className="w-full rounded-cm-lg border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text outline-none focus:border-cm-primary"
        />

        <div className="mt-1 flex justify-between gap-2">
          <FieldError>{fieldErrors.description}</FieldError>

          <span className="text-xs text-cm-text-muted">
            {values.description.length}/5000
          </span>
        </div>
      </div>

      <div>
        <Select
          label="Severity *"
          name="severity"
          value={values.severity}
          options={SEVERITIES.map((value) => ({
            value,
            label: value,
          }))}
          onChange={(event) => onChange("severity", event.target.value)}
        />

        <FieldError>{fieldErrors.severity}</FieldError>
      </div>

      <div>
        <Select
          label="Status *"
          name="status"
          value={values.status}
          options={testerStatusOptions(isEditing, editingBug?.status)}
          onChange={(event) => onChange("status", event.target.value)}
        />

        <FieldError>{fieldErrors.status}</FieldError>
      </div>

      <div className="md:col-span-2">
        <Select
          label="Discovery source *"
          name="discoverySource"
          value={values.discoverySource}
          options={DISCOVERY_SOURCES.map((value) => ({
            value,
            label: value,
          }))}
          onChange={(event) =>
            onChange("discoverySource", event.target.value)
          }
        />

        <FieldError>{fieldErrors.discoverySource}</FieldError>
      </div>

      {isEditing && (
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-cm-text">
            Fix notes
          </label>

          <textarea
            rows={3}
            value={values.fixNotes}
            onChange={(event) => onChange("fixNotes", event.target.value)}
            placeholder="Add implementation/fix notes (optional)"
            className="w-full rounded-cm-lg border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text outline-none focus:border-cm-primary"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-4 -top-12 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-16 top-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Tester Workspace
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Bug Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Report defects, track their status, and manage issues across
              your assigned projects.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-200">
                {bugs.length} Total Reports
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-200">
                {visibleBugs.length} Currently Displayed
              </span>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center">
            <Button type="button" onClick={openCreateForm}>
              <span className="flex items-center gap-2">
                <Plus size={17} />
                Report a bug
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
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

      {/* Filters */}
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-cm-text">Filter reports</h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            Narrow down reported bugs by project, status, or keyword.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Filter by project"
            value={filterProjectId}
            options={projects.map((project) => ({
              value: String(project.uuid),
              label: project.name,
            }))}
            placeholder={
              projectsLoading ? "Loading projects..." : "All projects"
            }
            disabled={projectsLoading}
            onChange={(event) => setFilterProjectId(event.target.value)}
          />

          <Select
            label="Filter by status"
            value={filterStatus}
            options={STATUSES.map((value) => ({
              value,
              label: value,
            }))}
            placeholder="All statuses"
            onChange={(event) => setFilterStatus(event.target.value)}
          />

          <Input
            label="Search bugs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title or description..."
          />
        </div>
      </section>

      {/* Bug list */}
      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cm-border p-5">
          <div>
            <h2 className="font-semibold text-cm-text">Reported bugs</h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              Review bug details and edit records as needed.
            </p>
          </div>

          <span className="rounded-full bg-cm-bg px-3 py-1 text-sm text-cm-text-muted">
            {visibleBugs.length}{" "}
            {visibleBugs.length === 1 ? "bug" : "bugs"}
          </span>
        </div>

        {visibleBugs.length === 0 ? (
          <div className="p-10 text-center">
            <Bug size={32} className="mx-auto text-cm-text-muted" />

            <p className="mt-3 font-medium text-cm-text">No bugs found</p>

            <p className="mt-1 text-sm text-cm-text-muted">
              Change your filters or report a new bug.
            </p>

            <div className="mt-4">
              <Button type="button" onClick={openCreateForm}>
                <span className="flex items-center gap-2">
                  <Plus size={16} />
                  Report a bug
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-cm-border">
            {visibleBugs.map((bug) => (
              <article
                key={bug.uuid || bug.id}
                className="space-y-3 p-5 transition-colors hover:bg-cm-bg/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-1 rounded-lg bg-red-50 p-2 text-red-600">
                      <Bug size={18} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-cm-text">
                        {bug.title}
                      </h3>

                      <p className="mt-1 break-all text-xs text-cm-text-muted">
                        BUG-{String(bug.id).padStart(3, "0")} · {bug.uuid}
                      </p>

                      <p className="mt-1 text-sm text-cm-text-muted">
                        {bug.projectName ||
                          getProjectName(projects, bug.projectId)}{" "}
                        /{" "}
                        {bug.moduleName ||
                          getModuleName(
                            modulesByProject,
                            bug.projectId,
                            bug.moduleId,
                          )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityTone[bug.severity] || "info"}>
                      {bug.severity}
                    </Badge>

                    <Badge variant={statusTone[bug.status] || "secondary"}>
                      {bug.status}
                    </Badge>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => openEdit(bug)}
                    >
                      <span className="flex items-center gap-2">
                        <Edit3 size={15} />
                        Edit
                      </span>
                    </Button>
                  </div>
                </div>

                {bug.description && (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-cm-text-muted md:pl-11">
                    {bug.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-cm-text-muted md:pl-11">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={13} />
                    Reported {formatDate(bug.createdAt)}
                  </span>

                  <span>Source: {bug.discoverySource}</span>

                  {bug.assignedTo && (
                    <span>Assigned to: {bug.assignedTo}</span>
                  )}

                  {bug.fixNotes && <span>Fix notes: {bug.fixNotes}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Create bug modal */}
      {showCreateForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateForm();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-bug-title"
            className="my-auto w-full max-w-3xl overflow-hidden rounded-[22px] border border-slate-200 bg-cm-card shadow-[0_25px_80px_rgba(0,0,0,0.35)]"
          >
            <ModalHeader
              eyebrow="Issue Reporting"
              title="Report a new bug"
              description="Provide the project, issue details, severity, and discovery source to submit a bug report."
              onClose={closeCreateForm}
            />

            <form onSubmit={handleCreateBug} noValidate>
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <AlertCircle size={17} className="shrink-0" />
                  Fields marked * are required.
                </div>

                {renderBugForm({
                  values: form,
                  fieldErrors: errors,
                  onChange: handleCreateChange,
                  modules: createModules,
                })}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-cm-border bg-cm-bg/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeCreateForm}
                >
                  Cancel
                </Button>

                <Button type="submit">
                  <span className="flex items-center justify-center gap-2">
                    <Plus size={16} />
                    Submit bug report
                  </span>
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Edit bug modal */}
      {editingBug && editForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditForm();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-bug-title"
            className="my-auto w-full max-w-3xl overflow-hidden rounded-[22px] border border-slate-200 bg-cm-card shadow-[0_25px_80px_rgba(0,0,0,0.35)]"
          >
            <ModalHeader
              eyebrow="Issue Management"
              title={`Edit BUG-${String(editingBug.id).padStart(3, "0")}`}
              description="Update the bug details, classification fields, and current status."
              onClose={closeEditForm}
            />

            <form onSubmit={handleUpdateBug} noValidate>
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-5 sm:p-7">
                {renderBugForm({
                  values: editForm,
                  fieldErrors: editErrors,
                  onChange: handleEditChange,
                  modules: editModules,
                  isEditing: true,
                })}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-cm-border bg-cm-bg/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeEditForm}
                >
                  Cancel
                </Button>

                <Button type="submit">
                  Save changes
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
