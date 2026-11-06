import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import { showToast } from "../../components/common/Toast";

const COLUMNS = [
  "Backlog",
  "To Do",
  "In Progress",
  "Code Review",
  "Testing",
  "Done",
];

const PRIORITIES = ["All priorities", "Critical", "High", "Medium", "Low"];

const PRIORITY_TONE = {
  Critical: "danger",
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

const COLUMN_DOT = {
  Backlog: "bg-slate-400",
  "To Do": "bg-cyan-500",
  "In Progress": "bg-blue-500",
  "Code Review": "bg-amber-500",
  Testing: "bg-violet-500",
  Done: "bg-emerald-500",
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const unwrap = (response) => response?.data?.data ?? response?.data ?? {};

const getSelectValue = (value) => value?.target?.value ?? value;

const getName = (value) => {
  if (!value) return "Unassigned";
  if (typeof value === "string") return value;

  const first =
    value.firstName ??
    value.first_name ??
    value.user?.firstName ??
    value.user?.first_name ??
    "";

  const last =
    value.lastName ??
    value.last_name ??
    value.user?.lastName ??
    value.user?.last_name ??
    "";

  return (
    `${first} ${last}`.trim() ||
    value.name ||
    value.fullName ||
    value.full_name ||
    "Unassigned"
  );
};

function normalizeTesting(records) {
  const list = Array.isArray(records)
    ? records
    : records
      ? [records]
      : [];

  const record = list[list.length - 1];

  if (!record) return null;

  return {
    id: record.uuid ?? record.testingUuid ?? record.testing_uuid ?? record.id,
    testerId:
      record.testerUuid ??
      record.tester_uuid ??
      record.tester?.uuid ??
      record.testerId ??
      record.tester_id,
    tester: getName(record.tester ?? record.employee),
    status: record.status ?? "Pending",
    testNotes: record.testNotes ?? record.test_notes ?? null,
  };
}

function normalizeTask(task) {
  const testing = normalizeTesting(
    task.testingRecords ??
      task.testing_records ??
      task.testing ??
      task.taskTesting,
  );

  return {
    ...task,
    id: task.uuid ?? task.taskUuid ?? task.task_uuid ?? task.id,
    taskCode: task.taskCode ?? task.task_code ?? task.code ?? task.id,
    title: task.title ?? task.name ?? "Untitled task",
    project: task.project?.name ?? task.projectName ?? task.project_name ?? "—",
    module: task.module?.name ?? task.moduleName ?? task.module_name ?? "—",
    phase: task.phase?.name ?? task.phaseName ?? task.phase_name ?? "—",
    assignedTo: getName(
      task.assignee ??
        task.assignedEmployee ??
        task.assigned_employee ??
        task.assignedToEmployee ??
        task.employee,
    ),
    assignedToUuid:
      task.assignee?.uuid ??
      task.assignedEmployee?.uuid ??
      task.assigned_employee?.uuid ??
      task.assignedToUuid ??
      task.assigned_to_uuid ??
      null,
    priority: task.priority ?? "Low",
    status: task.status ?? "Backlog",
    isBlocked: Boolean(task.isBlocked ?? task.is_blocked),
    blockedReason: task.blockedReason ?? task.blocked_reason ?? null,
    dueDate: task.dueDate ?? task.due_date ?? null,
    estimatedHours: task.estimatedHours ?? task.estimated_hours ?? null,
    actualHours: task.actualHours ?? task.actual_hours ?? null,
    testing,
  };
}

function formatDate(value) {
  if (!value) return "No due date";

  const dateString = String(value).slice(0, 10);
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "No due date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function initials(name) {
  if (!name || name === "Unassigned") return "—";

  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Standardized developer page header                                        */
/* -------------------------------------------------------------------------- */


function PageHeader({ title, subtitle, metadata = [], action }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 -z-10 h-[290px] w-[290px] rounded-full border border-white/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-5 -top-20 -z-10 h-[220px] w-[220px] rounded-full border border-white/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-100px] left-[38%] -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-100">
            Development Workspace
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px]">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            {subtitle}
          </p>

          {metadata.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              {metadata.map((item, index) => (
                <span
                  key={`${item.label}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2"
                >
                  {item.dot && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {action && (
          <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-3 xl:justify-end">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}


/* -------------------------------------------------------------------------- */
/* Summary card                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({ label, value, description, icon, iconStyle }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500 sm:text-sm">
          {label}
        </p>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-[28px] font-bold leading-none tracking-tight text-[#101b32] tabular-nums">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
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
/* Kanban task card                                                           */
/* -------------------------------------------------------------------------- */

function TaskCard({
  task,
  column,
  updating,
  testing,
  onOpen,
  onMove,
  onTestResult,
}) {
  const columnIndex = COLUMNS.indexOf(task.status);
  const isUpdating = updating || testing;

  return (
    <article
      className={`rounded-xl border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        task.isBlocked ? "border-rose-300" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {String(task.taskCode).startsWith("TASK-")
            ? task.taskCode
            : `TASK-${String(task.taskCode).slice(-8)}`}
        </span>

        <Badge tone={PRIORITY_TONE[task.priority] || "neutral"}>
          {task.priority}
        </Badge>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-2 block w-full text-left text-sm font-semibold leading-5 text-[#17233b] transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        {task.title}
      </button>

      <p className="mt-1 text-xs text-slate-500">{task.project}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600">
          {task.module}
        </span>
      </div>

      <p className="mt-2 truncate text-[11px] text-slate-500">
        Phase: {task.phase}
      </p>

      {task.isBlocked && (
        <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
          <strong>Blocked:</strong>{" "}
          {task.blockedReason || "This task is blocked."}
        </div>
      )}

      {column === "Testing" && (
        <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/70 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
            Assigned tester
          </p>

          <p className="mt-1 text-xs font-medium text-violet-950">
            {task.testing?.tester || "Not assigned"}
          </p>

          <p className="mt-1 text-[11px] text-violet-800">
            Result: {task.testing?.status || "Pending"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating || !task.testing?.id}
              onClick={() => onTestResult("Passed")}
            >
              Pass
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating || !task.testing?.id}
              onClick={() => onTestResult("Failed")}
            >
              Fail
            </Button>

            {isUpdating && (
              <Loader context="inline" label="Saving result" />
            )}
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[10px] font-bold text-blue-700">
            {initials(task.assignedTo)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-800">
              {task.assignedTo}
            </p>
            <p className="text-[10px] text-slate-400">Assignee</p>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold text-slate-700">
              {formatDate(task.dueDate)}
            </p>
            <p className="text-[10px] text-slate-400">Due date</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500">
            {task.actualHours ?? 0}/{task.estimatedHours ?? "—"} hrs
          </span>

          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating || columnIndex === 0}
              onClick={() => onMove(-1)}
              aria-label={`Move ${task.title} to previous stage`}
            >
              ←
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={
                isUpdating ||
                columnIndex === COLUMNS.length - 1 ||
                column === "Testing"
              }
              onClick={() => onMove(1)}
              aria-label={`Move ${task.title} to next stage`}
            >
              →
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function KanbanBoard({ projectUuid: projectUuidProp }) {
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [selectedProjectUuid, setSelectedProjectUuid] = useState(
    projectUuidProp ?? "",
  );

  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");

  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [testingIds, setTestingIds] = useState(() => new Set());

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  /* Fetch Kanban board */

  const fetchBoard = useCallback(async () => {
    if (!selectedProjectUuid) {
      abortRef.current?.abort();
      setTasks([]);
      setProject(null);
      setError("");
      setLoading(false);
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `/api/kanban/projects/${encodeURIComponent(selectedProjectUuid)}`,
        {
          signal: controller.signal,
          withCredentials: true,
        },
      );

      const payload = unwrap(response);
      const rawTasks = Array.isArray(payload) ? payload : payload.tasks;

      if (!Array.isArray(rawTasks)) {
        throw new Error(
          "The server returned an invalid Kanban board response.",
        );
      }

      const normalized = rawTasks
        .map(normalizeTask)
        .filter((task) => task.id != null);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setTasks(normalized);

      const selectedProject = projects.find(
        (item) => item.uuid === selectedProjectUuid,
      );

      setProject(
        payload.project ?? payload.data?.project ?? selectedProject ?? null,
      );
    } catch (err) {
      if (
        axios.isCancel(err) ||
        err.code === "ERR_CANCELED" ||
        controller.signal.aborted
      ) {
        return;
      }

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      const message = getErrorMessage(err, "Failed to load the Kanban board.");

      setError(message);
      showToast.error(message);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [selectedProjectUuid, projects]);

  /* Fetch available projects */

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);

    try {
      const response = await axios.get(
        "/api/project-lead/planning/projects",
        {
          withCredentials: true,
        },
      );

      const payload = unwrap(response);
      const rows = Array.isArray(payload) ? payload : payload.projects;

      if (!Array.isArray(rows)) {
        throw new Error("The server returned an invalid projects response.");
      }

      const normalizedProjects = rows
        .map((item) => {
          const project = item.project ?? item;

          return {
            uuid:
              project.uuid ??
              item.uuid ??
              item.projectUuid ??
              item.project_uuid,
            name:
              project.name ??
              project.projectName ??
              project.project_name ??
              item.name ??
              "Untitled project",
          };
        })
        .filter((item) => item.uuid);

      setProjects(normalizedProjects);

      setSelectedProjectUuid((current) => {
        if (
          current &&
          normalizedProjects.some((item) => item.uuid === current)
        ) {
          return current;
        }

        return "";
      });

      setError("");
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load projects.");

      setError(message);
      showToast.error(message);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    mountedRef.current = true;

    fetchBoard();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      abortRef.current?.abort();
    };
  }, [fetchBoard]);

  /* Update task status */

  const updateTaskStatus = useCallback(
    async (taskId, nextStatus) => {
      const task = tasks.find((item) => item.id === taskId);

      if (!task || task.status === nextStatus || updatingIds.has(taskId)) {
        return;
      }

      if (!COLUMNS.includes(nextStatus)) return;

      const previousStatus = task.status;

      setUpdatingIds((current) => new Set(current).add(taskId));

      setTasks((current) =>
        current.map((item) =>
          item.id === taskId ? { ...item, status: nextStatus } : item,
        ),
      );

      try {
        await axios.patch(
          `/api/kanban/tasks/${encodeURIComponent(taskId)}/status`,
          { status: nextStatus },
          { withCredentials: true },
        );

        if (mountedRef.current) {
          showToast.success(`Task moved to ${nextStatus}.`);
        }

        // Refresh server state so generated testing records and UUIDs are picked up.
        await fetchBoard();
      } catch (err) {
        const message = getErrorMessage(err, "Failed to update task status.");

        setTasks((current) =>
          current.map((item) =>
            item.id === taskId && item.status === nextStatus
              ? { ...item, status: previousStatus }
              : item,
          ),
        );

        if (mountedRef.current) {
          showToast.error(message);
        }
      } finally {
        if (mountedRef.current) {
          setUpdatingIds((current) => {
            const next = new Set(current);
            next.delete(taskId);
            return next;
          });
        }
      }
    },
    [tasks, updatingIds, fetchBoard],
  );

  /* Update testing result */

  const updateTestResult = useCallback(
    async (task, result) => {
      const testingUuid = task.testing?.id;

      if (!testingUuid) {
        showToast.error(
          "No testing record was found for this task. Refresh the board and try again.",
        );
        return;
      }

      if (testingIds.has(task.id)) return;

      setTestingIds((current) => new Set(current).add(task.id));

      try {
        await axios.patch(
          `/api/kanban/testing/${encodeURIComponent(testingUuid)}/result`,
          {
            status: result,
            testNotes: task.testing?.testNotes ?? "",
          },
          { withCredentials: true },
        );

        showToast.success(`Test result saved: ${result}.`);

        setSelectedTaskId(null);

        await fetchBoard();
      } catch (err) {
        showToast.error(
          getErrorMessage(err, "Failed to save the test result."),
        );
      } finally {
        if (mountedRef.current) {
          setTestingIds((current) => {
            const next = new Set(current);
            next.delete(task.id);
            return next;
          });
        }
      }
    },
    [testingIds, fetchBoard],
  );

  /* Search and priority filtering */

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const searchable = [
        task.taskCode,
        task.title,
        task.project,
        task.module,
        task.phase,
        task.assignedTo,
        task.priority,
        task.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (priorityFilter === "All priorities" ||
          task.priority === priorityFilter)
      );
    });
  }, [tasks, search, priorityFilter]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const doneCount = tasks.filter((task) => task.status === "Done").length;

  const activeCount = tasks.filter((task) =>
    ["In Progress", "Code Review", "Testing"].includes(task.status),
  ).length;

  const blockedCount = tasks.filter((task) => task.isBlocked).length;

  /* Move task between adjacent workflow columns */

  const moveTask = (task, direction) => {
    const currentIndex = COLUMNS.indexOf(task.status);

    const nextIndex = Math.max(
      0,
      Math.min(COLUMNS.length - 1, currentIndex + direction),
    );

    if (nextIndex === currentIndex) return;

    const nextStatus = COLUMNS[nextIndex];

    if (
      task.status === "Testing" &&
      nextStatus === "Done" &&
      task.testing?.status !== "Passed"
    ) {
      showToast.error("A task can only move to Done after its test passes.");
      return;
    }

    updateTaskStatus(task.id, nextStatus);
  };

  const summaryCards = [
    {
      label: "Total tasks",
      value: tasks.length,
      description: "In this project",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      ),
      iconStyle: "bg-blue-50 text-blue-700",
    },
    {
      label: "Active work",
      value: activeCount,
      description: "Development to testing",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      label: "Completed",
      value: doneCount,
      description: "Marked as done",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      ),
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Blocked",
      value: blockedCount,
      description: "Need attention",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M12 3 22 20H2L12 3Z" />
          <path d="M12 9v5m0 3h.01" />
        </svg>
      ),
      iconStyle: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <main className="flex min-w-0 flex-col gap-6">
      {/* Standardized page header */}

      <PageHeader
        title="Kanban Board"
        subtitle={
          project?.name
            ? `${project.name} · Move work through development, review, and testing.`
            : "Track tasks across development, review, and testing stages."
        }
        metadata={[
          { label: "Development workspace", dot: true },
          {
            label: projectsLoading
              ? "Loading projects..."
              : `${projects.length} available project${projects.length === 1 ? "" : "s"}`,
          },
        ]}
        action={
          <>
            <Button
              variant="outline"
              disabled={loading || !selectedProjectUuid}
              onClick={fetchBoard}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader context="inline" />
                  Refreshing...
                </span>
              ) : (
                "Refresh"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setPriorityFilter("All priorities");
              }}
            >
              Reset filters
            </Button>
          </>
        }
      />

      {/* Project selection */}

      <section className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl flex-1">
            <h2 className="text-sm font-bold text-[#101b32]">
              Project workspace
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Select a project to view its development tasks and workflow.
            </p>

            <div className="mt-3">
              <Select
                label="Select project"
                value={selectedProjectUuid}
                placeholder={
                  projectsLoading ? "Loading projects..." : "Choose a project"
                }
                disabled={projectsLoading || projects.length === 0}
                options={projects.map((item) => ({
                  value: item.uuid,
                  label: item.name,
                }))}
                onChange={(value) => {
                  const uuid = getSelectValue(value);

                  setSelectedProjectUuid(uuid);
                  setTasks([]);
                  setProject(
                    projects.find((item) => item.uuid === uuid) ?? null,
                  );
                  setSelectedTaskId(null);
                  setError("");
                  setSearch("");
                  setPriorityFilter("All priorities");
                }}
              />
            </div>

            {!projectsLoading && projects.length === 0 && !error && (
              <p className="mt-2 text-xs text-slate-500">
                No projects available to display.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {selectedProjectUuid ? "Project selected" : "Awaiting selection"}
          </div>
        </div>
      </section>

      {/* Error state */}

      {error && !loading && (
        <div role="alert">
          <ErrorState
            title={
              selectedProjectUuid
                ? "Unable to load Kanban board"
                : "Unable to load projects"
            }
            description={error}
            onRetry={selectedProjectUuid ? fetchBoard : fetchProjects}
          />
        </div>
      )}

      {/* Summary */}

      <section className="flex flex-col gap-4" aria-busy={loading}>
        <SectionHeading
          title="Board Overview"
          subtitle="Current task distribution across your selected project."
          trailing={
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500">
              {loading ? "Updating totals..." : "Live task totals"}
            </span>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <SummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      {/* Search and filters */}

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Task Filters"
          subtitle="Find tasks by name, module, phase, assignee or priority."
          trailing={
            <span className="text-xs font-medium text-slate-500">
              {filteredTasks.length} matching tasks
            </span>
          }
        />

        <div className="grid gap-3 rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
          <div className="min-w-0">
            <Input
              label="Search tasks"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task, module, phase, or assignee..."
            />
          </div>

          <div className="min-w-0">
            <Select
              label="Priority"
              value={priorityFilter}
              options={PRIORITIES.map((value) => ({
                value,
                label: value,
              }))}
              onChange={(value) => setPriorityFilter(getSelectValue(value))}
            />
          </div>
        </div>
      </section>

      {/* Kanban board */}

      <section className="flex min-w-0 flex-col gap-4" aria-label="Kanban board">
        <SectionHeading
          title="Development Workflow"
          subtitle="Move tasks between stages using the task controls."
          trailing={
            <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 md:inline-flex">
              6 workflow stages
            </span>
          }
        />

        <div aria-busy={loading}>
          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-[16px] border border-slate-200 bg-white">
              <Loader context="section" label="Loading Kanban board..." />
            </div>
          ) : error ? (
            <div className="rounded-[16px] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              The board could not be loaded. Use Retry above.
            </div>
          ) : !selectedProjectUuid ? (
            <div className="rounded-[16px] border border-slate-200 bg-white p-6">
              <EmptyState
                title="Select a project"
                description="Choose a project above to load its Kanban board."
              />
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-[16px] border border-slate-200 bg-white p-6">
              <EmptyState
                title="No tasks found"
                description="Tasks for this project will appear here when they are created."
              />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-[16px] border border-slate-200 bg-white p-6">
              <EmptyState
                title="No matching tasks"
                description="Try changing your search or priority filter."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setPriorityFilter("All priorities");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <strong className="text-[#101b32]">
                    {filteredTasks.length}
                  </strong>{" "}
                  of {tasks.length} tasks
                </p>

                <p className="text-xs text-slate-400">
                  Use arrows on each card to move tasks between stages.
                </p>
              </div>

              <div className="overflow-x-auto rounded-[16px] border border-slate-200 bg-slate-50/70 p-3 pb-4">
                <div className="grid min-w-[1320px] grid-cols-6 items-start gap-3">
                  {COLUMNS.map((column) => {
                    const columnTasks = filteredTasks.filter(
                      (task) => task.status === column,
                    );

                    const dotTone = COLUMN_DOT[column];

                    return (
                      <section
                        key={column}
                        className="min-h-[460px] overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="border-b border-slate-100 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotTone}`}
                              />

                              <h3 className="truncate text-xs font-bold text-[#17233b]">
                                {column}
                              </h3>
                            </div>

                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 tabular-nums">
                              {columnTasks.length}
                            </span>
                          </div>

                          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${dotTone}`}
                              style={{
                                width: `${
                                  tasks.length
                                    ? (columnTasks.length / tasks.length) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 p-2.5">
                          {columnTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              column={column}
                              updating={updatingIds.has(task.id)}
                              testing={testingIds.has(task.id)}
                              onOpen={() => setSelectedTaskId(task.id)}
                              onMove={(direction) => moveTask(task, direction)}
                              onTestResult={(result) =>
                                updateTestResult(task, result)
                              }
                            />
                          ))}

                          {columnTasks.length === 0 && (
                            <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 text-center">
                              <span className="text-xl text-slate-300">
                                +
                              </span>

                              <p className="mt-1 text-xs font-medium text-slate-400">
                                No tasks here
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Task details modal */}

      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTaskId(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-dialog-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-2xl"
          >
            {/* Standardized modal header */}

            
<div className="relative overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-5 py-5 text-white sm:px-6 sm:py-6">
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -right-8 -top-20 h-44 w-44 rounded-full border border-white/10"
  />

  <div className="relative flex items-start justify-between gap-4">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-100">
          Task Details
        </span>

        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">
          {String(selectedTask.taskCode).startsWith("TASK-")
            ? selectedTask.taskCode
            : `TASK-${String(selectedTask.taskCode).slice(-8)}`}
        </span>
      </div>

      <h2
        id="task-dialog-title"
        className="mt-2 break-words text-lg font-bold leading-snug tracking-tight text-white sm:text-xl"
      >
        {selectedTask.title}
      </h2>

      <p className="mt-1 text-xs text-slate-300">
        Review task information and the latest testing details.
      </p>
    </div>

    <button
      type="button"
      onClick={() => setSelectedTaskId(null)}
      aria-label="Close task details"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.08] text-white transition-colors hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="m18 6-12 12M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>


            {/* Modal content */}

            <div className="max-h-[65vh] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge
                  tone={PRIORITY_TONE[selectedTask.priority] || "neutral"}
                >
                  {selectedTask.priority}
                </Badge>

                <Badge tone="neutral">{selectedTask.status}</Badge>

                {selectedTask.isBlocked && (
                  <Badge tone="danger">Blocked</Badge>
                )}
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["Project", selectedTask.project],
                  ["Module", selectedTask.module],
                  ["Phase", selectedTask.phase],
                  ["Assignee", selectedTask.assignedTo],
                  ["Due date", formatDate(selectedTask.dueDate)],
                  [
                    "Estimated hours",
                    selectedTask.estimatedHours != null
                      ? `${selectedTask.estimatedHours} hrs`
                      : "—",
                  ],
                  [
                    "Actual hours",
                    selectedTask.actualHours != null
                      ? `${selectedTask.actualHours} hrs`
                      : "—",
                  ],
                  [
                    "Blocked",
                    selectedTask.isBlocked
                      ? selectedTask.blockedReason || "Yes"
                      : "No",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5"
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </dt>

                    <dd className="mt-1.5 break-words text-sm font-medium text-[#17233b]">
                      {value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>

              {selectedTask.testing && (
                <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-violet-950">
                      Testing details
                    </h3>

                    <Badge
                      tone={
                        selectedTask.testing.status === "Passed"
                          ? "success"
                          : selectedTask.testing.status === "Failed"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {selectedTask.testing.status}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                        Assigned tester
                      </p>

                      <p className="mt-1 text-sm font-medium text-violet-950">
                        {selectedTask.testing.tester}
                      </p>
                    </div>
                  </div>

                  {selectedTask.testing.testNotes && (
                    <div className="mt-3 border-t border-violet-100 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                        Test notes
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-violet-950">
                        {selectedTask.testing.testNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <Button
                variant="outline"
                onClick={() => setSelectedTaskId(null)}
              >
                Close
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
