import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";
const INITIAL = [
  { id: "TASK-002", title: "Dashboard UI", result: "Pending", notes: "" },
  {
    id: "TASK-006",
    title: "User Profile",
    result: "Passed",
    notes: "UI verified.",
  },
  {
    id: "TASK-007",
    title: "Reports Export",
    result: "Failed",
    notes: "CSV export needs correction.",
  },
];
export default function DeveloperTesting() {
  const [items, setItems] = useState(INITIAL);
  const update = (id, k, v) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Developer Testing</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Record developer test results before tester review.
        </p>
      </div>
      <div className="space-y-4">
        {items.map((i) => (
          <section
            key={i.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-cm-text-muted">{i.id}</p>
                <h2 className="font-semibold text-cm-text">{i.title}</h2>
              </div>
              <Badge
                tone={
                  i.result === "Passed"
                    ? "success"
                    : i.result === "Failed"
                      ? "danger"
                      : "warning"
                }
              >
                {i.result}
              </Badge>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Select
                label="Test Result"
                value={i.result}
                options={["Pending", "Passed", "Failed"].map((v) => ({
                  value: v,
                  label: v,
                }))}
                onChange={(e) => update(i.id, "result", e.target.value)}
              />
              <Textarea
                label="Testing Notes"
                value={i.notes}
                onChange={(e) => update(i.id, "notes", e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                onClick={() => showToast.success(`${i.title} result saved.`)}
              >
                Save Result
              </Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
