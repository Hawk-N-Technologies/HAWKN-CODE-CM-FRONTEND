import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ClipboardList,
  Clock3,
  RefreshCw,
  Search,
  ShieldAlert,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";

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
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

function PageHeader({ title, subtitle, metadata = [], action }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-28 -z-10 h-[290px] w-[290px] rounded-full border border-blue-300/15"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-5 -top-20 -z-10 h-[220px] w-[220px] rounded-full border border-indigo-300/15"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-1/3 bg-gradient-to-l from-blue-400/10 to-transparent"
      />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-blue-300/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-[11px]">
              Development
            </p>
          </div>

          <h1 className="break-words text-3xl font-semibold tracking-tight text-white sm:text-[34px]">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            {subtitle}
          </p>

          {metadata.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {metadata.map((item, index) => (
                <span
                  key={`${item.label}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-slate-200 sm:text-xs"
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
          <div className="relative z-10 flex shrink-0 items-center xl:justify-end">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500 sm:text-sm">
          {item.label}
        </p>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBackground} ${item.iconColor}`}
        >
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-4 text-[28px] font-bold leading-none tracking-tight text-[#101b32] tabular-nums">
        {item.value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{item.description}</p>
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
        icon: ClipboardList,
        iconBackground: "bg-blue-50",
        iconColor: "text-blue-700",
      },
      {
        label: "In progress",
        value: tasks.filter((task) => task.status === "In Progress").length,
        description: "Currently being worked on",
        icon: Clock3,
        iconBackground: "bg-amber-50",
        iconColor: "text-amber-700",
      },
      {
        label: "In testing",
        value: tasks.filter((task) => task.status === "Testing").length,
        description: "Awaiting verification",
        icon: FlaskConical,
        iconBackground: "bg-violet-50",
        iconColor: "text-violet-700",
      },
      {
        label: "Blocked",
        value: tasks.filter((task) => task.isBlocked).length,
        description: "Need attention",
        icon: ShieldAlert,
        iconBackground: "bg-rose-50",
        iconColor: "text-rose-700",
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
    <main className="flex flex-col gap-6">
      {/* Standardized developer page header */}
      <PageHeader
        title="My Tasks"
        subtitle="Tasks assigned to you across your projects, modules, and phases."
        metadata={[
          { label: "Task workspace", dot: true },
          {
            label: loading
              ? "Loading records..."
              : `${tasks.length} assigned task${tasks.length === 1 ? "" : "s"}`,
          },
        ]}
        action={
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
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={15} />
                Refresh
              </span>
            )}
          </Button>
        }
      />

      {/* Task summary */}
      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Task Overview"
          subtitle="A summary of your assigned development work."
          trailing={
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500">
              Live task totals
            </span>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <SummaryCard key={item.label} item={item} />
          ))}
        </div>
      </section>

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

      {/* Task list */}
      <section className="flex min-w-0 flex-col gap-4">
        <SectionHeading
          title="Assigned Tasks"
          subtitle="Search tasks, review their details and update your task status."
          trailing={
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500">
              {rows.length} matching records
            </span>
          }
        />

        {/* Search and filters */}
        <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <TableSearch
                value={search}
                onChange={setSearch}
                placeholder="Search tasks, projects, modules..."
              />
            </div>

            <div className="min-w-0">
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
          </div>
        </div>

        {/* Main task table */}
        <section
          className="min-w-0 overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm"
          aria-label="My tasks list"
          aria-busy={loading}
        >
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader context="section" label="Loading your tasks..." />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-slate-500">
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
      </section>
    </main>
  );
}