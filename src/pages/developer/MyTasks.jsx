import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

const STATUSES = [
  "Backlog",
  "To Do",
  "In Progress",
  "Code Review",
  "Testing",
  "Done",
];

const PRIORITY_TONE = {
  Critical: "danger",
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

const STATUS_TONE = {
  Backlog: "neutral",
  "To Do": "neutral",
  "In Progress": "warning",
  "Code Review": "warning",
  Testing: "info",
  Done: "success",
};

const getSelectValue = (value) => value?.target?.value ?? value;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const normalizeTask = (task) => {
  const testingRecords = [...(task.testingRecords || [])].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime() ||
      String(b.uuid).localeCompare(String(a.uuid)),
  );

  const latestTest = testingRecords[0] || null;

  return {
    ...task,

    taskId: task.id ?? task.taskId ?? "—",
    id: task.uuid ?? task.id,

    title: task.title || "Untitled task",

    project: task.project?.name || "—",
    module: task.module?.name || "—",
    phase: task.phase?.name || "—",

    priority: task.priority || "Low",
    status: task.status || "Backlog",

    isBlocked: Boolean(task.isBlocked ?? task.is_blocked ?? false),

    dueDate: task.dueDate ?? task.due_date ?? null,

    estimatedHours: task.estimatedHours ?? task.estimated_hours ?? null,

    testingRecords,
    latestTest,
    testStatus: latestTest?.status || null,
    testNotes: latestTest?.testNotes || null,
    testedAt: latestTest?.testedAt || null,
  };
};

