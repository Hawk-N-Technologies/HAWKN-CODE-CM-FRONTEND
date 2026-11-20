import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  Code2,
  GripVertical,
  Layers3,
  ListTodo,
  Users,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";
import {
  getErrorMessage,
  getMyProjects,
} from "../../services/developerProjectService";

// The real task workflow (same order as the backend)
const COLUMNS = [
  "Backlog",
  "To Do",
  "In Progress",
  "Code Review",
  "Testing",
  "Done",
];

// Done is permanently locked by the backend
const LOCKED_COLUMN = "Done";

const KANBAN_API = "/api/kanban";
const axiosConfig = { withCredentials: true };

const shortTaskId = (uuid) => `TASK-${String(uuid).slice(0, 6).toUpperCase()}`;

const COLUMN_STYLES = {
  Backlog: {
    accent: "bg-slate-400",
    icon: Circle,
    iconColor: "text-slate-500",
    count: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
  },
  "In Progress": {
    accent: "bg-blue-500",
    icon: Activity,
    iconColor: "text-blue-600",
    count: "bg-blue-50 text-blue-700",
    border: "border-blue-100",
  },
  "Code Review": {
    accent: "bg-indigo-500",
    icon: Code2,
    iconColor: "text-indigo-600",
    count: "bg-indigo-50 text-indigo-700",
    border: "border-indigo-100",
  },
  Testing: {
    accent: "bg-violet-500",
    icon: Layers3,
    iconColor: "text-violet-600",
    count: "bg-violet-50 text-violet-700",
    border: "border-violet-100",
  },
  "To Do": {
    accent: "bg-amber-500",
    icon: Users,
    iconColor: "text-amber-600",
    count: "bg-amber-50 text-amber-700",
    border: "border-amber-100",
  },
  Done: {
    accent: "bg-emerald-500",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    count: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-100",
  },
};

const PRIORITY_STYLES = {
  High: {
    tone: "danger",
    dot: "bg-red-500",
    label: "High",
  },
  Medium: {
    tone: "warning",
    dot: "bg-amber-500",
    label: "Medium",
  },
  Low: {
    tone: "neutral",
    dot: "bg-slate-400",
    label: "Low",
  },
};

const MetricCard = ({
  icon: Icon,
  label,
  value,
  description,
  accent,
}) => (
  <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
    >
      <Icon size={21} />
    </div>

    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold leading-none text-slate-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 truncate text-xs text-slate-400">
          {description}
        </p>
      )}
    </div>
  </div>
);

