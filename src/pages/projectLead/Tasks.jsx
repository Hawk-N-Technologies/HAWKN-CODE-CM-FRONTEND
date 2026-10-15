import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import TableSearch from "../../components/tables/TableSearch";
import DataTable from "../../components/tables/DataTable";
import { showToast } from "../../components/common/Toast";

const API = {
  projects: "/api/project-lead/planning/projects",
  modules: (projectUuid) => `/api/projects/${projectUuid}/modules`,
  phases: (projectUuid, moduleUuid) =>
    `/api/projects/${projectUuid}/modules/${moduleUuid}/phases`,
  projectTasks: (projectUuid) => `/api/projects/${projectUuid}/tasks`,
  moduleTasks: (projectUuid, moduleUuid) =>
    `/api/projects/${projectUuid}/modules/${moduleUuid}/tasks`,
  phaseTasks: (projectUuid, moduleUuid, phaseUuid) =>
    `/api/projects/${projectUuid}/modules/${moduleUuid}/phases/${phaseUuid}/tasks`,
  task: (uuid) => `/api/tasks/${uuid}`,
};

const PRIORITIES = ["Critical", "High", "Medium", "Low"].map((value) => ({
  value,
  label: value,
}));
const STATUSES = [
  "Backlog",
  "To Do",
  "In Progress",
  "Code Review",
  "Testing",
  "Done",
].map((value) => ({ value, label: value }));

const EMPTY_FORM = {
  title: "",
  description: "",
  moduleId: "",
  phaseId: "",
  assignedTo: "",
  priority: "Medium",
  status: "To Do",
  isBlocked: false,
  blockedReason: "",
  startDate: "",
  dueDate: "",
  estimatedHours: "",
  actualHours: "",
};

const listFrom = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const priorityTone = (value) =>
  value === "Critical" || value === "High"
    ? "danger"
    : value === "Medium"
      ? "warning"
      : "neutral";

const normalizeTask = (task) => ({
  ...task,
  id: task.uuid,
  moduleId: task.moduleId == null ? "" : String(task.moduleId),
  phaseId: task.phaseId == null ? "" : String(task.phaseId),
  assignedTo: task.assignedTo == null ? "" : String(task.assignedTo),
  startDate: task.startDate || "",
  dueDate: task.dueDate || "",
  estimatedHours: task.estimatedHours ?? "",
  actualHours: task.actualHours ?? "",
  blockedReason: task.blockedReason || "",
  isBlocked: Boolean(task.isBlocked),
  priority: task.priority || "Medium",
  status: task.status || "Backlog",
  assignedTesters: task.assignedTesters || [],
});

