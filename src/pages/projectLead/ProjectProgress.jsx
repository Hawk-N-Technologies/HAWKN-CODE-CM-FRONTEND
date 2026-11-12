import { useMemo } from "react";
import Badge from "../../components/common/Badge";
import {
  Activity,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Layers3,
  Target,
  TrendingUp,
} from "lucide-react";

const phases = [
  { name: "Discovery", progress: 100, status: "Completed", tasks: "8 / 8" },
  {
    name: "Core Development",
    progress: 68,
    status: "In Progress",
    tasks: "17 / 25",
  },
  { name: "Testing", progress: 22, status: "In Progress", tasks: "3 / 14" },
  { name: "Delivery", progress: 0, status: "Not Started", tasks: "0 / 6" },
];

const STATUS_CONFIG = {
  Completed: {
    tone: "success",
    color: "#16a34a",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    description: "Phase completed",
  },
  "In Progress": {
    tone: "info",
    color: "#2563eb",
    bar: "bg-blue-600",
    dot: "bg-blue-600",
    description: "Work currently underway",
  },
  "Not Started": {
    tone: "neutral",
    color: "#94a3b8",
    bar: "bg-slate-400",
    dot: "bg-slate-400",
    description: "Awaiting commencement",
  },
};

const getTaskCounts = (taskString) => {
  const [completed, total] = taskString.split("/").map(Number);

  return {
    completed: completed || 0,
    total: total || 0,
    remaining: Math.max((total || 0) - (completed || 0), 0),
  };
};

