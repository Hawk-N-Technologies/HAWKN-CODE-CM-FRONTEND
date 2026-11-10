import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Flag,
  Layers3,
  ListTodo,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react";

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

const statusTone = (status) => {
  switch (status) {
    case "Done":
      return "success";
    case "In Progress":
    case "Testing":
      return "info";
    case "Code Review":
      return "warning";
    case "Backlog":
    case "To Do":
      return "neutral";
    default:
      return "neutral";
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
  projectUuid: task.projectUuid,
});

const formatDate = (value) => {
  if (!value) return "Not set";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const SectionHeading = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0">
      {eyebrow && (
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          {eyebrow}
        </p>
      )}
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      {description && (
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      )}
    </div>
    {action}
  </div>
);

const MetricCard = ({ icon: Icon, label, value, description, accent }) => (
  <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
    >
      <Icon size={21} />
    </div>
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-none text-slate-900">
        {value}
      </p>
      {description && (
        <p className="mt-1 truncate text-xs text-slate-400">{description}</p>
      )}
    </div>
  </div>
);

const ModalHeader = ({ eyebrow, title, description, onClose }) => (
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
        <h2 className="text-xl font-bold text-white">{title}</h2>
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
  maxWidth = "max-w-4xl",
}) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
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

const FormLabel = ({ children, required = false }) => (
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

function Tasks() {
  const [projects, setProjects] = useState([]);
  const [projectMap, setProjectMap] = useState({});
  const [modules, setModules] = useState([]);
  const [phases, setPhases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const selectedProjectData = projects.find(
    (item) => String(item.uuid ?? item.id) === selectedProject,
  );

  const selectedModuleData = modules.find(
    (item) => String(item.uuid ?? item.id) === selectedModule,
  );

  const selectedPhaseData = phases.find(
    (item) => String(item.uuid ?? item.id) === selectedPhase,
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

  const developerOptions = useMemo(
    () =>
      employees
        .filter((employee) => employee.role === "developer")
        .map((employee) => ({
          value: String(employee.id),
          label:
            [employee.firstName, employee.lastName]
              .filter(Boolean)
              .join(" ") ||
            employee.fullName ||
            employee.name ||
            `Employee ${employee.id}`,
        })),
    [employees],
  );

  const testerOptions = useMemo(
    () =>
      employees
        .filter((employee) => employee.role === "tester")
        .map((employee) => ({
          value: String(employee.id),
          label:
            [employee.firstName, employee.lastName]
              .filter(Boolean)
              .join(" ") ||
            employee.fullName ||
            employee.name ||
            `Employee ${employee.id}`,
        })),
    [employees],
  );

  const getEmployeeName = useCallback(
    (id) => {
      if (id == null || id === "") return "Unassigned";

      const employee = employees.find(
        (item) => String(item.id) === String(id),
      );

      if (!employee) return "Unassigned";

      return (
        employee.fullName ||
        employee.name ||
        [employee.firstName, employee.lastName].filter(Boolean).join(" ") ||
        employee.email ||
        `Employee ${employee.id}`
      );
    },
    [employees],
  );

  // Initial project and employee loading.
  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      setLoadingProjects(true);
      setLoadingEmployees(true);

      const employeeRequest = axios
        .get("/api/developers-testers", {
          withCredentials: true,
        })
        .then((response) => {
          if (active && response.status === 200) {
            setEmployees(response.data.data || []);
          }
        })
        .catch((error) => {
          console.error(
            "Failed to fetch developers and testers:",
            error.response?.status,
            error.response?.data || error.message,
          );
        })
        .finally(() => {
          if (active) setLoadingEmployees(false);
        });

      const projectRequest = axios
        .get(API.projects, { withCredentials: true })
        .then((response) => {
          if (!active) return;

          const items = listFrom(response);

          setProjects(items);
          setProjectMap(
            Object.fromEntries(
              items.map((item) => [
                item.uuid ?? item.id,
                item.name,
              ]),
            ),
          );
        })
        .catch((error) => {
          if (active) {
            showToast.error(
              errorMessage(error, "Failed to load projects."),
            );
          }
        })
        .finally(() => {
          if (active) setLoadingProjects(false);
        });

      await Promise.allSettled([employeeRequest, projectRequest]);
    };

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // Load modules when project changes.
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
        if (active) {
          showToast.error(
            errorMessage(error, "Failed to load modules."),
          );
        }
      } finally {
        if (active) setLoadingModules(false);
      }
    };

    loadModules();

    return () => {
      active = false;
    };
  }, [selectedProject]);

  // Load phases when module changes.
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
        if (active) {
          showToast.error(
            errorMessage(error, "Failed to load phases."),
          );
        }
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

    if (selectedModule && selectedPhase) {
      return API.phaseTasks(
        selectedProject,
        selectedModule,
        selectedPhase,
      );
    }

    if (selectedModule) {
      return API.moduleTasks(selectedProject, selectedModule);
    }

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
      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      setTasks(listFrom(response).map(normalizeTask));
    } catch (error) {
      setTasks([]);
      showToast.error(
        errorMessage(error, "Failed to load tasks."),
      );
    } finally {
      setLoadingTasks(false);
    }
  }, [taskEndpoint]);

  // Load tasks for the selected project/module/phase.
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
        const response = await axios.get(endpoint, {
          withCredentials: true,
        });

        if (active) {
          setTasks(listFrom(response).map(normalizeTask));
        }
      } catch (error) {
        if (active) {
          setTasks([]);
          showToast.error(
            errorMessage(error, "Failed to load tasks."),
          );
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

  // Escape key handling for dialogs.
  useEffect(() => {
    if (!showForm && !deleteTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving && !busyTask) {
        setShowForm(false);
        setEditingTask(null);
        setForm(EMPTY_FORM);
        setDeleteTarget(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showForm, deleteTarget, saving, busyTask]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tasks;

    return tasks.filter((task) => {
      const moduleName =
        modules.find(
          (item) => String(item.id) === String(task.moduleId),
        )?.name || "";

      const phaseName =
        phases.find(
          (item) => String(item.id) === String(task.phaseId),
        )?.name || "";

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
        task.blockedReason,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query),
      );
    });
  }, [tasks, search, modules, phases, getEmployeeName]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "Done",
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status === "In Progress",
    ).length;
    const blocked = tasks.filter(
      (task) => task.isBlocked,
    ).length;

    return {
      total,
      completed,
      inProgress,
      blocked,
      completion: total
        ? Math.round((completed / total) * 100)
        : 0,
    };
  }, [tasks]);

  const formPhaseOptions = useMemo(
    () =>
      phases
        .filter(
          (item) =>
            String(item.moduleId) === String(form.moduleId),
        )
        .map((item) => ({
          value: String(item.id),
          label: item.name,
        })),
    [phases, form.moduleId],
  );

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setForm({
      ...EMPTY_FORM,
      moduleId: selectedModuleData?.id
        ? String(selectedModuleData.id)
        : "",
    });
  };

  const openCreateForm = () => {
    if (!selectedProject) {
      showToast.error("Select a project first.");
      return;
    }

    setEditingTask(null);

    setForm({
      ...EMPTY_FORM,
      moduleId: selectedModuleData?.id
        ? String(selectedModuleData.id)
        : "",
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

  const saveTask = async (event) => {
    event.preventDefault();

    if (!selectedProject) {
      return showToast.error("Select a project first.");
    }

    if (!form.title.trim()) {
      return showToast.error("Please enter a task title.");
    }

    if (!form.moduleId) {
      return showToast.error("Please select a module.");
    }

    if (
      form.startDate &&
      form.dueDate &&
      form.dueDate < form.startDate
    ) {
      return showToast.error(
        "Due date cannot be before start date.",
      );
    }

    if (form.isBlocked && !form.blockedReason.trim()) {
      return showToast.error(
        "Enter a reason for blocking this task.",
      );
    }

    const estimatedHours =
      form.estimatedHours === ""
        ? null
        : Number(form.estimatedHours);

    const actualHours =
      form.actualHours === ""
        ? null
        : Number(form.actualHours);

    if (
      [estimatedHours, actualHours].some(
        (value) =>
          value !== null &&
          (!Number.isFinite(value) || value < 0),
      )
    ) {
      return showToast.error(
        "Hours must be valid non-negative numbers.",
      );
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      moduleId: Number(form.moduleId),
      phaseId: form.phaseId
        ? Number(form.phaseId)
        : null,
      assignedTo: form.assignedTo
        ? Number(form.assignedTo)
        : null,
      priority: form.priority,
      status: form.status,
      isBlocked: Boolean(form.isBlocked),
      blockedReason: form.isBlocked
        ? form.blockedReason.trim()
        : null,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      estimatedHours,
      actualHours,
    };

    setSaving(true);

    try {
      if (editingTask) {
        await axios.put(
          API.task(editingTask.uuid),
          payload,
          { withCredentials: true },
        );

        showToast.success("Task updated successfully.");
      } else {
        await axios.post(
          API.projectTasks(selectedProject),
          payload,
          { withCredentials: true },
        );

        showToast.success("Task created successfully.");
      }

      setSearch("");
      closeForm();
      await loadTasks();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to save task.";

      showToast.error(message);
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
          item.uuid === task.uuid
            ? { ...item, status }
            : item,
        ),
      );

      showToast.success("Task status updated.");
    } catch (error) {
      showToast.error(
        errorMessage(error, "Failed to update task status."),
      );
    } finally {
      setBusyTask("");
    }
  };

  const confirmDeleteTask = async () => {
    if (!deleteTarget) return;

    const task = deleteTarget;

    setBusyTask(task.uuid);

    try {
      await axios.delete(API.task(task.uuid), {
        withCredentials: true,
      });

      setTasks((current) =>
        current.filter((item) => item.uuid !== task.uuid),
      );

      if (editingTask?.uuid === task.uuid) {
        closeForm();
      }

      setDeleteTarget(null);
      showToast.success("Task deleted successfully.");
    } catch (error) {
      showToast.error(
        errorMessage(error, "Failed to delete task."),
      );
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
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ListTodo size={16} />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-slate-800">
                {row.title}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {row.uuid?.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {row.isBlocked && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
              <ShieldAlert size={13} className="mt-0.5 shrink-0" />
              <span>
                Blocked:{" "}
                {row.blockedReason || "Reason not provided"}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "projectId",
      header: "Project",
      render: (row) => (
        <span className="text-sm font-medium text-slate-600">
          {projectMap[row.projectUuid] ||
            selectedProjectData?.name ||
            "—"}
        </span>
      ),
    },
    {
      key: "phaseId",
      header: "Phase",
      render: (row) => (
        <span className="text-sm text-slate-600">
          {phases.find(
            (item) => String(item.id) === String(row.phaseId),
          )?.name || "—"}
        </span>
      ),
    },
    {
      key: "assignedTo",
      header: "Assignee",
      render: (row) => (
        <div className="flex min-w-32 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Users size={13} />
          </div>
          <span className="text-sm text-slate-600">
            {getEmployeeName(row.assignedTo)}
          </span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <Badge tone={priorityTone(row.priority)}>
          {row.priority}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="min-w-32">
          <Select
            value={row.status}
            options={STATUSES}
            onChange={(event) =>
              updateTaskStatus(row, event.target.value)
            }
            disabled={Boolean(busyTask)}
          />
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (row) => (
        <div className="flex min-w-28 items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <CalendarDays size={14} className="shrink-0 text-slate-400" />
          {row.dueDate ? formatDate(row.dueDate) : "—"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex min-w-28 items-center gap-2">
          <button
            type="button"
            onClick={() => openEditForm(row)}
            disabled={Boolean(busyTask || saving)}
            title="Edit task"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={14} />
          </button>

          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            disabled={Boolean(busyTask || saving)}
            title="Delete task"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
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
            visibleAttempts: (
              assignment.testingAttempts || []
            ).filter((attempt) => attempt.status !== "Pending"),
          }))
          .filter(
            (assignment) =>
              assignment.visibleAttempts.length > 0,
          );

        if (!assignments.length) {
          return (
            <span className="text-sm text-slate-400">
              No testing history
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
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                      <Users size={13} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {testerName}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {assignment.visibleAttempts.map((attempt) => (
                      <div
                        key={attempt.uuid}
                        className="border-t border-slate-200 pt-2 first:border-0 first:pt-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">
                            Attempt #{attempt.attemptNumber}
                          </span>

                          <Badge
                            tone={testingStatusTone(attempt.status)}
                          >
                            {attempt.status}
                          </Badge>
                        </div>

                        {attempt.testNotes && (
                          <p
                            className={`mt-2 whitespace-pre-wrap break-words text-xs ${
                              attempt.status === "Failed"
                                ? "text-red-600"
                                : "text-slate-500"
                            }`}
                          >
                            <span className="font-semibold">
                              Notes:{" "}
                            </span>
                            {attempt.testNotes}
                          </p>
                        )}

                        {attempt.testedAt && (
                          <p className="mt-1 text-xs text-slate-400">
                            Tested: {formatDateTime(attempt.testedAt)}
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
              Task Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Create, assign, prioritize and monitor project tasks
              across modules and development phases.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5">
                Project Lead
              </span>
              <span className="text-slate-500">/</span>
              <span>Tasks</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Total Tasks</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {taskStats.total}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              disabled={loadingProjects || !projects.length}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#101a3a] shadow-lg transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-[#101a3a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Create Task
            </button>
          </div>
        </div>
      </section>

      {/* TASK OVERVIEW */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ListTodo}
          label="Total Tasks"
          value={taskStats.total}
          description="Tasks in current selection"
          accent="bg-blue-50 text-blue-700"
        />

        <MetricCard
          icon={CheckCircle2}
          label="Completed"
          value={taskStats.completed}
          description="Tasks marked as done"
          accent="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          icon={Clock3}
          label="In Progress"
          value={taskStats.inProgress}
          description="Currently being worked on"
          accent="bg-amber-50 text-amber-700"
        />

        <MetricCard
          icon={ShieldAlert}
          label="Blocked Tasks"
          value={taskStats.blocked}
          description="Tasks requiring attention"
          accent="bg-red-50 text-red-700"
        />
      </section>

      {/* PROJECT AND MODULE FILTERS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="Workspace Filters"
          title="Project & Module Selection"
          description="Select a project, module and optionally a phase to view its tasks."
        />

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="min-w-0">
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
          </div>

          <div className="min-w-0">
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
          </div>

          <div className="min-w-0">
            <Select
              label="Phase (Optional)"
              value={selectedPhase}
              options={[
                { value: "", label: "All phases" },
                ...phaseOptions,
              ]}
              onChange={(event) =>
                setSelectedPhase(event.target.value)
              }
              disabled={loadingPhases || !phases.length}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Viewing
          </span>

          <Badge tone="info">
            {selectedProjectData?.name || "No project selected"}
          </Badge>

          <span className="text-slate-300">/</span>

          <Badge tone="neutral">
            {selectedModuleData?.name || "No module selected"}
          </Badge>

          {selectedPhaseData && (
            <>
              <span className="text-slate-300">/</span>
              <Badge tone="neutral">
                {selectedPhaseData.name}
              </Badge>
            </>
          )}
        </div>

        {loadingProjects && (
          <p className="mt-3 text-xs text-slate-400">
            Loading assigned projects...
          </p>
        )}

        {!loadingProjects && !projects.length && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No assigned projects are available. Tasks require a
            project selection.
          </div>
        )}

        {!loadingModules &&
          selectedProject &&
          !modules.length && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No modules are available for this project yet.
            </div>
          )}
      </section>

      {/* TASK PROGRESS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              Delivery Progress
            </p>
            <h2 className="mt-1 text-base font-bold text-slate-800">
              Task Completion
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Completion based on tasks marked as Done.
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">
              {taskStats.completion}%
            </p>
            <p className="text-xs text-slate-400">
              Overall completion
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
            style={{ width: `${taskStats.completion}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
          <span>{taskStats.completed} completed</span>
          <span>{taskStats.total} total tasks</span>
        </div>
      </section>

      {/* TASK LIST */}
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            eyebrow="Task Workspace"
            title="Development Tasks"
            description={
              loadingTasks
                ? "Retrieving tasks for the selected workspace..."
                : `${filteredTasks.length} task(s) shown in the current selection.`
            }
          />

          <button
            type="button"
            onClick={openCreateForm}
            disabled={loadingProjects || !projects.length}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} />
            Add Task
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Search size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Search Tasks
                </h3>
                <p className="text-xs text-slate-400">
                  Search by title, phase, assignee, status or priority.
                </p>
              </div>
            </div>

            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {filteredTasks.length} Results
            </span>
          </div>

          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search tasks, phases, developers..."
          />
        </div>

        {loadingTasks ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ListTodo size={22} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading development tasks
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Fetching the latest task information...
            </p>
          </div>
        ) : (
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Task Register
                </h3>
                <span className="text-xs text-slate-400">
                  Development and testing records
                </span>
              </div>
            </div>

            <div className="min-w-0 overflow-x-auto">
              <DataTable
                columns={columns}
                rows={filteredTasks}
                emptyMessage={
                  search
                    ? "No tasks match your search."
                    : "No tasks found for this selection."
                }
              />
            </div>
          </div>
        )}
      </section>

      {/* CREATE / EDIT TASK MODAL */}
      {showForm && (
        <ModalShell
          eyebrow="Task Management"
          title={editingTask ? "Edit Task" : "Create New Task"}
          description={
            editingTask
              ? "Update task details, ownership, priority and delivery information."
              : "Define a development task and assign it to a project team member."
          }
          onClose={closeForm}
          maxWidth="max-w-5xl"
        >
          <form onSubmit={saveTask}>
            <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">
              {/* BASIC INFORMATION */}
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <FileText size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Basic Information
                    </h3>
                    <p className="text-xs text-slate-400">
                      Task title and project structure
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0 md:col-span-2">
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
                  </div>

                  <div className="min-w-0">
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
                      disabled={
                        Boolean(editingTask) || loadingProjects
                      }
                    />
                  </div>

                  <div className="min-w-0">
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
                          (item) =>
                            String(item.id) === String(moduleId),
                        );

                        setForm((current) => ({
                          ...current,
                          moduleId,
                          phaseId: "",
                        }));

                        setSelectedModule(
                          module
                            ? String(module.uuid ?? module.id)
                            : "",
                        );

                        setSelectedPhase("");
                      }}
                      disabled={
                        loadingModules || !modules.length
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <Select
                      label="Phase (Optional)"
                      value={form.phaseId}
                      options={[
                        { value: "", label: "No phase" },
                        ...formPhaseOptions,
                      ]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          phaseId: event.target.value,
                        }))
                      }
                      disabled={
                        !form.moduleId || loadingPhases
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <Select
                      label="Assigned To"
                      name="assignedTo"
                      placeholder={
                        loadingEmployees
                          ? "Loading employees..."
                          : "Select employee"
                      }
                      value={form.assignedTo || ""}
                      options={[
                        ...developerOptions.map((item) => ({
                          ...item,
                          label: `Developer: ${item.label}`,
                        })),
                        ...testerOptions.map((item) => ({
                          ...item,
                          label: `Tester: ${item.label}`,
                        })),
                      ]}
                      groups={[
                        {
                          label: "Developers",
                          options: developerOptions,
                        },
                        {
                          label: "Testers",
                          options: testerOptions,
                        },
                      ]}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          assignedTo: event.target.value,
                        }))
                      }
                      disabled={loadingEmployees}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {form.description.length}/10000 characters
                  </p>
                </div>
              </div>

              {/* PRIORITY AND STATUS */}
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <Flag size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Priority & Status
                    </h3>
                    <p className="text-xs text-slate-400">
                      Define the task's urgency and current workflow stage
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0">
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
                  </div>

                  <div className="min-w-0">
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
                  </div>
                </div>
              </div>

              {/* SCHEDULE AND EFFORT */}
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                    <CalendarDays size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Schedule & Effort
                    </h3>
                    <p className="text-xs text-slate-400">
                      Set delivery dates and track estimated versus actual hours
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
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
                  </div>

                  <div className="min-w-0">
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
                  </div>

                  <div className="min-w-0">
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
                  </div>

                  <div className="min-w-0">
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
                  </div>
                </div>
              </div>

              {/* BLOCKED TASK */}
              <div>
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <AlertCircle size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Blocker Information
                    </h3>
                    <p className="text-xs text-slate-400">
                      Record dependencies or issues preventing progress
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-red-50/50">
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
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />

                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-700">
                      This task is blocked
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      Enable this if the task cannot currently proceed.
                    </span>
                  </div>
                </label>

                {form.isBlocked && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Blocked Reason
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <textarea
                      value={form.blockedReason}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          blockedReason: event.target.value,
                        }))
                      }
                      rows={3}
                      maxLength={5000}
                      required
                      placeholder="Explain what is blocking this task..."
                      className="w-full resize-y rounded-xl border border-red-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {form.blockedReason.length}/5000 characters
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
              <p className="text-xs text-slate-400">
                <span className="text-red-500">*</span> Required fields
              </p>

              <div className="flex items-center gap-2">
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
            </div>
          </form>
        </ModalShell>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <ModalShell
          eyebrow="Task Management"
          title="Delete Task"
          description="Confirm removal of this task from the project."
          onClose={() => {
            if (!busyTask) setDeleteTarget(null);
          }}
          maxWidth="max-w-lg"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={22} />
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  Delete this task?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  You are about to delete{" "}
                  <span className="font-semibold text-slate-800">
                    "{deleteTarget.title}"
                  </span>
                  . This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Task reference
              </p>
              <p className="mt-1 break-all text-sm font-medium text-red-800">
                {deleteTarget.uuid}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={Boolean(busyTask)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="danger"
              onClick={confirmDeleteTask}
              disabled={Boolean(busyTask)}
            >
              {busyTask === deleteTarget.uuid
                ? "Deleting..."
                : "Delete Task"}
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

export default Tasks;