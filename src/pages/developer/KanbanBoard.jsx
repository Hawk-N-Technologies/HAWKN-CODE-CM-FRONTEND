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
    project: "Acme Retail ERP",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "TASK-002",
    title: "Dashboard UI",
    project: "Acme Retail ERP",
    priority: "Medium",
    status: "Developer Testing",
  },
  {
    id: "TASK-003",
    title: "Reports",
    project: "Internal HRMS",
    priority: "Low",
    status: "Idle",
  },
  {
    id: "TASK-004",
    title: "Payment Integration",
    project: "Acme Retail ERP",
    priority: "High",
    status: "Client Testing",
  },
];
export default function KanbanBoard() {
  const [tasks, setTasks] = useState(INITIAL);
  const move = (id, d) =>
    setTasks((p) =>
      p.map((t) => {
        if (t.id !== id) return t;
        const i = COLUMNS.indexOf(t.status);
        return {
          ...t,
          status: COLUMNS[Math.max(0, Math.min(COLUMNS.length - 1, i + d))],
        };
      }),
    );
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Kanban Board</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Move tasks through development and testing.
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[1200px] grid-cols-6 gap-3">
          {COLUMNS.map((c) => (
            <section
              key={c}
              className="min-h-[420px] rounded-cm-lg border border-cm-border bg-cm-card p-3 shadow-sm"
            >
              <div className="flex justify-between border-b border-cm-border pb-3">
                <h2 className="text-xs font-semibold text-cm-text">{c}</h2>
                <span className="text-xs text-cm-text-muted">
                  {tasks.filter((t) => t.status === c).length}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {tasks
                  .filter((t) => t.status === c)
                  .map((t) => (
                    <article
                      key={t.id}
                      className="rounded-lg border border-cm-border p-3"
                    >
                      <div className="flex justify-between gap-2">
                        <h3 className="text-sm font-medium text-cm-text">
                          {t.title}
                        </h3>
                        <Badge
                          tone={
                            t.priority === "High"
                              ? "danger"
                              : t.priority === "Medium"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {t.priority}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-cm-text-muted">
                        {t.id} · {t.project}
                      </p>
                      <div className="mt-3 flex justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={c === COLUMNS[0]}
                          onClick={() => move(t.id, -1)}
                        >
                          ←
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={c === COLUMNS.at(-1)}
                          onClick={() => move(t.id, 1)}
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
