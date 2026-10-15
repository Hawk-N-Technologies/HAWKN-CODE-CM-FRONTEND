import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import {
  getClientProjects,
  getClientProjectPhases,
  getErrorMessage,
} from "../../services/clientProjectService";

const statusTone = (status) => {
  if (status === "Completed" || status === "Done") return "success";
  if (status === "On Hold" || status === "Blocked") return "warning";

  if (
    status === "In Progress" ||
    status === "Testing" ||
    status === "Code Review"
  ) {
    return "info";
  }

  return "neutral";
};

const formatDate = (value) => {
  if (!value) return "Not scheduled";

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
};

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div
      className="mt-3 h-2 overflow-hidden rounded-full bg-cm-border"
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function TaskRow({ task }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-cm-border p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-cm-text">{task.title}</p>

        {task.description && (
          <p className="mt-1 text-xs text-cm-text-muted">
            {task.description}
          </p>
        )}

        <p className="mt-1 text-xs text-cm-text-muted">
          Priority: {task.priority || "Not specified"}
          {" · "}
          Due: {formatDate(task.dueDate)}
          {task.assignedTo
            ? ` · Employee ID: ${task.assignedTo}`
            : " · Unassigned"}
          {task.isBlocked
            ? ` · Blocked${task.blockedReason ? `: ${task.blockedReason}` : ""}`
            : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={statusTone(task.status)}>{task.status}</Badge>
        <span className="text-xs text-cm-text-muted">
          {task.progress}%
        </span>
      </div>
    </div>
  );
}

