import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";

const COLUMNS = [
  "Idle",
  "In Progress",
  "Developer Testing",
  "Tester",
  "Client Testing",
  "Completed",
];

const INITIAL = [
  {
    id: "TASK-001",
    title: "Authentication API",
    assignee: "Aarav Shah",
    status: "In Progress",
    priority: "High",
  },
  {
    id: "TASK-002",
    title: "Dashboard UI",
    assignee: "Neha Joshi",
    status: "Developer Testing",
    priority: "Medium",
  },
  {
    id: "TASK-003",
    title: "Reports",
    assignee: "Dev Patel",
    status: "Idle",
    priority: "Low",
  },
  {
    id: "TASK-004",
    title: "Payment Integration",
    assignee: "Ishita Shah",
    status: "Client Testing",
    priority: "High",
  },
  {
    id: "TASK-005",
    title: "Profile Screen",
    assignee: "Aarav Shah",
    status: "Completed",
    priority: "Medium",
  },
];

function KanbanBoard() {
  const [tasks, setTasks] = useState(INITIAL);

  const move = (id, direction) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const index = COLUMNS.indexOf(task.status);
        const next = Math.max(
          0,
          Math.min(COLUMNS.length - 1, index + direction),
        );
        return { ...task, status: COLUMNS[next] };
      }),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Kanban Board</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Track tasks through the project delivery workflow.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[1200px] grid-cols-6 gap-3">
          {COLUMNS.map((column) => (
            <section
              key={column}
              className="min-h-[420px] rounded-cm-lg border border-cm-border bg-cm-card p-3 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-cm-border pb-3">
                <h2 className="text-xs font-semibold text-cm-text">{column}</h2>
                <span className="text-xs text-cm-text-muted">
                  {tasks.filter((t) => t.status === column).length}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {tasks
                  .filter((task) => task.status === column)
                  .map((task) => (
                    <article
                      key={task.id}
                      className="rounded-lg border border-cm-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-cm-text">
                          {task.title}
                        </h3>
                        <Badge
                          tone={
                            task.priority === "High"
                              ? "danger"
                              : task.priority === "Medium"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-cm-text-muted">
                        {task.id} · {task.assignee}
                      </p>
                      <div className="mt-3 flex justify-between gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={column === COLUMNS[0]}
                          onClick={() => move(task.id, -1)}
                        >
                          ←
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={column === COLUMNS[COLUMNS.length - 1]}
                          onClick={() => move(task.id, 1)}
                        >
                          →
                        </Button>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default KanbanBoard;
