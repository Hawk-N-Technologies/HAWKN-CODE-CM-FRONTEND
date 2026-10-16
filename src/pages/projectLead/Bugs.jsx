import { useEffect, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
} from "lucide-react";

import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/TextArea";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

const SEVERITIES = ["Low", "Medium", "High", "Critical"];

const DISCOVERY_SOURCES = [
  "Client",
  "Testing",
  "Development",
  "Code Review",
  "Production",
  "Retesting",
];

const INITIAL_BUGS = [
  {
    id: 1,
    projectId: "project-1",
    moduleId: "module-1",
    title: "Login fails with valid credentials",
    description: "Users occasionally receive an authentication error.",
    severity: "High",
    status: "Open",
    discoverySource: "Testing",
    assignedTo: "Rahul Sharma",
    reportedAt: "2026-10-15",
  },
  {
    id: 2,
    projectId: "project-1",
    moduleId: "module-1",
    title: "Password reset email not received",
    description: "Reset email is delayed or missing for some users.",
    severity: "Medium",
    status: "In Progress",
    discoverySource: "Client",
    assignedTo: "Priya Patel",
    reportedAt: "2026-10-14",
  },
  {
    id: 3,
    projectId: "project-1",
    moduleId: "module-2",
    title: "Dashboard breaks on smaller screens",
    description: "Cards overflow on mobile devices.",
    severity: "Low",
    status: "Fixed",
    discoverySource: "Code Review",
    assignedTo: "Amit Shah",
    reportedAt: "2026-10-12",
  },
  {
    id: 4,
    projectId: "project-2",
    moduleId: "module-3",
    title: "Payment confirmation missing",
    description: "Payment succeeds but confirmation is not displayed.",
    severity: "Critical",
    status: "Open",
    discoverySource: "Production",
    assignedTo: "Unassigned",
    reportedAt: "2026-10-16",
  },
];

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
  discoverySource: "Testing",
  assignedTo: "",
};

