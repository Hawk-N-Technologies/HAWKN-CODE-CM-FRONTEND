import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Code2,
  Layers3,
  ListTodo,
  Users,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";

// -----------------------------------------------------------------------------
// Constants + initial data
// -----------------------------------------------------------------------------

const STATUSES = [
  "Idle",
  "In Progress",
  "Developer Testing",
  "Tester",
  "Client Testing",
  "Completed",
];

const INITIAL_TASKS = [
  {
    id: "TASK-001",
    title: "Authentication",
    developer: "Aarav Shah",
    phase: "Phase 1",
    status: "Completed",
    progress: 100,
  },
  {
    id: "TASK-002",
    title: "Dashboard API",
    developer: "Neha Joshi",
    phase: "Phase 1",
    status: "Client Testing",
    progress: 90,
  },
  {
    id: "TASK-003",
    title: "Reports Module",
    developer: "Dev Patel",
    phase: "Phase 2",
    status: "In Progress",
    progress: 55,
  },
  {
    id: "TASK-004",
    title: "Notification UI",
    developer: "Ishita Shah",
    phase: "Phase 2",
    status: "Developer Testing",
    progress: 80,
  },
  {
    id: "TASK-005",
    title: "Export Workflow",
    developer: "Aarav Shah",
    phase: "Phase 3",
    status: "Idle",
    progress: 0,
  },
];

const TONE = {
  Idle: "neutral",
  "In Progress": "info",
  "Developer Testing": "warning",
  Tester: "purple",
  "Client Testing": "warning",
  Completed: "success",
};

// -----------------------------------------------------------------------------
// Reusable UI components
// -----------------------------------------------------------------------------

