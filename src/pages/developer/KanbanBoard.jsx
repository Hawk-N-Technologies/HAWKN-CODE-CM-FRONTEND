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
  const list = Array.isArray(records) ? records : records ? [records] : [];
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
      if (!Array.isArray(rawTasks))
        throw new Error(
          "The server returned an invalid Kanban board response.",
        );
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
      )
        return;
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      const message = getErrorMessage(err, "Failed to load the Kanban board.");
      setError(message);
      showToast.error(message);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current)
        setLoading(false);
    }
  }, [selectedProjectUuid, projects]);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await axios.get("/api/project-lead/planning/projects", {
        withCredentials: true,
      });
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
        if (current && normalizedProjects.some((item) => item.uuid === current))
          return current;
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

  const updateTaskStatus = useCallback(
    async (taskId, nextStatus) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task || task.status === nextStatus || updatingIds.has(taskId))
        return;
      if (!COLUMNS.includes(nextStatus)) return;

      // The backend requires a tester UUID when a task enters Testing.

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
          {
            status: nextStatus,
          },
          { withCredentials: true },
        );
        if (mountedRef.current)
          showToast.success(`Task moved to ${nextStatus}.`);
        // Refresh server state so generated testing records/UUIDs are picked up.
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
        if (mountedRef.current) showToast.error(message);
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cm-text-muted">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Project
            workspace
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-cm-text">
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            {project?.name ? `${project.name} · ` : ""}Move work through
            development, review, and testing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading} onClick={fetchBoard}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader context="inline" /> Refreshing...
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
        </div>
      </header>

      <section
        className="rounded-cm-lg border border-cm-border bg-cm-card p-4"
        aria-busy={projectsLoading || loading}
      >
        <div className="max-w-xl">
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
              setProject(projects.find((item) => item.uuid === uuid) ?? null);
              setSelectedTaskId(null);
              setError("");
              setSearch("");
              setPriorityFilter("All priorities");
            }}
          />
          {!projectsLoading && projects.length === 0 && !error && (
            <p className="mt-2 text-sm text-cm-text-muted">
              No projects available to display.
            </p>
          )}
        </div>
      </section>

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

      <section
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
        aria-busy={loading}
      >
        {[
          ["Total tasks", tasks.length, "In this project"],
          ["Active work", activeCount, "Development to testing"],
          ["Completed", doneCount, "Marked as done"],
          ["Blocked", blockedCount, "Need attention"],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-cm-text-muted">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-cm-text">
              {value}
            </p>
            <p className="mt-1 text-xs text-cm-text-muted">{detail}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-cm-lg border border-cm-border bg-cm-card p-3 md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search tasks</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cm-text-muted">
            ⌕
          </span>
          <Input
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search task, module, phase, or assignee..."
            className="w-full rounded-lg border border-cm-border bg-cm-card py-2.5 pl-9 pr-3 text-sm text-cm-text outline-none focus:border-blue-500"
          />
        </label>
        <div className="min-w-44">
          <Select
            label="Priority"
            value={priorityFilter}
            options={PRIORITIES.map((value) => ({ value, label: value }))}
            onChange={(value) => setPriorityFilter(getSelectValue(value))}
          />
        </div>
      </section>

      <section aria-label="Kanban board" aria-busy={loading}>
        {loading ? (
          <Loader context="section" label="Loading Kanban board..." />
        ) : error ? (
          <div className="p-4 text-center text-sm text-cm-text-muted">
            The board could not be loaded. Use Retry above.
          </div>
        ) : !selectedProjectUuid ? (
          <EmptyState
            title="Select a project"
            description="Choose a project above to load its Kanban board."
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Tasks for this project will appear here when they are created."
          />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            title="No matching tasks"
            description="Try changing your search or filters."
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
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-cm-text-muted">
                Showing{" "}
                <strong className="text-cm-text">{filteredTasks.length}</strong>{" "}
                of {tasks.length} tasks
              </p>
              <p className="hidden text-xs text-cm-text-muted md:block">
                Use arrows to move tasks between stages
              </p>
            </div>
            <div className="overflow-x-auto pb-3">
              <div className="grid min-w-[1320px] grid-cols-6 items-start gap-3">
                {COLUMNS.map((column) => {
                  const columnTasks = filteredTasks.filter(
                    (task) => task.status === column,
                  );
                  const dotTone = COLUMN_DOT[column];
                  return (
                    <section
                      key={column}
                      className="min-h-[460px] overflow-hidden rounded-xl border border-cm-border bg-cm-card"
                    >
                      <div className="border-b border-cm-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotTone}`}
                            />
                            <h2 className="truncate text-xs font-bold text-cm-text">
                              {column}
                            </h2>
                          </div>
                          <span className="rounded-md bg-cm-bg px-2 py-1 text-xs font-semibold text-cm-text-muted">
                            {columnTasks.length}
                          </span>
                        </div>
                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-cm-bg">
                          <div
                            className={`h-full rounded-full ${dotTone}`}
                            style={{
                              width: `${tasks.length ? (columnTasks.length / tasks.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-2.5">
                        {columnTasks.map((task) => {
                          const isUpdating =
                            updatingIds.has(task.id) || testingIds.has(task.id);
                          const columnIndex = COLUMNS.indexOf(task.status);
                          return (
                            <article
                              key={task.id}
                              className={`rounded-lg border bg-cm-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${task.isBlocked ? "border-rose-300" : "border-cm-border"}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-cm-text-muted">
                                  {String(task.taskCode).startsWith("TASK-")
                                    ? task.taskCode
                                    : `TASK-${String(task.taskCode).slice(-8)}`}
                                </span>
                                <Badge
                                  tone={
                                    PRIORITY_TONE[task.priority] || "neutral"
                                  }
                                >
                                  {task.priority}
                                </Badge>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedTaskId(task.id)}
                                className="mt-2 block w-full text-left text-sm font-semibold leading-5 text-cm-text hover:text-blue-600"
                              >
                                {task.title}
                              </button>
                              <p className="mt-1 text-xs text-cm-text-muted">
                                {task.project}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                <span className="rounded-md bg-cm-bg px-2 py-1 text-[10px] font-medium text-cm-text-muted">
                                  {task.module}
                                </span>
                              </div>
                              <p className="mt-2 truncate text-[11px] text-cm-text-muted">
                                Phase: {task.phase}
                              </p>
                              {task.isBlocked && (
                                <div className="mt-3 rounded-md bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
                                  <strong>Blocked:</strong>{" "}
                                  {task.blockedReason ||
                                    "This task is blocked."}
                                </div>
                              )}
                              {column === "Testing" && (
                                <div className="mt-3 rounded-md border border-violet-200 bg-violet-50 p-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                                    Assigned tester
                                  </p>
                                  <p className="mt-1 text-xs font-medium text-violet-900">
                                    {task.testing?.tester || "Not assigned"}
                                  </p>
                                  <p className="mt-1 text-[11px] text-violet-800">
                                    Result: {task.testing?.status || "Pending"}
                                  </p>
                                  <div className="mt-2 flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isUpdating || !task.testing?.id}
                                      onClick={() =>
                                        updateTestResult(task, "Passed")
                                      }
                                    >
                                      Pass
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isUpdating || !task.testing?.id}
                                      onClick={() =>
                                        updateTestResult(task, "Failed")
                                      }
                                    >
                                      Fail
                                    </Button>
                                    {isUpdating && (
                                      <Loader context="inline" label="Saving" />
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="mt-3 border-t border-cm-border pt-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cm-bg text-[10px] font-bold text-cm-text">
                                    {initials(task.assignedTo)}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-cm-text">
                                      {task.assignedTo}
                                    </p>
                                    <p className="text-[10px] text-cm-text-muted">
                                      Assignee
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] font-semibold text-cm-text">
                                      {formatDate(task.dueDate)}
                                    </p>
                                    <p className="text-[10px] text-cm-text-muted">
                                      Due date
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-2">
                                  <span className="text-[10px] text-cm-text-muted">
                                    {task.actualHours ?? 0}/
                                    {task.estimatedHours ?? "—"} hrs
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isUpdating || columnIndex === 0}
                                      onClick={() => moveTask(task, -1)}
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
                                      onClick={() => moveTask(task, 1)}
                                    >
                                      →
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                        {columnTasks.length === 0 && (
                          <div className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-cm-border px-3 text-center">
                            <span className="text-lg text-cm-text-muted">
                              ＋
                            </span>
                            <p className="mt-1 text-xs font-medium text-cm-text-muted">
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
      </section>

      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedTaskId(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-dialog-title"
            className="w-full max-w-lg rounded-xl border border-cm-border bg-cm-card p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cm-text-muted">
                  {String(selectedTask.taskCode).startsWith("TASK-")
                    ? selectedTask.taskCode
                    : `TASK-${String(selectedTask.taskCode).slice(-8)}`}
                </p>
                <h2
                  id="task-dialog-title"
                  className="mt-1 text-lg font-bold text-cm-text"
                >
                  {selectedTask.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                aria-label="Close task details"
                className="rounded-md px-2 py-1 text-cm-text-muted hover:bg-cm-bg"
              >
                ✕
              </button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Project", selectedTask.project],
                ["Module", selectedTask.module],
                ["Phase", selectedTask.phase],
                ["Assignee", selectedTask.assignedTo],
                ["Priority", selectedTask.priority],
                ["Status", selectedTask.status],
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
                <div key={label} className="rounded-lg bg-cm-bg p-3">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-cm-text-muted">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-medium text-cm-text">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
            {selectedTask.testing && (
              <div className="mt-4 rounded-lg border border-cm-border p-3">
                <h3 className="text-sm font-semibold text-cm-text">
                  Testing details
                </h3>
                <p className="mt-2 text-xs text-cm-text-muted">
                  Tester: {selectedTask.testing.tester}
                </p>
                <p className="mt-1 text-xs text-cm-text-muted">
                  Result: {selectedTask.testing.status}
                </p>
                {selectedTask.testing.testNotes && (
                  <p className="mt-2 text-sm text-cm-text">
                    {selectedTask.testing.testNotes}
                  </p>
                )}
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedTaskId(null)}>
                Close
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
