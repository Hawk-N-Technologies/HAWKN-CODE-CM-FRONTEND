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

// API response helper: supports { data: [...] }, { data: { projects: [...] } },
// and direct arrays.
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
  // Load projects from the same dropdown endpoint used elsewhere in the app.
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
        console.log(response.data.data);
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

  // Load modules whenever the project selected in the create form changes.
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

  // Load modules for the selected bug's project while the edit dialog is open.
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

  const validateBug = (values, availableModules = []) => {
    const nextErrors = {};
    if (!values.projectId) nextErrors.projectId = "Please select a project.";
    if (!values.title.trim()) nextErrors.title = "Bug title is required.";
    else if (values.title.trim().length > 255)
      nextErrors.title = "Title must be 255 characters or fewer.";
    if (values.description.trim().length > 5000)
      nextErrors.description = "Description must be 5000 characters or fewer.";
    if (!SEVERITIES.includes(values.severity))
      nextErrors.severity = "Select a valid severity.";
    if (!STATUSES.includes(values.status))
      nextErrors.status = "Select a valid status.";
    if (!DISCOVERY_SOURCES.includes(values.discoverySource))
      nextErrors.discoverySource = "Select a valid discovery source.";
    if (
      values.moduleId &&
      !availableModules.some(
        (module) => String(module.uuid) === String(values.moduleId),
      )
    ) {
      nextErrors.moduleId = "Select a module belonging to the chosen project.";
    }
    return nextErrors;
  };

  const handleCreateChange = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "projectId") next.moduleId = "";
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (name === "projectId")
      setErrors((current) => ({
        ...current,
        projectId: undefined,
        moduleId: undefined,
      }));
  };

  // Dynamic create handler: creates a bug through the API, then reloads the list.
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
      projectId: Number(form.projectId),
      moduleId: form.moduleId ? Number(form.moduleId) : null,
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
        showToast.success(res.data?.message || "Bug reported successfully.");
      }
    } catch (error) {
      showToast.error(
        error?.response?.data?.message || "Failed to report bug.",
      );
    }
  };

  const openEdit = (bug) => {
    console.log(bug);
    setEditingBug(bug);
    setEditForm({
      projectId: String(bug.project.uuid ?? bug.project?.uuid ?? ""),
      moduleId: bug.module.uuid != null ? String(bug.module.uuid) : "",
      title: bug.title || "",
      description: bug.description || "",
      severity: bug.severity || "Medium",
      status: bug.status || "Open",
      discoverySource: bug.discoverySource || "Testing",
      fixNotes: bug.fixNotes || "",
    });
    setEditErrors({});
  };

  const handleEditChange = (name, value) => {
    setEditForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "projectId") next.moduleId = "";
      return next;
    });
    setEditErrors((current) => ({ ...current, [name]: undefined }));
    if (name === "projectId")
      setEditErrors((current) => ({
        ...current,
        projectId: undefined,
        moduleId: undefined,
      }));
  };

  // Static update handler: updates local React state only; no API request is made.
  const handleUpdateBug = async (event) => {
    event.preventDefault();
    if (!editingBug || !editForm) return;

    const validationErrors = validateBug(editForm, editModules);
    setEditErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      showToast.error("Please correct the highlighted fields.");
      return;
    }

    console.log(editingBug);

    try {
      const res = await axios.patch(
        `/api/bugs/tester/bugs/${editingBug.uuid}`,
        editForm,
        { withCredentials: true },
      );
      if (res.status == 200 || res.status == 201) {
        setEditingBug(null);
        setEditForm(null);
        getBugs();
        setEditErrors({});
        showToast.success("Bug updated  the server");
      }
    } catch (error) {
      console.log(error);
    }
  };

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
        <FieldError>{fieldErrors.projectId || projectsError}</FieldError>
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
          options={SEVERITIES.map((value) => ({ value, label: value }))}
          onChange={(event) => onChange("severity", event.target.value)}
        />
        <FieldError>{fieldErrors.severity}</FieldError>
      </div>

      <div>
        <Select
          label="Status *"
          name="status"
          value={values.status}
          options={STATUSES.map((value) => ({ value, label: value }))}
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
          onChange={(event) => onChange("discoverySource", event.target.value)}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cm-text">
            Tester Bug Dashboard
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Report bugs, review reported issues, and edit bug details.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowCreateForm((open) => !open)}
        >
          <span className="flex items-center gap-2">
            {showCreateForm ? <X size={16} /> : <Plus size={16} />}
            {showCreateForm ? "Cancel report" : "Report a bug"}
          </span>
        </Button>
      </div>

      {showCreateForm && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-cm-text">
              Report a new bug
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              Fields marked * are required. Severity, status, and discovery
              source match your database constraints.
            </p>
          </div>
          <form onSubmit={handleCreateBug} noValidate>
            {renderBugForm({
              values: form,
              fieldErrors: errors,
              onChange: handleCreateChange,
              modules: createModules,
            })}
            <div className="mt-5 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setForm(emptyForm);
                  setErrors({});
                  setShowCreateForm(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <span className="flex items-center gap-2">
                  <Plus size={16} /> Submit bug report
                </span>
              </Button>
            </div>
          </form>
        </section>
      )}

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

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
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
            options={STATUSES.map((value) => ({ value, label: value }))}
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

      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cm-border p-5">
          <div>
            <h2 className="font-semibold text-cm-text">Reported bugs</h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              Review bug details and edit records as needed.
            </p>
          </div>
          <span className="rounded-full bg-cm-bg px-3 py-1 text-sm text-cm-text-muted">
            {visibleBugs.length} {visibleBugs.length === 1 ? "bug" : "bugs"}
          </span>
        </div>

        {visibleBugs.length === 0 ? (
          <div className="p-10 text-center">
            <Bug size={32} className="mx-auto text-cm-text-muted" />
            <p className="mt-3 font-medium text-cm-text">No bugs found</p>
            <p className="mt-1 text-sm text-cm-text-muted">
              Change your filters or report a new bug.
            </p>
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
                        <Edit3 size={15} /> Edit
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
                    <CalendarDays size={13} /> Reported{" "}
                    {formatDate(bug.createdAt)}
                  </span>
                  <span>Source: {bug.discoverySource}</span>
                  {bug.assignedTo && <span>Assigned to: {bug.assignedTo}</span>}
                  {bug.fixNotes && <span>Fix notes: {bug.fixNotes}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editingBug && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditingBug(null);
              setEditForm(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-bug-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="edit-bug-title"
                  className="text-lg font-semibold text-cm-text"
                >
                  Edit BUG-{String(editingBug.id).padStart(3, "0")}
                </h2>
                <p className="mt-1 text-sm text-cm-text-muted">
                  Update the bug details and status.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close edit dialog"
                className="rounded-lg p-2 text-cm-text-muted hover:bg-cm-bg"
                onClick={() => {
                  setEditingBug(null);
                  setEditForm(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateBug} noValidate>
              {renderBugForm({
                values: editForm,
                fieldErrors: editErrors,
                onChange: handleEditChange,
                modules: editModules,
                isEditing: true,
              })}
              <div className="mt-5 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingBug(null);
                    setEditForm(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
