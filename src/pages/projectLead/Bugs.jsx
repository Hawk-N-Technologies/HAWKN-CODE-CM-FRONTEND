import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  RefreshCw,
  Save,
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
  Closed: "bg-gray-100 text-gray-700 ring-gray-200",
  Rejected: "bg-gray-100 text-gray-500 ring-gray-200",
};

const SEVERITY_STYLES = {
  Low: "text-gray-600 bg-gray-100",
  Medium: "text-blue-700 bg-blue-50",
  High: "text-orange-700 bg-orange-50",
  Critical: "text-red-700 bg-red-50",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  severity: "Medium",
  status: "Open",
  discoverySource: "Testing",
  assignedTo: "",
};

// Keep these paths aligned with your Express routes.
const API = {
  projects: "/api/project-lead/planning/projects",
  employees: "/api/developers-testers",
  modules: (projectId) => `/api/projects/${projectId}/modules`,
  bugs: (projectId) => `/api/bugs/${projectId}/bugs`,
  bug: (bugId) => `/api/project-bugs/${bugId}`,
};

const getPayload = (response) => response?.data?.data ?? response?.data;

const getList = (response, key) => {
  const payload = getPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

// Projects are selected by UUID in the existing project API.
const getId = (item) => String(item?.uuid ?? item?.id ?? "");

// Module foreign keys in project_bugs are integer IDs.
const getModuleId = (item) => String(item?.id ?? "");
const getEmployeeName = (employee) =>
  employee?.full_name ??
  employee?.fullName ??
  employee?.name ??
  "Unnamed employee";

const normalizeBug = (bug) => ({
  ...bug,
  // Your Sequelize model uses camelCase fields; these fallbacks also support
  // APIs that serialize database snake_case columns.
  projectId: bug.projectId ?? bug.project_id,
  moduleId: bug.moduleId ?? bug.module_id ?? null,
  discoverySource: bug.discoverySource ?? bug.discovery_source ?? "Client",
  assignedTo: bug.assignedTo ?? bug.assigned_to ?? null,
  reportedBy: bug.reportedBy ?? bug.reported_by ?? null,
  createdAt: bug.createdAt ?? bug.created_at ?? bug.reportedAt ?? null,
});

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

  const [bugId, setBugId] = useState("");

  const selectedProject = projects.find((item) => getId(item) === projectId);
  const selectedModule = modules.find(
    (item) => getModuleId(item) === String(moduleId),
  );

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const fetchBugs = useCallback(async () => {
    if (!projectId) {
      setBugs([]);
      return;
    }

    setLoadingBugs(true);
    try {
      console.log(projectId);

      const url = moduleId
        ? `/api/bugs/projects/${encodeURIComponent(projectId)}/bugs?module=${encodeURIComponent(moduleId)}`
        : `/api/bugs/projects/${encodeURIComponent(projectId)}/bugs`;

      const response = await axios.get(url, {
        withCredentials: true,
      });

      console.log(response.data.data);
      const list = getList(response, "bugs").map(normalizeBug);
      console.log(list);
      setBugs(list);
    } catch (error) {
      setBugs([]);
      showToast.error(
        error.response?.data?.message || "Failed to load project bugs.",
      );
    } finally {
      setLoadingBugs(false);
    }
  }, [projectId, moduleId]);

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
          // Select the first project by default when one is available.
          setProjectId(list[0] ? getId(list[0]) : "");
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
        const response = await axios.get(API.modules(projectId), {
          withCredentials: true,
        });
        if (active) setModules(getList(response, "modules"));
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message || "Failed to load modules.",
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

  useEffect(() => {
    let active = true;
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await axios.get("/api/bugs/developers", {
          withCredentials: true,
        });
        console.log(response.data.data);
        if (active) setEmployees(getList(response, "employees"));
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message || "Failed to load developers.",
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

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const visibleBugs = bugs.filter(
    (bug) =>
      !moduleId ||
      String(bug.moduleId ?? bug.module_id ?? "") === String(moduleId),
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingBug(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (bug) => {
    setEditingBug(bug);
    console.log(bug);
    setBugId(bug.uuid);
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
    setShowForm(true);
    // If module is editable, retain the bug's module in the existing filter.
    setModuleId(bug.moduleId == null ? "" : String(bug.moduleId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveBug = async (event) => {
    event.preventDefault();
    if (!projectId || !form.title.trim()) {
      showToast.error("Select a project and enter a bug title.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      severity: form.severity,
      status: form.status,
      discoverySource: form.discoverySource,
      assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
      // API expects the internal database ID for the module, if selected.
      moduleId: moduleId ? Number(moduleId) : null,
    };

    console.log(payload);
    console.log(projectId);

    setSaving(true);
    try {
      if (editingBug) {
        await axios.patch(
          `/api/bugs/projects/${projectId}/bugs/${bugId}`,
          payload,
          {
            withCredentials: true,
          },
        );
        showToast.success("Bug updated successfully.");
      } else {
        await axios.post(
          "/api/bugs/createBug",
          { ...payload, projectId: projectId },
          { withCredentials: true },
        );
        showToast.success("Bug reported successfully.");
      }

      resetForm();
      setShowForm(false);
      await fetchBugs();
    } catch (error) {
      showToast.error(
        error.response?.data?.message ||
          (editingBug ? "Failed to update bug." : "Failed to report bug."),
      );
    } finally {
      setSaving(false);
    }
  };

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

  const getAssigneeName = (bug) => {
    if (!bug.assignedTo) return "Unassigned";
    const employee = employees.find(
      (item) => getId(item) === String(bug.assignedTo),
    );
    return employee ? getEmployeeName(employee) : `Employee #${bug.assignedTo}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cm-text">Bug Reporting</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Review project bugs, update their status, and assign developers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={fetchBugs}
            disabled={!projectId || loadingBugs}
          >
            <span className="flex items-center gap-2">
              <RefreshCw
                size={16}
                className={loadingBugs ? "animate-spin" : ""}
              />
              Refresh
            </span>
          </Button>
          <Button
            type="button"
            onClick={() =>
              showForm ? (setShowForm(false), resetForm()) : startCreate()
            }
          >
            <span className="flex items-center gap-2">
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Close Form" : "Report Bug"}
            </span>
          </Button>
        </div>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
        <div
          onClick={() => {
            projects.map((e) => {
              console.log(e);
            });
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Select
            label="Project"
            name="projectId"
            required
            value={projectId}
            options={projects.map((item) => ({
              value: getId(item),
              label: item.name ?? item.projectName ?? `Project ${getId(item)}`,
            }))}
            placeholder={
              loadingProjects ? "Loading projects..." : "Select project"
            }
            disabled={loadingProjects}
            onChange={(event) => {
              console.log(event.target.value);
              setProjectId(event.target.value);
              resetForm();
              setShowForm(false);
            }}
          />
          <Select
            label="Module (Optional)"
            name="moduleId"
            value={moduleId}
            options={modules.map((item) => ({
              value: getModuleId(item),
              label: item.name ?? item.title ?? `Module ${getModuleId(item)}`,
            }))}
            placeholder={loadingModules ? "Loading modules..." : "All modules"}
            disabled={!projectId || loadingModules}
            onChange={(event) => {
              setModuleId(event.target.value);
              console.log(event.target.value);
            }}
          />
        </div>
      </section>

      {showForm && (
        <form
          onSubmit={handleSaveBug}
          className="space-y-5 rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-cm-text">
              {editingBug
                ? `Edit Bug — BUG-${editingBug.uuid}`
                : "Report a New Bug"}
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              Update issue details, workflow status, and developer assignment.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Bug Title"
              name="title"
              required
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="e.g. Login fails with valid credentials"
            />
            <Select
              label="Severity"
              name="severity"
              required
              value={form.severity}
              options={SEVERITIES.map((value) => ({ value, label: value }))}
              onChange={(event) => updateForm("severity", event.target.value)}
            />
            <Select
              label="Status"
              name="status"
              required
              value={form.status}
              options={STATUSES.map((value) => ({ value, label: value }))}
              onChange={(event) => updateForm("status", event.target.value)}
            />

            <Select
              label="Assign Developer (Optional)"
              name="assignedTo"
              value={form.assignedTo}
              options={employees.map((employee) => ({
                value: getId(employee),
                label: getEmployeeName(employee),
              }))}
              placeholder={
                loadingEmployees ? "Loading developers..." : "Unassigned"
              }
              disabled={loadingEmployees}
              onChange={(event) => updateForm("assignedTo", event.target.value)}
            />
            <div className="md:col-span-2">
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

          <div className="flex flex-wrap justify-end gap-3 border-t border-cm-border pt-4">
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
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !projectId}>
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
        </form>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Bugs", value: visibleBugs.length, icon: Bug },
          {
            label: "Open",
            value: visibleBugs.filter((bug) => bug.status === "Open").length,
            icon: AlertCircle,
          },
          {
            label: "In Progress",
            value: visibleBugs.filter((bug) => bug.status === "In Progress")
              .length,
            icon: Clock3,
          },
          {
            label: "Fixed / Closed",
            value: visibleBugs.filter((bug) =>
              ["Fixed", "Closed"].includes(bug.status),
            ).length,
            icon: CheckCircle2,
          },
        ].map(({ label, value, icon: Icon }) => (
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
            <h2 className="font-semibold text-cm-text">Reported Bugs</h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              {selectedProject?.name ??
                selectedProject?.projectName ??
                "Select a project"}
              {selectedModule
                ? ` / ${selectedModule.name ?? selectedModule.title}`
                : ""}
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {visibleBugs.length} bugs
          </span>
        </div>

        {loadingBugs ? (
          <div className="p-10 text-center text-sm text-cm-text-muted">
            Loading project bugs...
          </div>
        ) : !projectId ? (
          <div className="p-10 text-center">
            <Bug size={32} className="mx-auto text-cm-text-muted" />
            <p className="mt-3 font-medium text-cm-text">Select a project</p>
            <p className="mt-1 text-sm text-cm-text-muted">
              Choose a project to fetch its reported bugs.
            </p>
          </div>
        ) : visibleBugs.length === 0 ? (
          <div className="p-10 text-center">
            <Bug size={32} className="mx-auto text-cm-text-muted" />
            <p className="mt-3 font-medium text-cm-text">No bugs found</p>
            <p className="mt-1 text-sm text-cm-text-muted">
              There are no bugs for this project/module yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cm-border">
            {visibleBugs.map((bug) => (
              <article
                key={bug.uuid ?? bug.id}
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
                      <p className="mt-1 text-sm text-cm-text-muted">
                        BUG-{String(bug.uuid).padStart(4, "0")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_STYLES[bug.severity] || SEVERITY_STYLES.Medium}`}
                    >
                      {bug.severity || "Medium"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[bug.status] || STATUS_STYLES.Open}`}
                    >
                      {bug.status || "Open"}
                    </span>
                  </div>
                </div>

                {bug.description && (
                  <p className="text-sm leading-6 text-cm-text-muted md:pl-11">
                    {bug.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-cm-text-muted md:pl-11">
                  <span>Source: {bug.discoverySource || "Client"}</span>
                  <span>Assigned: {getAssigneeName(bug)}</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={13} />
                    {formatDate(bug.createdAt)}
                  </span>
                </div>

                <div className="flex justify-end md:pl-11">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => startEdit(bug)}
                  >
                    <span className="flex items-center gap-2">
                      <Edit3 size={15} /> Edit / Assign
                    </span>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
