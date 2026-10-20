
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";

const STATUS_PROGRESS = {
  Backlog: 0,
  "To Do": 0,
  "In Progress": 50,
  "Code Review": 80,
  Testing: 90,
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
  if (tasks.length === 0) return 0;

  const total = tasks.reduce(
    (sum, task) => sum + getStatusProgress(task.status),
    0,
  );

  return Math.round(total / tasks.length);
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
      task.project?.uuid ?? task.project?.id ?? task.project?.name ??
      "unknown-project",
    moduleName: task.module?.name || "Unassigned module",
    moduleKey:
      task.module?.uuid ?? task.module?.id ?? task.module?.name ??
      "unassigned-module",
    phaseName: task.phase?.name || "Unassigned phase",
    phaseKey:
      task.phase?.uuid ?? task.phase?.id ?? task.phase?.name ??
      "unassigned-phase",
  };
}

function ProgressBar({ value, label }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-cm-border"
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
  const progress = calculateProgress(tasks);

  return (
    <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-cm-text-muted">
            Overall Task Progress
          </p>
          <p className="mt-1 text-3xl font-bold text-cm-text">
            {progress}%
          </p>
          <p className="mt-1 text-sm text-cm-text-muted">
            {completed} of {tasks.length} tasks completed
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-cm-text-muted">Assigned projects</p>
          <p className="mt-1 text-2xl font-semibold text-cm-text">
            {new Set(tasks.map((task) => task.projectKey)).size}
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
    <li className="flex flex-wrap items-center justify-between gap-3 border-t border-cm-border py-3 first:border-t-0">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-cm-text">
          {task.title}
        </p>
        <p className="mt-1 text-xs text-cm-text-muted">
          {task.status} · {getStatusProgress(task.status)}% task progress
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
    return <Loader context="page" label="Loading development progress..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-cm-text">
            Development Progress
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Progress calculated from your assigned tasks.
          </p>
        </div>

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
      <div>
        <h1 className="text-xl font-bold text-cm-text">
          Development Progress
        </h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Project and phase progress based on your assigned task statuses.
        </p>
      </div>

      {tasks.length === 0 ? (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
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
                className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-cm-text">
                      {project.name}
                    </h2>
                    <p className="mt-1 text-xs text-cm-text-muted">
                      {project.completed} of {project.tasks.length} tasks completed
                    </p>
                  </div>

                  <p className="text-lg font-bold text-cm-text">
                    {project.progress}%
                  </p>
                </div>

                <div className="mt-4">
                  <ProgressBar
                    value={project.progress}
                    label={`${project.name} task-based progress`}
                  />
                </div>

                <div className="mt-5 space-y-4">
                  {project.modules.map((module) => (
                    <div
                      key={module.key}
                      className="rounded-lg border border-cm-border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-cm-text">
                            {module.name}
                          </h3>
                          <p className="mt-1 text-xs text-cm-text-muted">
                            {module.completed} of {module.tasks.length} tasks completed
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-cm-text">
                          {module.progress}%
                        </p>
                      </div>

                      <div className="mt-3">
                        <ProgressBar
                          value={module.progress}
                          label={`${module.name} task-based progress`}
                        />
                      </div>

                      <div className="mt-4 space-y-4">
                        {module.phases.map((phase) => (
                          <div
                            key={phase.key}
                            className="rounded-lg bg-cm-bg p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-semibold text-cm-text">
                                  {phase.name}
                                </h4>
                                <p className="mt-1 text-xs text-cm-text-muted">
                                  {phase.completed} of {phase.tasks.length} tasks completed
                                </p>
                              </div>

                              <p className="text-sm font-semibold text-cm-text">
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