const formatDate = (value) => {
  if (!value) return "—";

  const dateString = String(value).slice(0, 10);

  // Avoid timezone shifts for date-only values.
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // A Set allows different task rows to update independently.
  const [updatingIds, setUpdatingIds] = useState(() => new Set());

  const mountedRef = useRef(false);
  const fetchControllerRef = useRef(null);
  const fetchRequestIdRef = useRef(0);

  /**
   * Fetch tasks.
   *
   * A request ID prevents an older request from overwriting
   * the result of a newer request.
   */
  const fetchTasks = useCallback(async () => {
    fetchControllerRef.current?.abort();

    const controller = new AbortController();
    fetchControllerRef.current = controller;

    const requestId = ++fetchRequestIdRef.current;

    setLoading(true);
    setError("");

    try {
      const response = await axios.get("/api/my-tasks", {
        signal: controller.signal,
      });

      const payload = response.data?.data ?? response.data;
      const data = Array.isArray(payload) ? payload : null;

      if (!data) {
        throw new Error("The server returned an invalid tasks response.");
      }

      const normalizedTasks = data
        .map(normalizeTask)
        .filter((task) => task.id != null);

      if (!mountedRef.current || requestId !== fetchRequestIdRef.current) {
        return;
      }

      setTasks(normalizedTasks);
    } catch (err) {
      if (
        axios.isCancel(err) ||
        err.code === "ERR_CANCELED" ||
        controller.signal.aborted
      ) {
        return;
      }

      if (!mountedRef.current || requestId !== fetchRequestIdRef.current) {
        return;
      }

      const message = getErrorMessage(err, "Failed to fetch your tasks.");

      setError(message);
      showToast.error(message);
    } finally {
      if (mountedRef.current && requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    fetchTasks();

    return () => {
      mountedRef.current = false;
      fetchRequestIdRef.current += 1;
      fetchControllerRef.current?.abort();
    };
  }, [fetchTasks]);

  /**
   * Update task status optimistically.
   *
   * Only the affected task is rolled back on failure, so a failed
   * request cannot overwrite other tasks updated in the meantime.
   */
  const updateStatus = useCallback(
    async (taskUuid, nextStatus) => {
      if (!STATUSES.includes(nextStatus)) return;

      const currentTask = tasks.find((task) => task.id === taskUuid);

      if (
        !currentTask ||
        currentTask.status === nextStatus ||
        updatingIds.has(taskUuid)
      ) {
        return;
      }

      const previousStatus = currentTask.status;

      setUpdatingIds((current) => {
        const next = new Set(current);
        next.add(taskUuid);
        return next;
      });

      setError("");

      // Optimistic update for a responsive UI.
      setTasks((current) =>
        current.map((task) =>
          task.id === taskUuid ? { ...task, status: nextStatus } : task,
        ),
      );

      try {
        await axios.patch(
          `/api/my-tasks/${encodeURIComponent(taskUuid)}/status`,
          { status: nextStatus },
        );

        if (mountedRef.current) {
          showToast.success(`Task status updated to "${nextStatus}".`);
        }
      } catch (err) {
        const message = getErrorMessage(err, "Failed to update task status.");

        // Roll back only if this task still has our optimistic value.
        setTasks((current) =>
          current.map((task) =>
            task.id === taskUuid && task.status === nextStatus
              ? { ...task, status: previousStatus }
              : task,
          ),
        );

        if (mountedRef.current) {
          setError(message);
          showToast.error(message);
        }
      } finally {
        if (mountedRef.current) {
          setUpdatingIds((current) => {
            const next = new Set(current);
            next.delete(taskUuid);
            return next;
          });
        }
      }
    },
    [tasks, updatingIds],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = filter === "All" || task.status === filter;

      const searchableValues = [
        task.taskId,
        task.title,
        task.project,
        task.module,
        task.phase,
        task.priority,
        task.status,
        task.isBlocked ? "blocked" : "not blocked",
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );

      return matchesStatus && matchesSearch;
    });
  }, [tasks, search, filter]);

  const summary = useMemo(
    () => [
      {
        label: "Total tasks",
        value: tasks.length,
        description: "Assigned to you",
      },
      {
        label: "In progress",
        value: tasks.filter((task) => task.status === "In Progress").length,
        description: "Currently being worked on",
      },
      {
        label: "In testing",
        value: tasks.filter((task) => task.status === "Testing").length,
        description: "Awaiting verification",
      },
      {
        label: "Blocked",
        value: tasks.filter((task) => task.isBlocked).length,
        description: "Need attention",
      },
    ],
    [tasks],
  );

  const columns = useMemo(
    () => [
      {
        key: "taskId",
        header: "Task ID",
      },
      {
        key: "title",
        header: "Task",
        render: (row) => (
          <span className="font-medium text-cm-text">{row.title}</span>
        ),
      },
      {
        key: "project",
        header: "Project",
      },
      {
        key: "module",
        header: "Module",
      },
      {
        key: "phase",
        header: "Phase",
      },
      {
        key: "priority",
        header: "Priority",
        render: (row) => (
          <Badge tone={PRIORITY_TONE[row.priority] || "neutral"}>
            {row.priority}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => {
          const isUpdating = updatingIds.has(row.id);

          return (
            <div className="flex min-w-40 items-center gap-2">
              <div className="min-w-0 flex-1">
                <Select
                  value={row.status}
                  disabled={isUpdating}
                  options={STATUSES.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                  onChange={(value) =>
                    updateStatus(row.id, getSelectValue(value))
                  }
                />
              </div>

              {isUpdating && (
                <Loader context="inline" label="Updating status" />
              )}
            </div>
          );
        },
      },
      {
        key: "isBlocked",
        header: "Blocked",
        render: (row) =>
          row.isBlocked ? (
            <Badge tone="danger">Blocked</Badge>
          ) : (
            <Badge tone="neutral">No</Badge>
          ),
      },
      {
        key: "dueDate",
        header: "Due Date",
        render: (row) => formatDate(row.dueDate),
      },
      {
        key: "estimatedHours",
        header: "Est. Hours",
        render: (row) =>
          row.estimatedHours != null ? `${row.estimatedHours}h` : "—",
      },

      {
        key: "testResult",
        header: "Test Result",
        render: (row) => (
          <div className="flex min-w-40 flex-col gap-2">
            {row.testStatus ? (
              <Badge
                tone={
                  row.testStatus === "Passed"
                    ? "success"
                    : row.testStatus === "Failed"
                      ? "danger"
                      : row.testStatus === "In Progress"
                        ? "info"
                        : "neutral"
                }
              >
                {row.testStatus}
              </Badge>
            ) : (
              <span className="text-sm text-cm-text-muted">Not tested</span>
            )}

            {(row.testStatus === "Failed" || row.testStatus === "Passed") &&
              row.testNotes && (
                <p
                  className="max-w-64 whitespace-normal text-xs text-cm-text-muted"
                  title={row.testNotes}
                >
                  {row.testNotes}
                </p>
              )}

            {row.testedAt && (
              <span className="text-xs text-cm-text-muted">
                {formatDate(row.testedAt)}
              </span>
            )}
          </div>
        ),
      },
    ],
    [updatingIds, updateStatus],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cm-text">My Tasks</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Tasks assigned to you across your projects, modules, and phases.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={fetchTasks}
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
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-cm-border bg-cm-surface p-4"
          >
            <p className="text-sm text-cm-text-muted">{item.label}</p>

            <p className="mt-2 text-2xl font-semibold text-cm-text">
              {item.value}
            </p>

            <p className="mt-1 text-xs text-cm-text-muted">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div role="alert">
          <ErrorState
            title="Unable to load tasks"
            description={error}
            onRetry={fetchTasks}
          />
        </div>
      )}

      {/* Search and filters */}
      <div className="grid gap-4 md:grid-cols-2">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search tasks, projects, modules..."
        />

        <Select
          label="Status"
          value={filter}
          options={[
            { value: "All", label: "All statuses" },
            ...STATUSES.map((status) => ({
              value: status,
              label: status,
            })),
          ]}
          onChange={(value) => setFilter(getSelectValue(value))}
        />
      </div>

      {/* Main content */}
      <section
        className="min-w-0 rounded-lg border border-cm-border bg-cm-surface"
        aria-label="My tasks list"
        aria-busy={loading}
      >
        {loading ? (
          <Loader context="section" label="Loading your tasks..." />
        ) : error ? (
          <div className="p-4 text-center text-sm text-cm-text-muted">
            Your task list could not be loaded. Use Retry above.
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks assigned"
            description="Tasks assigned to you will appear here."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No matching tasks"
            description="Try changing your search or status filter."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            emptyMessage="No tasks found."
          />
        )}
      </section>
    </div>
  );
}