export default function Bugs() {
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [projectId, setProjectId] = useState("");
  const [moduleId, setModuleId] = useState("");

  const [bugs, setBugs] = useState(INITIAL_BUGS);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const getList = (response) => {
    const data = response.data?.data ?? response.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.projects)) return data.projects;
    if (Array.isArray(data?.modules)) return data.modules;
    if (Array.isArray(data?.employees)) return data.employees;

    return [];
  };

  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);

      try {
        const response = await axios.get(
          "/api/project-lead/planning/projects",
          { withCredentials: true },
        );

        if (active) setProjects(getList(response));
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
        const response = await axios.get(`/api/projects/${projectId}/modules`, {
          withCredentials: true,
        });

        if (active) setModules(getList(response));
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
        const response = await axios.get("/api/developers-testers", {
          withCredentials: true,
        });

        if (active) setEmployees(getList(response));
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message || "Failed to load employees.",
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

  const selectedProject = projects.find(
    (item) => String(item.uuid ?? item.id) === projectId,
  );

  const selectedModule = modules.find(
    (item) => String(item.uuid ?? item.id) === moduleId,
  );

  const visibleBugs = bugs.filter(
    (bug) =>
      (!projectId || bug.projectId === projectId) &&
      (!moduleId || bug.moduleId === moduleId),
  );

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleCreateBug = (event) => {
    event.preventDefault();

    if (!projectId || !form.title.trim()) {
      showToast.error("Select a project and enter a bug title.");
      return;
    }

    const newBug = {
      id: Date.now(),
      projectId,
      moduleId: moduleId || null,
      title: form.title.trim(),
      description: form.description.trim(),
      severity: form.severity,
      status: "Open",
      discoverySource: form.discoverySource,
      assignedTo:
        employees.find(
          (employee) =>
            String(employee.uuid ?? employee.id) === form.assignedTo,
        )?.full_name ||
        employees.find(
          (employee) =>
            String(employee.uuid ?? employee.id) === form.assignedTo,
        )?.name ||
        "Unassigned",
      reportedAt: new Date().toISOString().slice(0, 10),
    };

    setBugs((previous) => [newBug, ...previous]);
    setForm(EMPTY_FORM);
    setShowForm(false);

    showToast.success("Bug reported successfully.");
  };

  const formatDate = (date) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cm-text">Bug Reporting</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Report, track, and review project bugs.
          </p>
        </div>

        <Button type="button" onClick={() => setShowForm(!showForm)}>
          <span className="flex items-center gap-2">
            <Plus size={16} />
            {showForm ? "Hide Form" : "Report Bug"}
          </span>
        </Button>
      </div>

      {/* Project and Module filters */}
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Project"
            name="projectId"
            required
            value={projectId}
            options={projects.map((item) => ({
              value: String(item.uuid ?? item.id),
              label: item.name,
            }))}
            placeholder={
              loadingProjects ? "Loading projects..." : "Select project"
            }
            disabled={loadingProjects}
            onChange={(event) => setProjectId(event.target.value)}
          />

          <Select
            label="Module (Optional)"
            name="moduleId"
            value={moduleId}
            options={modules.map((item) => ({
              value: String(item.uuid ?? item.id),
              label: item.name,
            }))}
            placeholder={loadingModules ? "Loading modules..." : "All modules"}
            disabled={!projectId || loadingModules}
            onChange={(event) => setModuleId(event.target.value)}
          />
        </div>
      </section>

      {/* Report bug form */}
      {showForm && (
        <form
          onSubmit={handleCreateBug}
          className="space-y-5 rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-cm-text">
              Report a New Bug
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              Provide the issue details and assign it to a developer.
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
              options={SEVERITIES.map((value) => ({
                value,
                label: value,
              }))}
              onChange={(event) => updateForm("severity", event.target.value)}
            />

            <Select
              label="Discovery Source"
              name="discoverySource"
              required
              value={form.discoverySource}
              options={DISCOVERY_SOURCES.map((value) => ({
                value,
                label: value,
              }))}
              onChange={(event) =>
                updateForm("discoverySource", event.target.value)
              }
            />

            <Select
              label="Assign To (Optional)"
              name="assignedTo"
              value={form.assignedTo}
              options={employees.map((employee) => ({
                value: String(employee.uuid ?? employee.id),
                label:
                  employee.full_name ?? employee.name ?? "Unnamed employee",
              }))}
              placeholder={
                loadingEmployees ? "Loading employees..." : "Unassigned"
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

          <div className="flex justify-end gap-3 border-t border-cm-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setForm(EMPTY_FORM)}
            >
              Reset
            </Button>
            <Button type="submit">Submit Bug</Button>
          </div>
        </form>
      )}

      {/* Bug summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total Bugs",
            value: visibleBugs.length,
            icon: Bug,
          },
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

      {/* Previous bugs */}
      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cm-border p-5">
          <div>
            <h2 className="font-semibold text-cm-text">Reported Bugs</h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              {selectedProject?.name || "All projects"}
              {selectedModule ? ` / ${selectedModule.name}` : ""}
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {visibleBugs.length} bugs
          </span>
        </div>

        {visibleBugs.length === 0 ? (
          <div className="p-10 text-center">
            <Bug size={32} className="mx-auto text-cm-text-muted" />
            <p className="mt-3 font-medium text-cm-text">No bugs found</p>
            <p className="mt-1 text-sm text-cm-text-muted">
              Try another project or module, or report a new bug.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cm-border">
            {visibleBugs.map((bug) => (
              <article
                key={bug.id}
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
                        BUG-{String(bug.id).slice(-6)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        SEVERITY_STYLES[bug.severity] || SEVERITY_STYLES.Medium
                      }`}
                    >
                      {bug.severity}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        STATUS_STYLES[bug.status] || STATUS_STYLES.Open
                      }`}
                    >
                      {bug.status}
                    </span>
                  </div>
                </div>

                {bug.description && (
                  <p className="pl-0 text-sm leading-6 text-cm-text-muted md:pl-11">
                    {bug.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-cm-text-muted md:pl-11">
                  <span>Source: {bug.discoverySource}</span>
                  <span>Assigned: {bug.assignedTo || "Unassigned"}</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={13} />
                    {formatDate(bug.reportedAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