function MetricCard({ label, value, description, icon: Icon, accent }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function CircularProgress({ value, size = 164 }) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Overall project progress: ${value}%`}
    >
      <svg
        viewBox="0 0 164 164"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="82"
          cy="82"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
        />

        <circle
          cx="82"
          cy="82"
          r={radius}
          fill="none"
          stroke="#2563eb"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">
          {value}%
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Completed
        </span>
      </div>
    </div>
  );
}

function ProgressDistribution({ completed, inProgress, notStarted }) {
  const total = completed + inProgress + notStarted;

  const segments = [
    {
      label: "Completed",
      value: completed,
      color: "#16a34a",
    },
    {
      label: "In Progress",
      value: inProgress,
      color: "#2563eb",
    },
    {
      label: "Not Started",
      value: notStarted,
      color: "#cbd5e1",
    },
  ];

  let accumulated = 0;

  const gradient = segments
    .map((segment) => {
      const start = accumulated;
      const percentage = total ? (segment.value / total) * 100 : 0;
      accumulated += percentage;

      return `${segment.color} ${start}% ${accumulated}%`;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${gradient})`,
        }}
        role="img"
        aria-label={`Phase distribution: ${completed} completed, ${inProgress} in progress, ${notStarted} not started`}
      >
        <div className="absolute inset-[19px] flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-extrabold text-slate-900">
            {total}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Total Phases
          </span>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-sm font-medium text-slate-600">
                {segment.label}
              </span>
            </div>

            <span className="text-sm font-bold tabular-nums text-slate-900">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseCard({ phase, index, total }) {
  const config = STATUS_CONFIG[phase.status] || STATUS_CONFIG["Not Started"];
  const taskCounts = getTaskCounts(phase.tasks);

  return (
    <article className="relative min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="min-w-0">
            <h3 className="break-words font-bold text-slate-900">
              {phase.name}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Phase {index + 1} of {total}
            </p>
          </div>
        </div>

        <Badge tone={config.tone}>{phase.status}</Badge>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500">
            Phase completion
          </span>

          <span className="text-sm font-bold tabular-nums text-slate-900">
            {phase.progress}%
          </span>
        </div>

        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={phase.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${phase.name} progress`}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
            style={{ width: `${phase.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-100 bg-slate-50 py-3">
        <div className="px-2 text-center">
          <p className="text-lg font-bold tabular-nums text-slate-900">
            {taskCounts.total}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Total
          </p>
        </div>

        <div className="px-2 text-center">
          <p className="text-lg font-bold tabular-nums text-emerald-600">
            {taskCounts.completed}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Done
          </p>
        </div>

        <div className="px-2 text-center">
          <p className="text-lg font-bold tabular-nums text-slate-700">
            {taskCounts.remaining}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Remaining
          </p>
        </div>
      </div>
    </article>
  );
}

function ProjectProgress() {
  const metrics = useMemo(() => {
    const total = phases.length;

    const completed = phases.filter(
      (phase) => phase.status === "Completed",
    ).length;

    const inProgress = phases.filter(
      (phase) => phase.status === "In Progress",
    ).length;

    const notStarted = phases.filter(
      (phase) => phase.status === "Not Started",
    ).length;

    const totalTasks = phases.reduce(
      (sum, phase) => sum + getTaskCounts(phase.tasks).total,
      0,
    );

    const completedTasks = phases.reduce(
      (sum, phase) => sum + getTaskCounts(phase.tasks).completed,
      0,
    );

    const average = Math.round(
      phases.reduce((sum, phase) => sum + phase.progress, 0) / total,
    );

    return {
      total,
      completed,
      inProgress,
      notStarted,
      totalTasks,
      completedTasks,
      remainingTasks: totalTasks - completedTasks,
      average,
    };
  }, []);

  return (
    <div className="min-w-0 space-y-6">
      {/* Page Header */}
      <header className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-12 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full border border-white/5" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
                Project Management Workspace
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Project Progress
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Monitor phase completion, task distribution and overall project
              delivery progress.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <Layers3 size={18} className="text-sky-300" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                Active Project
              </p>
              <p className="text-sm font-semibold text-white">
                Acme Retail ERP
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Overview Metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Overall Progress"
          value={`${metrics.average}%`}
          description="Average phase completion"
          icon={Target}
          accent="bg-blue-50 text-blue-700"
        />

        <MetricCard
          label="Total Phases"
          value={metrics.total}
          description="Across the project lifecycle"
          icon={Layers3}
          accent="bg-violet-50 text-violet-700"
        />

        <MetricCard
          label="Completed Tasks"
          value={`${metrics.completedTasks}/${metrics.totalTasks}`}
          description={`${metrics.remainingTasks} tasks remaining`}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="Active Phases"
          value={metrics.inProgress}
          description={`${metrics.notStarted} phases not started`}
          icon={Activity}
          accent="bg-amber-50 text-amber-700"
        />
      </section>

      {/* Main Analytics */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        {/* Overall Project Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3 sm:p-6">
          <SectionHeading
            eyebrow="Performance Overview"
            title="Overall Project Progress"
            description="Current completion across all project phases."
          />

          <div className="mt-6 flex flex-col items-center gap-6 border-b border-slate-100 pb-6 sm:flex-row sm:justify-around">
            <CircularProgress value={metrics.average} />

            <div className="grid w-full grid-cols-2 gap-3 sm:max-w-xs">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-700">
                  Completed
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {metrics.completed}
                </p>
                <p className="mt-1 text-[10px] text-emerald-700">
                  Phases finished
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-medium text-blue-700">
                  In Progress
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-800">
                  {metrics.inProgress}
                </p>
                <p className="mt-1 text-[10px] text-blue-700">
                  Active phases
                </p>
              </div>

              <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      Task completion
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {metrics.completedTasks} / {metrics.totalTasks}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">
                      {Math.round(
                        (metrics.completedTasks / metrics.totalTasks) * 100,
                      )}
                      %
                    </p>
                    <p className="text-[10px] text-slate-500">Tasks done</p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${
                        (metrics.completedTasks / metrics.totalTasks) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-600">
                Phase completion distribution
              </p>
              <span className="text-[10px] text-slate-400">
                {metrics.total} phases
              </span>
            </div>

            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-emerald-500 transition-all"
                style={{
                  width: `${(metrics.completed / metrics.total) * 100}%`,
                }}
              />
              <div
                className="bg-blue-600 transition-all"
                style={{
                  width: `${(metrics.inProgress / metrics.total) * 100}%`,
                }}
              />
              <div
                className="bg-slate-300 transition-all"
                style={{
                  width: `${(metrics.notStarted / metrics.total) * 100}%`,
                }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {[
                { label: "Completed", color: "bg-emerald-500" },
                { label: "In Progress", color: "bg-blue-600" },
                { label: "Not Started", color: "bg-slate-300" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs text-slate-500"
                >
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
          <SectionHeading
            eyebrow="Phase Analytics"
            title="Phase Distribution"
            description="Breakdown by current phase status."
          />

          <div className="mt-6">
            <ProgressDistribution
              completed={metrics.completed}
              inProgress={metrics.inProgress}
              notStarted={metrics.notStarted}
            />
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp
                size={18}
                className="mt-0.5 shrink-0 text-blue-700"
              />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Project status
                </p>
                <p className="mt-1 text-xs leading-relaxed text-blue-800">
                  {metrics.average === 100
                    ? "All phases have reached full completion."
                    : metrics.average >= 50
                      ? "The project is past the halfway mark based on average phase progress."
                      : "The project is still in its early progress stages."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase Breakdown */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="Execution Details"
          title="Phase-wise Progress"
          description="Detailed completion and task breakdown for every project phase."
          action={
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
              {metrics.total} Phases
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {phases.map((phase, index) => (
            <PhaseCard
              key={phase.name}
              phase={phase}
              index={index}
              total={phases.length}
            />
          ))}
        </div>
      </section>

      {/* Phase Timeline */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="Project Lifecycle"
          title="Phase Timeline"
          description="Sequential view of the project's execution stages."
        />

        <div className="mt-6 grid grid-cols-1 gap-0 md:grid-cols-4">
          {phases.map((phase, index) => {
            const config =
              STATUS_CONFIG[phase.status] || STATUS_CONFIG["Not Started"];

            return (
              <div
                key={phase.name}
                className={`relative flex gap-3 border-slate-200 pb-6 last:pb-0 md:flex-col md:border-l-0 md:pb-0 md:pl-0 ${
                  index < phases.length - 1
                    ? "border-b md:border-b-0"
                    : ""
                }`}
              >
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white md:mb-3">
                  {phase.status === "Completed" ? (
                    <CheckCircle2 size={17} className="text-emerald-600" />
                  ) : phase.status === "In Progress" ? (
                    <Clock3 size={17} className="text-blue-600" />
                  ) : (
                    <CircleDashed size={17} className="text-slate-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {phase.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-slate-500">
                      {phase.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    {phase.progress}% complete
                  </p>
                </div>

                {index < phases.length - 1 && (
                  <div className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-200 md:hidden" />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ProjectProgress;