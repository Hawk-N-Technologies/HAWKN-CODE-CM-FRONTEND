import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { showToast } from "../../components/common/Toast";

const INITIAL = [
  {
    id: "PH-001",
    name: "Discovery",
    deadline: "2026-09-20",
    progress: 100,
    status: "Completed",
  },
  {
    id: "PH-002",
    name: "Core Development",
    deadline: "2026-10-01",
    progress: 68,
    status: "In Progress",
  },
  {
    id: "PH-003",
    name: "Testing",
    deadline: "2026-10-08",
    progress: 0,
    status: "Not Started",
  },
];

function Phases() {
  const [phases, setPhases] = useState(INITIAL);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");

  const addPhase = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setPhases((prev) => [
      ...prev,
      {
        id: `PH-${String(prev.length + 1).padStart(3, "0")}`,
        name,
        deadline,
        progress: 0,
        status: "Not Started",
      },
    ]);
    setName("");
    setDeadline("");
    showToast.success("Phase created.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Phases</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Create phases and track phase progress.
        </p>
      </div>

      <form
        onSubmit={addPhase}
        className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
      >
        <Input
          label="Phase Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Phase Deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <div className="flex items-end">
          <Button type="submit">Create Phase</Button>
        </div>
      </form>

      <div className="space-y-3">
        {phases.map((phase) => (
          <article
            key={phase.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-cm-text-muted">{phase.id}</p>
                <h2 className="mt-1 font-semibold text-cm-text">
                  {phase.name}
                </h2>
              </div>
              <Badge
                tone={
                  phase.status === "Completed"
                    ? "success"
                    : phase.status === "In Progress"
                      ? "info"
                      : "neutral"
                }
              >
                {phase.status}
              </Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-cm-border">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${phase.progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-cm-text-muted">
              <span>{phase.progress}% progress</span>
              <span>{phase.deadline || "No deadline"}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Phases;