export default function Phases() {
  const [projects, setProjects] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState("");
  const [details, setDetails] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const data = await getClientProjects();

        if (!active) return;

        const rows = Array.isArray(data?.projects) ? data.projects : [];

        setProjects(rows);
        setSelectedUuid(rows[0]?.uuid || "");
      } catch (err) {
        if (active) {
          setError(
            getErrorMessage(err, "Could not load your projects."),
          );
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUuid) {
      setDetails(null);
      setLoadingDetails(false);
      return undefined;
    }

    let active = true;

    async function loadProjectDetails() {
      setLoadingDetails(true);
      setError("");
      setDetails(null);

      try {
        const data = await getClientProjectPhases(selectedUuid);

        if (active) setDetails(data);
      } catch (err) {
        if (active) {
          setError(
            getErrorMessage(err, "Could not load project phases."),
          );
        }
      } finally {
        if (active) setLoadingDetails(false);
      }
    }

    loadProjectDetails();

    return () => {
      active = false;
    };
  }, [selectedUuid]);

  const totalModules = details?.modules?.length ?? 0;

  const totalPhases = useMemo(
    () =>
      (details?.modules ?? []).reduce(
        (sum, module) => sum + (module.phases?.length ?? 0),
        0,
      ),
    [details],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">
          Project Phases
        </h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          View modules, phases, tasks, and progress for your projects.
        </p>
      </div>

      {/* Project selector */}
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <label
          htmlFor="client-project-select"
          className="mb-2 block text-sm font-medium text-cm-text"
        >
          Select Project
        </label>

        <select
          id="client-project-select"
          value={selectedUuid}
          onChange={(event) => setSelectedUuid(event.target.value)}
          disabled={loadingProjects || projects.length === 0}
          className="w-full rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-xl"
        >
          <option value="">
            {loadingProjects
              ? "Loading projects..."
              : projects.length
                ? "Choose a project"
                : "No projects available"}
          </option>

          {projects.map((project) => (
            <option key={project.uuid} value={project.uuid}>
              {project.name}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-cm-danger-100 bg-cm-danger-100/30 p-4 text-sm text-cm-danger-600"
        >
          {error}
        </div>
      )}

      {loadingDetails && (
        <p className="text-sm text-cm-text-muted" role="status">
          Loading modules, phases, and tasks...
        </p>
      )}

      {!loadingProjects && projects.length === 0 && !error && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 text-sm text-cm-text-muted">
          No projects are currently linked to your client account.
        </section>
      )}

      {details && !loadingDetails && (
        <>
          {/* Project overview */}
          <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-cm-text-muted">
                  Selected project
                </p>

                <h2 className="mt-1 text-lg font-semibold text-cm-text">
                  {details.project.name}
                </h2>

                <p className="mt-1 text-xs text-cm-text-muted">
                  {formatDate(details.project.startDate)}
                  {" to "}
                  {formatDate(details.project.deadline)}
                </p>
              </div>

              <Badge tone={statusTone(details.project.status)}>
                {details.project.status}
              </Badge>
            </div>

            <div className="mt-5 flex justify-between gap-3 text-xs">
              <span className="text-cm-text-muted">
                Overall progress · {details.project.completedTaskCount}/
                {details.project.taskCount} tasks completed
              </span>

              <span className="font-semibold text-cm-text">
                {details.project.progress}%
              </span>
            </div>

            <ProgressBar value={details.project.progress} />

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-cm-text-muted">
              <span>{totalModules} modules</span>
              <span>{totalPhases} phases</span>
            </div>
          </section>

          {details.modules.length === 0 && (
            <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 text-sm text-cm-text-muted">
              No modules have been added to this project yet.
            </section>
          )}

          {/* Modules */}
          <div className="space-y-4">
            {details.modules.map((module) => {
              const phaseTaskUuids = new Set(
                module.phases.flatMap((phase) =>
                  phase.tasks.map((task) => task.uuid),
                ),
              );

              const moduleUnassignedTasks = module.tasks.filter(
                (task) => !phaseTaskUuids.has(task.uuid),
              );

              return (
                <section
                  key={module.uuid}
                  className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-cm-text-muted">
                        Module
                      </p>

                      <h2 className="mt-1 font-semibold text-cm-text">
                        {module.name}
                      </h2>

                      {module.description && (
                        <p className="mt-1 text-sm text-cm-text-muted">
                          {module.description}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-cm-text-muted">
                        Priority: {module.priority}
                        {" · "}
                        {module.completedTaskCount}/{module.taskCount} tasks done
                      </p>
                    </div>

                    <Badge tone={statusTone(module.status)}>
                      {module.status}
                    </Badge>
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-cm-text-muted">
                    <span>Module progress</span>
                    <span>{module.progress}%</span>
                  </div>

                  <ProgressBar value={module.progress} />

                  {/* Phases */}
                  {module.phases.length > 0 && (
                    <div className="mt-5 space-y-4 border-l-2 border-cm-border pl-4">
                      {module.phases.map((phase) => (
                        <article
                          key={phase.uuid}
                          className="rounded-lg border border-cm-border p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-medium text-cm-text">
                                {phase.name}
                              </h3>

                              {phase.description && (
                                <p className="mt-1 text-sm text-cm-text-muted">
                                  {phase.description}
                                </p>
                              )}

                              <p className="mt-1 text-xs text-cm-text-muted">
                                {formatDate(phase.startDate)}
                                {" to "}
                                {formatDate(phase.endDate)}
                                {" · "}
                                {phase.completedTaskCount}/{phase.taskCount} tasks done
                              </p>
                            </div>

                            <Badge tone={statusTone(phase.status)}>
                              {phase.status}
                            </Badge>
                          </div>

                          <div className="mt-3 flex justify-between text-xs text-cm-text-muted">
                            <span>Phase progress</span>
                            <span>{phase.progress}%</span>
                          </div>

                          <ProgressBar value={phase.progress} />

                          <div className="mt-4 space-y-2">
                            {phase.tasks.length > 0 ? (
                              phase.tasks.map((task) => (
                                <TaskRow key={task.uuid} task={task} />
                              ))
                            ) : (
                              <p className="text-xs text-cm-text-muted">
                                No tasks in this phase.
                              </p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {/* Tasks belonging to a module but not a phase */}
                  {moduleUnassignedTasks.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-sm font-medium text-cm-text">
                        Module tasks not assigned to a phase
                      </h3>

                      {moduleUnassignedTasks.map((task) => (
                        <TaskRow key={task.uuid} task={task} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Tasks without a module */}
          {details.ungroupedTasks.length > 0 && (
            <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
              <h2 className="font-semibold text-cm-text">
                Tasks not assigned to a module
              </h2>

              <div className="mt-4 space-y-2">
                {details.ungroupedTasks.map((task) => (
                  <TaskRow key={task.uuid} task={task} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}