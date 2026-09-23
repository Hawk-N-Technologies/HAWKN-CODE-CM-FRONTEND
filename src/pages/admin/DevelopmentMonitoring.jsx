import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">
          Development Monitoring
        </h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Monitor development progress through the BRD-defined task workflow.
        </p>
      </div>

      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search task, developer or phase…"
      />

      <div className="overflow-x-auto">
        <div className="grid min-w-[1100px] grid-cols-6 gap-3">
          {STATUSES.map((status) => {
            const column = filtered.filter((task) => task.status === status);
            return (
              <section
                key={status}
                className="min-h-[360px] rounded-cm-lg border border-cm-border bg-cm-card p-3 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-cm-border pb-3">
                  <h2 className="text-xs font-semibold text-cm-text">
                    {status}
                  </h2>
                  <span className="text-xs text-cm-text-muted">
                    {column.length}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {column.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-lg border border-cm-border bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-cm-text">
                          {task.title}
                        </p>
                        <Badge tone={TONE[task.status]}>{task.progress}%</Badge>
                      </div>
                      <p className="mt-2 text-xs text-cm-text-muted">
                        {task.id} · {task.phase}
                      </p>
                      <p className="mt-1 text-xs text-cm-text-muted">
                        {task.developer}
                      </p>
                      <div className="mt-3 flex justify-between gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={task.status === STATUSES[0]}
                          onClick={() => moveTask(task.id, -1)}
                        >
                          ←
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            task.status === STATUSES[STATUSES.length - 1]
                          }
                          onClick={() => moveTask(task.id, 1)}
                        >
                          →
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">
          Development Status
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Total Tasks", tasks.length],
            [
              "Completed",
              tasks.filter((task) => task.status === "Completed").length,
            ],
            [
              "Testing",
              tasks.filter((task) =>
                ["Developer Testing", "Tester", "Client Testing"].includes(
                  task.status,
                ),
              ).length,
            ],
            [
              "In Progress",
              tasks.filter((task) => task.status === "In Progress").length,
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-cm-border p-4">
              <p className="text-xs text-cm-text-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold text-cm-text">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DevelopmentMonitoring;
