
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

function getStatusProgress(status) {
  return STATUS_PROGRESS[status] ?? 0;
}

function calculateProgress(tasks) {
  if (!tasks.length) return 0;

  const weightedProgress = tasks.reduce(
    (sum, task) => sum + getStatusProgress(task.status) / 100,
    0,
  );

  return Number(
    ((weightedProgress / tasks.length) * 100).toFixed(1),
  );
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

function PageHeader({ taskCount, projectCount }) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 px-5 py-5 shadow-sm sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full border border-blue-100/80" />
      <div className="pointer-events-none absolute -right-2 -top-6 h-28 w-28 rounded-full border border-blue-100/70" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[13px] bg-[#0b1833] text-lg font-bold text-white shadow-sm sm:h-[62px] sm:w-[62px]">
            DEV
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700 sm:text-xs">
              Development
            </p>
            <h1 className="mt-1.5 text-[25px] font-bold leading-tight tracking-tight text-[#101b32] sm:text-[28px] lg:text-[30px]">
              Development Progress
            </h1>
            <p className="mt-1 text-[13px] text-slate-500 sm:text-sm">
              Project and phase progress based on your assigned task statuses.
            </p>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm">
            {taskCount} Tasks
          </span>
          <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm">
            {projectCount} Projects
          </span>
        </div>
      </div>
    </section>
  );
}

function ProgressBar({ value, label }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ProgressSummary({ tasks }) {
  const completed = tasks.filter((task) => task.status === "Done").length;
  const testing = tasks.filter((task) => task.status === "Testing").length;
  const progress = calculateProgress(tasks);
  const projectCount = new Set(tasks.map((task) => task.projectKey)).size;

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Overall Task Progress
          </p>
          <p className="mt-1 text-3xl font-bold text-[#101b32]">
            {progress}%
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {completed} completed · {testing} testing · {tasks.length} total tasks
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-500">Assigned Projects</p>
          <p className="mt-1 text-2xl font-bold text-[#101b32]">
            {projectCount}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <ProgressBar
          value={progress}
          label="Overall task-based progress"
        />
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const tone = STATUS_TONE[task.status] || "neutral";

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-[#101b32]">
          {task.title}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {task.status} · {getStatusProgress(task.status)}% progress contribution
        </p>
      </div>

      <Badge tone={tone}>{task.status}</Badge>
    </li>
  );
}

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

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          taskCount={tasks.length}
          projectCount={projects.length}
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
            {projects.map((project) => (
              <section
                key={project.key}
                className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                {/* Project */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                      Project
                    </p>
                    <h2 className="mt-1 text-base font-bold text-[#101b32]">
                      {project.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {project.completed} of {project.tasks.length} tasks completed
                    </p>
                  </div>

                  <p className="text-lg font-bold text-[#101b32]">
                    {project.progress}%
                  </p>
                </div>

                <div className="mt-4">
                  <ProgressBar
                    value={project.progress}
                    label={`${project.name} task-based progress`}
                  />
                </div>

                {/* Modules */}
                <div className="mt-5 space-y-4">
                  {project.modules.map((module) => (
                    <div
                      key={module.key}
                      className="rounded-[14px] border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Module
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-[#101b32]">
                            {module.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {module.completed} of {module.tasks.length} tasks completed
                          </p>
                        </div>

                        <p className="text-sm font-bold text-[#101b32]">
                          {module.progress}%
                        </p>
                      </div>

                      <div className="mt-3">
                        <ProgressBar
                          value={module.progress}
                          label={`${module.name} task-based progress`}
                        />
                      </div>

                      {/* Phases */}
                      <div className="mt-4 space-y-4">
                        {module.phases.map((phase) => (
                          <div
                            key={phase.key}
                            className="rounded-[12px] border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                  Phase
                                </p>
                                <h4 className="mt-1 text-sm font-semibold text-[#101b32]">
                                  {phase.name}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500">
                                  {phase.completed} of {phase.tasks.length} tasks completed
                                </p>
                              </div>

                              <p className="text-sm font-bold text-[#101b32]">
                                {phase.progress}%
                              </p>
                            </div>

                            <div className="mt-3">
                              <ProgressBar
                                value={phase.progress}
                                label={`${phase.name} task-based progress`}
                              />
                            </div>

                            <ul className="mt-2">
                              {phase.tasks.map((task, index) => (
                                <TaskRow
                                  key={task.uuid ?? `${task.title}-${index}`}
                                  task={task}
                                />
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
