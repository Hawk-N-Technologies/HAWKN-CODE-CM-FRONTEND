import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";

const STATUS_PROGRESS = {
  Backlog: 0,
  "To Do": 0,
  "In Progress": 0,
  "Code Review": 0,
  Testing: 50,
  Done: 100,
};

const STATUS_TONE = {
  Backlog: "neutral",
  "To Do": "neutral",
  "In Progress": "warning",
  "Code Review": "info",
  Testing: "info",
  Done: "success",
};

const STATUS_COLORS = {
  Backlog: "#94a3b8",
  "To Do": "#64748b",
  "In Progress": "#f59e0b",
  "Code Review": "#6366f1",
  Testing: "#0ea5e9",
  Done: "#10b981",
};

const STATUS_ORDER = [
  "Backlog",
  "To Do",
  "In Progress",
  "Code Review",
  "Testing",
  "Done",
];

function getStatusProgress(status) {
  return STATUS_PROGRESS[status] ?? 0;
}

function calculateProgress(tasks) {
  if (!tasks.length) return 0;

  const weightedProgress = tasks.reduce(
    (sum, task) => sum + getStatusProgress(task.status) / 100,
    0,
  );

  return Number(((weightedProgress / tasks.length) * 100).toFixed(1));
}

function normalizeTask(task) {
  return {
    ...task,
    uuid: task.uuid ?? task.id,
    title: task.title || "Untitled task",
    status: Object.hasOwn(STATUS_PROGRESS, task.status)
      ? task.status
      : "Backlog",
    projectName: task.project?.name || "Project not specified",
    projectKey:
      task.project?.uuid ??
      task.project?.id ??
      task.project?.name ??
      "unknown-project",
    moduleName: task.module?.name || "Unassigned module",
    moduleKey:
      task.module?.uuid ??
      task.module?.id ??
      task.module?.name ??
      "unassigned-module",
    phaseName: task.phase?.name || "Unassigned phase",
    phaseKey:
      task.phase?.uuid ??
      task.phase?.id ??
      task.phase?.name ??
      "unassigned-phase",
  };
}

/* -------------------------------------------------------------------------- */
/* Progress utilities                                                         */
/* -------------------------------------------------------------------------- */

function getTaskCounts(tasks) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === "Done").length,
    testing: tasks.filter((task) => task.status === "Testing").length,
    active: tasks.filter(
      (task) =>
        task.status === "In Progress" ||
        task.status === "Code Review",
    ).length,
    pending: tasks.filter(
      (task) => task.status === "Backlog" || task.status === "To Do",
    ).length,
  };
}

function getStatusDistribution(tasks) {
  return STATUS_ORDER.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
    color: STATUS_COLORS[status],
  })).filter((item) => item.count > 0);
}

function getProgressLabel(progress) {
  if (progress === 100) return "Completed";
  if (progress >= 50) return "Well underway";
  if (progress > 0) return "In progress";
  return "Not started";
}

/* -------------------------------------------------------------------------- */
/* Circular progress component                                                */
/* -------------------------------------------------------------------------- */