function SummaryCard({ label, value, description, icon: Icon, tone = "blue" }) {
  const iconStyles = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconStyles[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-label="Task progress"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          progress === 100 ? "bg-emerald-500" : "bg-blue-600"
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Task card
// -----------------------------------------------------------------------------

function TaskCard({ task, moveTask }) {
  const statusIndex = STATUSES.indexOf(task.status);
  const isFirst = statusIndex === 0;
  const isLast = statusIndex === STATUSES.length - 1;

  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {task.id}
          </p>
          <h3 className="mt-1.5 break-words text-sm font-semibold leading-5 text-slate-800">
            {task.title}
          </h3>
        </div>

        <Badge tone={TONE[task.status]}>{task.progress}%</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600">
          {task.phase}
        </span>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
            {task.developer
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-700">
              {task.developer}
            </p>
            <p className="text-[10px] text-slate-400">Assigned developer</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500">
              Progress
            </span>
            <span className="text-[10px] font-semibold tabular-nums text-slate-600">
              {task.progress}%
            </span>
          </div>
          <ProgressBar progress={task.progress} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isFirst}
            onClick={() => moveTask(task.id, -1)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>

          <span className="text-[10px] text-slate-400">
            {statusIndex + 1} / {STATUSES.length}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={isLast}
            onClick={() => moveTask(task.id, 1)}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

// -----------------------------------------------------------------------------
// Kanban column
// -----------------------------------------------------------------------------

function StatusColumn({ status, tasks, moveTask }) {
  const column = tasks.filter((task) => task.status === status);

  const statusStyles = {
    Idle: "border-slate-300 bg-slate-100",
    "In Progress": "border-blue-200 bg-blue-50",
    "Developer Testing": "border-amber-200 bg-amber-50",
    Tester: "border-violet-200 bg-violet-50",
    "Client Testing": "border-orange-200 bg-orange-50",
    Completed: "border-emerald-200 bg-emerald-50",
  };

  const countStyles = {
    Idle: "bg-slate-200 text-slate-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "Developer Testing": "bg-amber-100 text-amber-700",
    Tester: "bg-violet-100 text-violet-700",
    "Client Testing": "bg-orange-100 text-orange-700",
    Completed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <section className="flex min-h-[390px] flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              status === "Completed"
                ? "bg-emerald-500"
                : status === "In Progress"
                  ? "bg-blue-500"
                  : status === "Idle"
                    ? "bg-slate-400"
                    : status === "Tester"
                      ? "bg-violet-500"
                      : "bg-amber-500"
            }`}
          />
          <h3 className="truncate text-xs font-semibold text-slate-800">
            {status}
          </h3>
        </div>

        <span
          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-bold ${countStyles[status]}`}
        >
          {column.length}
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-3">
        {column.length > 0 ? (
          column.map((task) => (
            <TaskCard key={task.id} task={task} moveTask={moveTask} />
          ))
        ) : (
          <div className="flex min-h-[130px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 text-center">
            <CircleDashed className="h-5 w-5 text-slate-300" />
            <p className="mt-2 text-xs font-medium text-slate-400">
              No tasks in this stage
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------

function DevelopmentMonitoring() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tasks;

    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.developer.toLowerCase().includes(query) ||
        task.phase.toLowerCase().includes(query),
    );
  }, [tasks, search]);

  const moveTask = (id, direction) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        const index = STATUSES.indexOf(task.status);
        const nextIndex = Math.max(
          0,
          Math.min(STATUSES.length - 1, index + direction),
        );

        return {
          ...task,
          status: STATUSES[nextIndex],
          progress:
            nextIndex === STATUSES.length - 1
              ? 100
              : Math.max(task.progress, nextIndex * 18),
        };
      }),
    );
  };

  const completedCount = tasks.filter(
    (task) => task.status === "Completed",
  ).length;

  const testingCount = tasks.filter((task) =>
    ["Developer Testing", "Tester", "Client Testing"].includes(task.status),
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "In Progress",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Standardized Administration header */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
              <Code2 className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                ADMINISTRATION
              </span>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                Development Monitoring
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Monitor development progress through the BRD-defined task
                workflow, from initial development to client testing and
                completion.
              </p>
            </div>
          </div>

          <div className="relative z-10 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-blue-200">
              Workflow stages
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {STATUSES.length}
            </p>
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Tasks"
          value={tasks.length}
          description="Tasks across all workflow stages"
          icon={ListTodo}
          tone="blue"
        />

        <SummaryCard
          label="Completed"
          value={completedCount}
          description="Tasks marked as completed"
          icon={CheckCircle2}
          tone="green"
        />

        <SummaryCard
          label="Testing"
          value={testingCount}
          description="Developer, tester and client testing"
          icon={Activity}
          tone="amber"
        />

        <SummaryCard
          label="In Progress"
          value={inProgressCount}
          description="Tasks currently being developed"
          icon={Layers3}
          tone="slate"
        />
      </section>

      {/* Workflow board */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeading
            eyebrow="TASK WORKFLOW"
            title="Development Pipeline"
            description="Track each task across its current development and testing stage."
            icon={Layers3}
          />

          <div className="w-full lg:max-w-sm">
            <TableSearch
              value={search}
              onChange={setSearch}
              placeholder="Search task, developer or phase..."
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-y border-slate-100 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium text-slate-600">
              Workflow overview
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {tasks.length}
            </span>{" "}
            tasks
          </p>
        </div>

        <div className="mt-4 overflow-x-auto pb-2">
          <div className="grid min-w-[1100px] grid-cols-6 gap-3">
            {STATUSES.map((status) => (
              <StatusColumn
                key={status}
                status={status}
                tasks={filtered}
                moveTask={moveTask}
              />
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <CircleDashed className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              No matching tasks found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try another task name, developer or phase.
            </p>
          </div>
        )}
      </section>

      {/* Development status */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="PROJECT HEALTH"
          title="Development Status"
          description="Current task distribution across the development workflow."
          icon={Activity}
        />

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Total Tasks", tasks.length],
            ["Completed", completedCount],
            ["Testing", testingCount],
            ["In Progress", inProgressCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DevelopmentMonitoring;