function Tasks() {
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [phases, setPhases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyTask, setBusyTask] = useState("");

  const projectOptions = useMemo(
    () =>
      projects.map((item) => ({
        value: String(item.uuid ?? item.id),
        label: item.name,
      })),
    [projects],
  );
  const moduleOptions = useMemo(
    () =>
      modules.map((item) => ({
        value: String(item.uuid ?? item.id),
        label: item.name,
      })),
    [modules],
  );
  const phaseOptions = useMemo(
    () =>
      phases.map((item) => ({
        value: String(item.uuid ?? item.id),
        label: item.name,
      })),
    [phases],
  );
  const employeeOptions = useMemo(
    () =>
      employees.map((item) => ({
        value: String(item.id),
        label:
          item.fullName ||
          item.name ||
          [item.firstName, item.lastName].filter(Boolean).join(" ") ||
          item.email ||
          `Employee ${item.id}`,
      })),
    [employees],
  );

  const selectedProjectData = projects.find(
    (item) => String(item.uuid ?? item.id) === selectedProject,
  );
  const selectedModuleData = modules.find(
    (item) => String(item.uuid ?? item.id) === selectedModule,
  );

  useEffect(() => {
    let active = true;
    const loadInitialData = async () => {
      setLoadingProjects(true);
      setLoadingEmployees(true);
      await getDevAndTesters();
      const [projectResult] = await Promise.allSettled([
        axios.get(API.projects, { withCredentials: true }),
      ]);

      if (!active) return;

      if (projectResult.status === "fulfilled") {
        const items = listFrom(projectResult.value);
        setProjects(items);
        setSelectedProject(
          items.length ? String(items[0].uuid ?? items[0].id) : "",
        );
        setProjectName(items.length ? String(items[0].name) : "");
      } else {
        showToast.error(
          errorMessage(projectResult.reason, "Failed to load projects."),
        );
      }

      setLoadingProjects(false);
      setLoadingEmployees(false);
    };

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setModules([]);
    setSelectedModule("");
    setPhases([]);
    setSelectedPhase("");
    setTasks([]);

    if (!selectedProject) {
      setLoadingModules(false);
      return () => {
        active = false;
      };
    }

    const loadModules = async () => {
      setLoadingModules(true);
      try {
        const response = await axios.get(API.modules(selectedProject), {
          withCredentials: true,
        });
        if (!active) return;
        const items = listFrom(response);
        setModules(items);
        setSelectedModule(
          items.length ? String(items[0].uuid ?? items[0].id) : "",
        );
      } catch (error) {
        if (active)
          showToast.error(errorMessage(error, "Failed to load modules."));
      } finally {
        if (active) setLoadingModules(false);
      }
    };

    loadModules();
    return () => {
      active = false;
    };
  }, [selectedProject]);

  useEffect(() => {
    let active = true;
    setPhases([]);
    setSelectedPhase("");

    if (!selectedProject || !selectedModule) {
      setLoadingPhases(false);
      return () => {
        active = false;
      };
    }

    const loadPhases = async () => {
      setLoadingPhases(true);
      try {
        const response = await axios.get(
          API.phases(selectedProject, selectedModule),
          { withCredentials: true },
        );
        if (active) setPhases(listFrom(response));
      } catch (error) {
        if (active)
          showToast.error(errorMessage(error, "Failed to load phases."));
      } finally {
        if (active) setLoadingPhases(false);
      }
    };

    loadPhases();
    return () => {
      active = false;
    };
  }, [selectedProject, selectedModule]);

  const taskEndpoint = useCallback(() => {
    if (!selectedProject) return null;
    if (selectedModule && selectedPhase)
      return API.phaseTasks(selectedProject, selectedModule, selectedPhase);
    if (selectedModule) return API.moduleTasks(selectedProject, selectedModule);
    return API.projectTasks(selectedProject);
  }, [selectedProject, selectedModule, selectedPhase]);

  const loadTasks = useCallback(async () => {
    const endpoint = taskEndpoint();
    if (!endpoint) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    try {
      const response = await axios.get(endpoint, { withCredentials: true });
      setTasks(listFrom(response).map(normalizeTask));
    } catch (error) {
      setTasks([]);
      showToast.error(errorMessage(error, "Failed to load tasks."));
    } finally {
      setLoadingTasks(false);
    }
  }, [taskEndpoint]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const endpoint = taskEndpoint();
      if (!endpoint || (modules.length > 0 && !selectedModule)) {
        setTasks([]);
        setLoadingTasks(false);
        return;
      }
      setLoadingTasks(true);
      try {
        const response = await axios.get(endpoint, { withCredentials: true });
        if (active) setTasks(listFrom(response).map(normalizeTask));
      } catch (error) {
        if (active) {
          setTasks([]);
          showToast.error(errorMessage(error, "Failed to load tasks."));
        }
      } finally {
        if (active) setLoadingTasks(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [taskEndpoint, modules.length, selectedModule]);

  const getEmployeeName = (id) => {
    const employee = employees.find((item) => String(item.id) === String(id));
    if (!employee) return "Unassigned";
    return (
      employee.fullName ||
      employee.name ||
      [employee.firstName, employee.lastName].filter(Boolean).join(" ") ||
      employee.email ||
      `Employee ${employee.id}`
    );
  };

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) => {
      const moduleName =
        modules.find((item) => String(item.id) === String(task.moduleId))
          ?.name || "";
      const phaseName =
        phases.find((item) => String(item.id) === String(task.phaseId))?.name ||
        "";
      const assigneeName = getEmployeeName(task.assignedTo);
      return [
        task.uuid,
        task.title,
        task.description,
        moduleName,
        phaseName,
        assigneeName,
        task.priority,
        task.status,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [tasks, search, modules, phases, employees]);

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setForm({
      ...EMPTY_FORM,
      moduleId: selectedModuleData?.id ? String(selectedModuleData.id) : "",
    });
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setForm({
      ...EMPTY_FORM,
      moduleId: selectedModuleData?.id ? String(selectedModuleData.id) : "",
    });
    setShowForm(true);
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setForm({
      ...EMPTY_FORM,
      title: task.title || "",
      description: task.description || "",
      moduleId: task.moduleId || "",
      phaseId: task.phaseId || "",
      assignedTo: task.assignedTo || "",
      priority: task.priority || "Medium",
      status: task.status || "Backlog",
      isBlocked: Boolean(task.isBlocked),
      blockedReason: task.blockedReason || "",
      startDate: task.startDate || "",
      dueDate: task.dueDate || "",
      estimatedHours: task.estimatedHours ?? "",
      actualHours: task.actualHours ?? "",
    });
    setShowForm(true);
  };

  const formPhaseOptions = phases
    .filter((item) => String(item.moduleId) === String(form.moduleId))
    .map((item) => ({ value: String(item.id), label: item.name }));

  const saveTask = async (event) => {
    event.preventDefault();
    if (!selectedProject) return showToast.error("Select a project first.");
    if (!form.title.trim())
      return showToast.error("Please enter a task title.");
    if (!form.moduleId) return showToast.error("Please select a module.");
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      return showToast.error("Due date cannot be before start date.");
    }
    if (form.isBlocked && !form.blockedReason.trim()) {
      return showToast.error("Enter a reason for blocking this task.");
    }

    const estimatedHours =
      form.estimatedHours === "" ? null : Number(form.estimatedHours);
    const actualHours =
      form.actualHours === "" ? null : Number(form.actualHours);
    if (
      [estimatedHours, actualHours].some(
        (value) => value !== null && (!Number.isFinite(value) || value < 0),
      )
    ) {
      return showToast.error("Hours must be valid non-negative numbers.");
    }
    console.log(form.assignedTo);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      moduleId: Number(form.moduleId),
      phaseId: form.phaseId ? Number(form.phaseId) : null,
      assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
      priority: form.priority,
      status: form.status,
      isBlocked: Boolean(form.isBlocked),
      blockedReason: form.isBlocked ? form.blockedReason.trim() : null,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      estimatedHours,
      actualHours,
    };

    setSaving(true);
    try {
      if (editingTask) {
        await axios.put(API.task(editingTask.uuid), payload, {
          withCredentials: true,
        });
        showToast.success("Task updated successfully.");
      } else {
        await axios.post(API.projectTasks(selectedProject), payload, {
          withCredentials: true,
        });
        showToast.success("Task created successfully.");
      }
      setSearch("");
      closeForm();
      await loadTasks();
    } catch (error) {
      showToast.error(errorMessage(error, "Failed to save task."));
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (task, status) => {
    if (task.status === status || busyTask) return;
    setBusyTask(task.uuid);
    try {
      await axios.put(
        API.task(task.uuid),
        { status },
        { withCredentials: true },
      );
      setTasks((current) =>
        current.map((item) =>
          item.uuid === task.uuid ? { ...item, status } : item,
        ),
      );
      showToast.success("Task status updated.");
    } catch (error) {
      showToast.error(errorMessage(error, "Failed to update task status."));
    } finally {
      setBusyTask("");
    }
  };
  const getDevAndTesters = async () => {
    try {
      const res = await axios.get("/api/developers-testers", {
        withCredentials: true,
      });

      if (res.status === 200) {
        console.log(res.data.data);
        setEmployees(res.data.data);
      }
    } catch (error) {
      console.error(
        "Failed to fetch developers and testers:",
        error.response?.status,
        error.response?.data || error.message,
      );
    }
  };

  const testingStatusTone = (status) => {
    switch (status) {
      case "Passed":
        return "success";
      case "Failed":
        return "danger";
      case "In Progress":
        return "warning";
      default:
        return "neutral";
    }
  };
  const deleteTask = async (task) => {
    if (
      !window.confirm(`Delete "${task.title}"? This action cannot be undone.`)
    )
      return;
    setBusyTask(task.uuid);
    try {
      await axios.delete(API.task(task.uuid), { withCredentials: true });
      setTasks((current) => current.filter((item) => item.uuid !== task.uuid));
      if (editingTask?.uuid === task.uuid) closeForm();
      showToast.success("Task deleted successfully.");
    } catch (error) {
      showToast.error(errorMessage(error, "Failed to delete task."));
    } finally {
      setBusyTask("");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Task",
      render: (row) => (
        <div className="min-w-44">
          <p className="font-medium text-cm-text">{row.title}</p>
          <p className="mt-1 text-xs text-cm-text-muted">
            {row.uuid?.slice(0, 8).toUpperCase()}
          </p>
          {row.isBlocked && (
            <p className="mt-1 text-xs text-red-500">
              Blocked: {row.blockedReason || "Reason not provided"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "projetId",
      header: "Project Name",
      render: (row) => (
        <span className="text-sm text-cm-text">{projectName}</span>
      ),
    },
    {
      key: "phaseId",
      header: "Phase",
      render: (row) => (
        <span className="text-sm text-cm-text">
          {phases.find((item) => String(item.id) === String(row.phaseId))
            ?.name || "—"}
        </span>
      ),
    },
    {
      key: "assignedTo",
      header: "Assignee",
      render: (row) => (
        <span className="text-sm text-cm-text">
          {getEmployeeName(row.assignedTo)}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <Badge tone={priorityTone(row.priority)}>{row.priority}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Select
          value={row.status}
          options={STATUSES}
          onChange={(event) => updateTaskStatus(row, event.target.value)}
          disabled={Boolean(busyTask)}
        />
      ),
    },
    {
      key: "dueDate",
      header: "Due date",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-cm-text">
          {row.dueDate
            ? new Date(`${row.dueDate}T00:00:00`).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => openEditForm(row)}
            disabled={Boolean(busyTask || saving)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => deleteTask(row)}
            disabled={Boolean(busyTask || saving)}
          >
            {busyTask === row.uuid ? "Working..." : "Delete"}
          </Button>
        </div>
      ),
    },

    {
      key: "testingHistory",
      header: "Testing History",
      render: (row) => {
        const assignments = (row.assignedTesters || [])
          .map((assignment) => ({
            ...assignment,
            visibleAttempts: (assignment.testingAttempts || []).filter(
              (attempt) => attempt.status !== "Pending",
            ),
          }))
          .filter((assignment) => assignment.visibleAttempts.length > 0);
        if (!assignments.length) {
          return (
            <span className="text-sm text-cm-text-muted">
              No testers assigned
            </span>
          );
        }

        return (
          <div className="min-w-64 space-y-3">
            {assignments.map((assignment) => {
              const testerName =
                [
                  assignment.tester?.user?.firstName,
                  assignment.tester?.user?.lastName,
                ]
                  .filter(Boolean)
                  .join(" ") || `Tester ${assignment.testerId}`;

              return (
                <div
                  key={assignment.uuid}
                  className="rounded-lg border border-cm-border bg-cm-card p-3"
                >
                  <p className="mb-2 text-sm font-semibold text-cm-text">
                    {testerName}
                  </p>
                  <div className="space-y-3">
                    {assignment.visibleAttempts.map((attempt) => (
                      <div
                        key={attempt.uuid}
                        className="border-t border-cm-border pt-2 first:border-0 first:pt-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-cm-text-muted">
                            Attempt #{attempt.attemptNumber}
                          </span>

                          <Badge tone={testingStatusTone(attempt.status)}>
                            {attempt.status}
                          </Badge>
                        </div>

                        {attempt.testNotes && (
                          <p
                            className={`mt-2 whitespace-pre-wrap break-words text-xs ${
                              attempt.status === "Failed"
                                ? "text-red-500"
                                : "text-cm-text-muted"
                            }`}
                          >
                            <span className="font-medium">Notes: </span>
                            {attempt.testNotes}
                          </p>
                        )}

                        {attempt.testedAt && (
                          <p className="mt-1 text-xs text-cm-text-muted">
                            Tested:{" "}
                            {new Date(attempt.testedAt).toLocaleString(
                              "en-IN",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cm-text">Task Management</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Create, assign, prioritize and track development tasks.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => (showForm ? closeForm() : openCreateForm())}
          disabled={loadingProjects || !projects.length}
        >
          {showForm ? "Cancel" : "+ Create Task"}
        </Button>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-cm-text">Task Filters</h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            Choose a project, module and optionally a phase.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Project"
            value={selectedProject}
            options={projectOptions}
            onChange={(event) => {
              setSelectedProject(event.target.value);
              setSelectedPhase("");
              setSearch("");
            }}
            disabled={loadingProjects}
          />
          <Select
            label="Module"
            value={selectedModule}
            options={moduleOptions}
            onChange={(event) => {
              setSelectedModule(event.target.value);
              setSelectedPhase("");
              setSearch("");
            }}
            disabled={loadingModules || !modules.length}
          />
          <Select
            label="Phase (Optional)"
            value={selectedPhase}
            options={[{ value: "", label: "All phases" }, ...phaseOptions]}
            onChange={(event) => setSelectedPhase(event.target.value)}
            disabled={loadingPhases || !phases.length}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-cm-border pt-4 text-sm">
          <span className="text-cm-text-muted">Viewing:</span>
          <Badge tone="info">{selectedProjectData?.name || "No project"}</Badge>
          <span className="text-cm-text-muted">/</span>
          <Badge tone="neutral">
            {selectedModuleData?.name || "No module"}
          </Badge>
          {selectedPhase && (
            <>
              <span className="text-cm-text-muted">/</span>
              <Badge tone="neutral">
                {phases.find(
                  (item) => String(item.uuid ?? item.id) === selectedPhase,
                )?.name || "Selected phase"}
              </Badge>
            </>
          )}
        </div>
      </section>

      {showForm && (
        <form
          onSubmit={saveTask}
          className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="font-semibold text-cm-text">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              The current database schema supports one employee per task.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Task Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="e.g. Implement plot search"
              maxLength={255}
              required
            />
            <Select
              label="Project"
              value={selectedProject}
              options={projectOptions}
              onChange={(event) => {
                setSelectedProject(event.target.value);
                setSelectedModule("");
                setSelectedPhase("");
                setForm((current) => ({
                  ...current,
                  moduleId: "",
                  phaseId: "",
                }));
              }}
              disabled={Boolean(editingTask) || loadingProjects}
            />
            <Select
              label="Module"
              value={form.moduleId}
              options={modules.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
              onChange={(event) => {
                const moduleId = event.target.value;
                const module = modules.find(
                  (item) => String(item.id) === String(moduleId),
                );
                setForm((current) => ({ ...current, moduleId, phaseId: "" }));
                setSelectedModule(
                  module ? String(module.uuid ?? module.id) : "",
                );
                setSelectedPhase("");
              }}
              disabled={loadingModules || !modules.length}
            />
            <Select
              label="Phase (Optional)"
              value={form.phaseId}
              options={[{ value: "", label: "No phase" }, ...formPhaseOptions]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phaseId: event.target.value,
                }))
              }
              disabled={!form.moduleId || loadingPhases}
            />
            <Select
              label="Assigned to"
              name="assignedTo"
              placeholder="Select employee"
              value={form.assignedTo || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  assignedTo: e.target.value,
                }))
              }
              groups={[
                {
                  label: "Developers",
                  options: employees
                    .filter((employee) => employee.role === "developer")
                    .map((employee) => ({
                      value: employee.id,
                      label: `${employee.firstName} ${employee.lastName}`,
                    })),
                },
                {
                  label: "Testers",
                  options: employees
                    .filter((employee) => employee.role === "tester")
                    .map((employee) => ({
                      value: employee.id,
                      label: `${employee.firstName} ${employee.lastName}`,
                    })),
                },
              ]}
            />
            <Select
              label="Priority"
              value={form.priority}
              options={PRIORITIES}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value,
                }))
              }
            />
            <Select
              label="Status"
              value={form.status}
              options={STATUSES}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            />
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
            />
            <Input
              label="Due Date"
              type="date"
              min={form.startDate || undefined}
              value={form.dueDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
            <Input
              label="Estimated Hours"
              type="number"
              min="0"
              step="0.25"
              value={form.estimatedHours}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  estimatedHours: event.target.value,
                }))
              }
              placeholder="e.g. 8"
            />
            <Input
              label="Actual Hours"
              type="number"
              min="0"
              step="0.25"
              value={form.actualHours}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  actualHours: event.target.value,
                }))
              }
              placeholder="e.g. 6"
            />
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-cm-text">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                maxLength={10000}
                placeholder="Describe the task and acceptance criteria..."
                className="w-full rounded-lg border border-cm-border bg-cm-card p-3 text-sm text-cm-text outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-cm-text">
                <input
                  type="checkbox"
                  checked={form.isBlocked}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isBlocked: event.target.checked,
                      blockedReason: event.target.checked
                        ? current.blockedReason
                        : "",
                    }))
                  }
                  className="h-4 w-4 rounded border-cm-border"
                />
                This task is blocked
              </label>
            </div>
            {form.isBlocked && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-cm-text">
                  Blocked Reason
                </label>
                <textarea
                  value={form.blockedReason}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      blockedReason: event.target.value,
                    }))
                  }
                  rows={2}
                  maxLength={5000}
                  required
                  placeholder="Explain what is blocking this task..."
                  className="w-full rounded-lg border border-cm-border bg-cm-card p-3 text-sm text-cm-text outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingTask
                  ? "Save Changes"
                  : "Create Task"}
            </Button>
          </div>
        </form>
      )}

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-cm-text">Tasks</h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            {loadingTasks
              ? "Loading tasks..."
              : `${filteredTasks.length} tasks shown`}
          </p>
        </div>
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search tasks, phases, developers..."
        />
        {loadingTasks ? (
          <div className="rounded-cm-lg border border-cm-border bg-cm-card p-8 text-center text-sm text-cm-text-muted">
            Loading tasks...
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredTasks}
            emptyMessage="No tasks found for this selection."
          />
        )}
      </section>
    </div>
  );
}

export default Tasks;