function KanbanBoard() {
  const [projects, setProjects] = useState([]);
  const [projectUuid, setProjectUuid] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingUuid, setMovingUuid] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Projects this developer leads → first one selected
  useEffect(() => {
    let ignore = false;

    getMyProjects()
      .then((list) => {
        if (ignore) return;
        setProjects(list);
        if (list.length) setProjectUuid(list[0].uuid);
        else setIsLoading(false);
      })
      .catch((error) => {
        if (ignore) return;
        showToast.error(getErrorMessage(error, "Couldn't load your projects."));
        setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Board of the selected project
  useEffect(() => {
    if (!projectUuid) return undefined;
    let ignore = false;

    axios
      .get(`${KANBAN_API}/projects/${projectUuid}`, axiosConfig)
      .then((response) => {
        if (ignore) return;
        const board = response.data.data;
        setTasks(
          (board.columns || []).flatMap((column) =>
            column.tasks.map((task) => ({
              id: shortTaskId(task.uuid),
              uuid: task.uuid,
              title: task.title,
              assignee: task.assignee?.fullName || "",
              status: task.status,
              priority: task.priority,
            })),
          ),
        );
      })
      .catch((error) => {
        if (!ignore) showToast.error(getErrorMessage(error, "Couldn't load the board."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [projectUuid, reloadKey]);

  const selectProject = (uuid) => {
    setIsLoading(true);
    setTasks([]);
    setProjectUuid(uuid);
  };

  // ← / → : move one stage; the backend decides if it's allowed
  const move = useCallback(
    async (uuid, direction) => {
      const task = tasks.find((item) => item.uuid === uuid);
      if (!task) return;

      const nextStatus = COLUMNS[COLUMNS.indexOf(task.status) + direction];
      if (!nextStatus) return;

      setMovingUuid(uuid);
      try {
        await axios.patch(
          `${KANBAN_API}/tasks/${uuid}/status`,
          { status: nextStatus },
          axiosConfig,
        );
        showToast.success(`Moved to ${nextStatus}.`);
        setReloadKey((key) => key + 1);
      } catch (error) {
        showToast.error(getErrorMessage(error, "This move isn't allowed."));
      } finally {
        setMovingUuid(null);
      }
    },
    [tasks],
  );

  const columnTasks = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((column) => [
          column,
          tasks.filter((task) => task.status === column),
        ]),
      ),
    [tasks],
  );

  const stats = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter(
      (task) => task.status === "Done",
    ).length;

    const active = tasks.filter((task) =>
      ["In Progress", "Code Review", "Testing"].includes(task.status),
    ).length;

    const highPriority = tasks.filter((task) =>
      ["High", "Critical"].includes(task.priority),
    ).length;

    return {
      total,
      completed,
      active,
      highPriority,
      completion: total
        ? Math.round((completed / total) * 100)
        : 0,
    };
  }, [tasks]);

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
              Kanban Board
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Track tasks across development, testing and client
              delivery stages using the project workflow.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5">
                Project Lead
              </span>

              <span className="text-slate-500">/</span>

              <span>Kanban Board</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-sm">
            <p className="text-xs text-blue-200">
              Workflow Stages
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
              {COLUMNS.length}
            </p>

            <p className="mt-1 text-xs text-slate-300">
              Project delivery stages
            </p>
          </div>
        </div>
      </section>

      {/* WORKFLOW OVERVIEW */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ListTodo}
          label="Total Tasks"
          value={stats.total}
          description="Tasks across all stages"
          accent="bg-blue-50 text-blue-700"
        />

        <MetricCard
          icon={Activity}
          label="Active Tasks"
          value={stats.active}
          description="Currently being processed"
          accent="bg-indigo-50 text-indigo-700"
        />

        <MetricCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          description="Tasks reaching completion"
          accent="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          icon={Clock3}
          label="High Priority"
          value={stats.highPriority}
          description="Tasks requiring attention"
          accent="bg-red-50 text-red-700"
        />
      </section>

      {/* WORKFLOW PROGRESS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              Delivery Overview
            </p>

            <h2 className="mt-1 text-base font-bold text-slate-800">
              Project Completion
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Percentage of tasks currently in the Completed stage.
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">
              {stats.completion}%
            </p>

            <p className="text-xs text-slate-400">
              Completion rate
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
            style={{ width: `${stats.completion}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
          <span>{stats.completed} completed</span>
          <span>{stats.total} total tasks</span>
        </div>
      </section>

      {/* KANBAN BOARD */}
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              Task Workflow
            </p>

            <h2 className="text-lg font-bold text-slate-800">
              Development Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Move tasks between stages using the navigation controls.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
            <GripVertical size={15} />
            <span>Horizontal board</span>
          </div>
        </div>

        {/* BOARD LEGEND */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Priority
          </span>

          {Object.entries(PRIORITY_STYLES).map(
            ([priority, style]) => (
              <div
                key={priority}
                className="flex items-center gap-2"
              >
                <span
                  className={`h-2 w-2 rounded-full ${style.dot}`}
                />

                <span className="text-xs font-medium text-slate-600">
                  {priority}
                </span>
              </div>
            ),
          )}

          <span className="hidden h-4 w-px bg-slate-200 sm:block" />

          <span className="text-xs text-slate-400">
            {isLoading
              ? "Loading board…"
              : `${stats.total} tasks distributed across ${COLUMNS.length} stages`}
          </span>

          <select
            aria-label="Select project"
            value={projectUuid}
            onChange={(event) => selectProject(event.target.value)}
            disabled={!projects.length}
            className="ml-auto h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {!projects.length && <option value="">No projects to show</option>}
            {projects.map((project) => (
              <option key={project.uuid} value={project.uuid}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* BOARD COLUMNS */}
        <div className="overflow-x-auto pb-3">
          <div className="grid min-w-[1320px] grid-cols-6 items-start gap-4">
            {COLUMNS.map((column, columnIndex) => {
              const config = COLUMN_STYLES[column];
              const Icon = config.icon;
              const items = columnTasks[column];

              return (
                <section
                  key={column}
                  className="flex min-h-[470px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm"
                >
                  {/* COLUMN HEADER */}
                  <div className="border-b border-slate-200 bg-white px-4 pb-4 pt-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 ${config.iconColor}`}
                        >
                          <Icon size={16} />
                        </div>

                        <h3 className="truncate text-sm font-bold text-slate-800">
                          {column}
                        </h3>
                      </div>

                      <span
                        className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold ${config.count}`}
                      >
                        {items.length}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${config.accent}`}
                        style={{
                          width: `${
                            stats.total
                              ? (items.length / stats.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* COLUMN TASKS */}
                  <div className="flex flex-1 flex-col gap-3 p-3">
                    {items.length === 0 ? (
                      <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <Icon size={18} />
                        </div>

                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          No tasks here
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-400">
                          Tasks will appear in this stage when moved here.
                        </p>
                      </div>
                    ) : (
                      items.map((task) => {
                        const priority =
                          PRIORITY_STYLES[task.priority] ||
                          PRIORITY_STYLES.Low;

                        return (
                          <article
                            key={task.uuid}
                            className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                          >
                            {/* TASK CARD HEADER */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                  {task.id}
                                </p>

                                <h4 className="mt-1.5 break-words text-sm font-bold leading-5 text-slate-800">
                                  {task.title}
                                </h4>
                              </div>

                              <span
                                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${priority.dot}`}
                                title={`${task.priority} priority`}
                              />
                            </div>

                            {/* PRIORITY */}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <Badge tone={priority.tone}>
                                {task.priority}
                              </Badge>

                              <span className="text-[10px] font-medium text-slate-400">
                                {columnIndex + 1}/{COLUMNS.length}
                              </span>
                            </div>

                            {/* ASSIGNEE */}
                            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
                                {task.assignee
                                  .split(" ")
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400">
                                  Assigned to
                                </p>

                                <p className="truncate text-xs font-semibold text-slate-700">
                                  {task.assignee}
                                </p>
                              </div>
                            </div>

                            {/* TASK MOVEMENT */}
                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  columnIndex === 0 ||
                                  column === LOCKED_COLUMN ||
                                  movingUuid !== null
                                }
                                onClick={() => move(task.uuid, -1)}
                              >
                                <span className="flex items-center gap-1">
                                  <ArrowLeft size={13} />
                                  <span className="hidden xl:inline">
                                    Previous
                                  </span>
                                </span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  columnIndex === COLUMNS.length - 1 ||
                                  movingUuid !== null
                                }
                                onClick={() => move(task.uuid, 1)}
                              >
                                <span className="flex items-center gap-1">
                                  <span className="hidden xl:inline">
                                    Next
                                  </span>
                                  <ArrowRight size={13} />
                                </span>
                              </Button>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>

                  {/* COLUMN FOOTER */}
                  <div className="border-t border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Tasks in stage
                      </span>

                      <span className="font-bold text-slate-600">
                        {items.length}
                      </span>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default KanbanBoard;