function ProgressRing({
  value,
  size = 112,
  stroke = 9,
  color = "#3b82f6",
  label = "Progress",
  showLabel = true,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${safeValue}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold tracking-tight text-[#101b32]">
          {safeValue}%
        </span>

        {showLabel && (
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Complete
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page header                                                                */
/* -------------------------------------------------------------------------- */

function PageHeader({ taskCount, projectCount, overallProgress }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-blue-300/[0.12]" />
      <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full border border-blue-300/[0.12]" />
      <div className="pointer-events-none absolute right-12 top-8 h-32 w-32 rounded-full border border-indigo-300/[0.10]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/[0.08] blur-3xl" />

      <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
        <div className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/[0.08] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-[11px]">
              Development
            </p>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px]">
            Development Progress
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            Track project milestones, module execution and task completion
            across your assigned development work.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {projectCount} Projects
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              {taskCount} Assigned Tasks
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-4 self-start rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 xl:self-auto">
          <ProgressRing
            value={overallProgress}
            size={76}
            stroke={7}
            color="#60a5fa"
            label="Overall development progress"
            showLabel={false}
          />

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-blue-200">
              Overall Progress
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {overallProgress}%
            </p>
            <p className="mt-0.5 text-xs text-slate-300">
              Across assigned tasks
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Overall progress overview                                                  */
/* -------------------------------------------------------------------------- */

function OverviewStat({ label, value, description, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-[#101b32]">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">{description}</p>
    </div>
  );
}

function StatusDistribution({ tasks }) {
  const distribution = getStatusDistribution(tasks);
  const total = tasks.length;

  if (!total) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h3 className="text-sm font-bold text-[#101b32]">
          Task Status Distribution
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Breakdown of your assigned tasks by current status.
        </p>
      </div>

      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {distribution.map((item) => (
          <div
            key={item.status}
            title={`${item.status}: ${item.count} tasks`}
            style={{
              width: `${(item.count / total) * 100}%`,
              backgroundColor: item.color,
            }}
            className="h-full transition-all duration-500"
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        {distribution.map((item) => (
          <div key={item.status} className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: item.color }}
            />

            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-slate-500">
                {item.status}
              </p>
              <p className="mt-0.5 text-sm font-bold text-[#101b32]">
                {item.count}
                <span className="ml-1 text-[10px] font-normal text-slate-400">
                  tasks
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressSummary({ tasks }) {
  const counts = getTaskCounts(tasks);
  const progress = calculateProgress(tasks);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <OverviewStat
          label="Total Tasks"
          value={counts.total}
          description="Assigned to you"
          accent="#3b82f6"
        />

        <OverviewStat
          label="Completed"
          value={counts.completed}
          description="Tasks marked as done"
          accent="#10b981"
        />

        <OverviewStat
          label="In Progress / Review"
          value={counts.active}
          description="Currently being worked on"
          accent="#f59e0b"
        />

        <OverviewStat
          label="Testing"
          value={counts.testing}
          description="Tasks in testing stage"
          accent="#0ea5e9"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
        <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#101b32]">
                Overall Task Progress
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Calculated from current task statuses
              </p>
            </div>

            <Badge tone={progress === 100 ? "success" : "info"}>
              {getProgressLabel(progress)}
            </Badge>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-6">
            <ProgressRing
              value={progress}
              size={132}
              stroke={11}
              color="#2563eb"
              label="Overall task progress"
            />

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs text-slate-500">Completed tasks</p>
                <p className="mt-0.5 text-lg font-bold text-[#101b32]">
                  {counts.completed}
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    / {counts.total}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Pending tasks</p>
                <p className="mt-0.5 text-lg font-bold text-[#101b32]">
                  {counts.pending}
                </p>
              </div>
            </div>
          </div>
        </div>

        <StatusDistribution tasks={tasks} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Project progress card                                                      */
/* -------------------------------------------------------------------------- */

function ProjectCard({ project, index }) {
  const counts = getTaskCounts(project.tasks);

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Project heading */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-[#f8faff] via-white to-[#f3f6ff] px-5 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full border border-blue-100/80" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                Project Overview
              </p>

              <h2 className="mt-1 break-words text-lg font-bold tracking-tight text-[#101b32] sm:text-xl">
                {project.name}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {project.modules.length} Modules
                <span className="mx-2 text-slate-300">•</span>
                {counts.total} Assigned Tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-slate-500">
                Task completion
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {counts.completed} of {counts.total} completed
              </p>
            </div>

            <ProgressRing
              value={project.progress}
              size={82}
              stroke={7}
              color="#2563eb"
              label={`${project.name} progress`}
              showLabel={false}
            />
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2">
            <p className="text-[10px] font-medium text-slate-400">Completed</p>
            <p className="mt-1 text-sm font-bold text-emerald-600">
              {counts.completed}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2">
            <p className="text-[10px] font-medium text-slate-400">Testing</p>
            <p className="mt-1 text-sm font-bold text-sky-600">
              {counts.testing}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2">
            <p className="text-[10px] font-medium text-slate-400">Pending</p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              {counts.pending}
            </p>
          </div>
        </div>
      </div>

      {/* Module content */}
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-sm font-bold text-[#101b32]">
              Module Breakdown
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Expand a module to explore its phases and assigned tasks.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-500">
            {project.modules.length} Modules
          </span>
        </div>

        {project.modules.map((module, moduleIndex) => (
          <ModuleCard
            key={module.key}
            module={module}
            index={moduleIndex}
          />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Module card                                                                */
/* -------------------------------------------------------------------------- */

function ModuleCard({ module, index }) {
  const counts = getTaskCounts(module.tasks);

  return (
    <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 open:bg-white">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-4 outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-700">
            M{index + 1}
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Module
            </p>

            <h3 className="mt-0.5 break-words text-sm font-bold text-[#101b32]">
              {module.name}
            </h3>

            <p className="mt-1 text-[11px] text-slate-500">
              {module.phases.length} Phases
              <span className="mx-1.5 text-slate-300">•</span>
              {counts.total} Tasks
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-[#101b32]">
              {module.progress}%
            </p>
            <p className="text-[9px] text-slate-400">Progress</p>
          </div>

          <ProgressRing
            value={module.progress}
            size={54}
            stroke={5}
            color="#6366f1"
            label={`${module.name} progress`}
            showLabel={false}
          />

          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-transform group-open:rotate-180">
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </span>
        </div>
      </summary>

      <div className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
            {counts.completed} Completed
          </span>

          <span className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-[10px] font-semibold text-sky-700">
            {counts.testing} Testing
          </span>

          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
            {counts.pending} Pending
          </span>
        </div>

        <div className="space-y-3">
          {module.phases.map((phase, phaseIndex) => (
            <PhaseCard
              key={phase.key}
              phase={phase}
              index={phaseIndex}
            />
          ))}
        </div>
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Phase progression                                                          */
/* -------------------------------------------------------------------------- */

function PhaseCard({ phase, index }) {
  const counts = getTaskCounts(phase.tasks);
  const phaseProgress = phase.progress;

  const phaseColor =
    phaseProgress === 100
      ? "#10b981"
      : phaseProgress > 0
        ? "#0ea5e9"
        : "#94a3b8";

  return (
    <details className="group rounded-xl border border-slate-200 bg-white open:border-blue-100">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 outline-none transition-colors hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
            style={{
              borderColor: `${phaseColor}40`,
              backgroundColor: `${phaseColor}12`,
              color: phaseColor,
            }}
          >
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Phase {index + 1}
            </p>

            <h4 className="mt-0.5 break-words text-sm font-semibold text-[#101b32]">
              {phase.name}
            </h4>

            <p className="mt-1 text-[11px] text-slate-500">
              {counts.completed} / {counts.total} tasks completed
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-[#101b32]">
              {phaseProgress}%
            </p>

            <p className="text-[9px] font-medium text-slate-400">
              {getProgressLabel(phaseProgress)}
            </p>
          </div>

          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-transform group-open:rotate-180">
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </span>
        </div>
      </summary>

      <div className="border-t border-slate-100 px-4 pb-4 pt-3">
        {/* Phase milestone visualization */}
        <div className="mb-4 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Phase Completion
            </p>

            <p className="text-[10px] font-semibold text-slate-500">
              {phaseProgress}% contribution
            </p>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            {Array.from({ length: 10 }).map((_, segmentIndex) => {
              const threshold = (segmentIndex + 1) * 10;
              const active = phaseProgress >= threshold;

              return (
                <div
                  key={segmentIndex}
                  className="h-2.5 flex-1 rounded-sm transition-colors duration-300"
                  style={{
                    backgroundColor: active ? phaseColor : "#e2e8f0",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Task list */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Assigned Tasks
            </p>

            <span className="text-[10px] text-slate-400">
              {phase.tasks.length} items
            </span>
          </div>

          <ul className="divide-y divide-slate-100">
            {phase.tasks.map((task, taskIndex) => (
              <TaskRow
                key={task.uuid ?? `${task.title}-${taskIndex}`}
                task={task}
              />
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Task row                                                                   */
/* -------------------------------------------------------------------------- */

function TaskRow({ task }) {
  const tone = STATUS_TONE[task.status] || "neutral";

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: STATUS_COLORS[task.status] || "#94a3b8",
          }}
        />

        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-[#101b32]">
            {task.title}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {task.status} · {getStatusProgress(task.status)}% progress
            contribution
          </p>
        </div>
      </div>

      <Badge tone={tone}>{task.status}</Badge>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function DevelopmentProgress() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const fetchTasks = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get("/api/my-tasks", { signal });
      const payload = response.data?.data ?? response.data;

      if (!Array.isArray(payload)) {
        throw new Error("The server returned an invalid tasks response.");
      }

      setTasks(payload.map(normalizeTask));
    } catch (err) {
      if (
        axios.isCancel(err) ||
        err.code === "ERR_CANCELED" ||
        signal.aborted
      ) {
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load development progress.",
      );
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchTasks(controller.signal);

    return () => controller.abort();
  }, [fetchTasks, reloadKey]);

  const projects = useMemo(() => {
    const projectMap = new Map();

    for (const task of tasks) {
      if (!projectMap.has(task.projectKey)) {
        projectMap.set(task.projectKey, {
          key: task.projectKey,
          name: task.projectName,
          tasks: [],
          modules: new Map(),
        });
      }

      const project = projectMap.get(task.projectKey);
      project.tasks.push(task);

      if (!project.modules.has(task.moduleKey)) {
        project.modules.set(task.moduleKey, {
          key: task.moduleKey,
          name: task.moduleName,
          tasks: [],
          phases: new Map(),
        });
      }

      const module = project.modules.get(task.moduleKey);
      module.tasks.push(task);

      if (!module.phases.has(task.phaseKey)) {
        module.phases.set(task.phaseKey, {
          key: task.phaseKey,
          name: task.phaseName,
          tasks: [],
        });
      }

      module.phases.get(task.phaseKey).tasks.push(task);
    }

    return Array.from(projectMap.values()).map((project) => ({
      ...project,
      progress: calculateProgress(project.tasks),
      completed: project.tasks.filter((task) => task.status === "Done").length,
      modules: Array.from(project.modules.values()).map((module) => ({
        ...module,
        progress: calculateProgress(module.tasks),
        completed: module.tasks.filter((task) => task.status === "Done").length,
        phases: Array.from(module.phases.values()).map((phase) => ({
          ...phase,
          progress: calculateProgress(phase.tasks),
          completed: phase.tasks.filter((task) => task.status === "Done").length,
        })),
      })),
    }));
  }, [tasks]);

  const overallProgress = useMemo(
    () => calculateProgress(tasks),
    [tasks],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          taskCount={tasks.length}
          projectCount={projects.length}
          overallProgress={overallProgress}
        />

        <Loader context="page" label="Loading development progress..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          taskCount={tasks.length}
          projectCount={projects.length}
          overallProgress={overallProgress}
        />

        <ErrorState
          title="Unable to load development progress"
          description={error}
          onRetry={() => setReloadKey((current) => current + 1)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        taskCount={tasks.length}
        projectCount={projects.length}
        overallProgress={overallProgress}
      />

      {tasks.length === 0 ? (
        <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <EmptyState
            title="No assigned tasks"
            description="Progress will appear here when tasks are assigned to you."
          />
        </section>
      ) : (
        <>
          <ProgressSummary tasks={tasks} />

          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  Project Workspace
                </p>

                <h2 className="mt-1 text-lg font-bold tracking-tight text-[#101b32]">
                  Project Progress Breakdown
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Explore individual projects, modules, phases and tasks.
                </p>
              </div>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                {projects.length} Active Project Groups
              </span>
            </div>

            {projects.map((project, index) => (
              <ProjectCard
                key={project.key}
                project={project}
                index={index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}