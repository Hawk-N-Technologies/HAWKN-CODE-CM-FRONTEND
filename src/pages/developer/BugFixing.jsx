import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";
const STATUSES = ["Open", "In Progress", "Fixed", "Retest", "Closed"];
export default function BugFixing() {
  const [bugs, setBugs] = useState([
    {
      id: "BUG-001",
      title: "CSV export failure",
      severity: "High",
      status: "Open",
    },
    {
      id: "BUG-002",
      title: "Mobile layout issue",
      severity: "Medium",
      status: "In Progress",
    },
  ]);
  const [form, setForm] = useState({
    title: "",
    severity: "Medium",
    notes: "",
  });
  const add = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBugs((p) => [
      ...p,
      {
        id: `BUG-${String(p.length + 1).padStart(3, "0")}`,
        title: form.title,
        severity: form.severity,
        status: "Open",
      },
    ]);
    setForm({ title: "", severity: "Medium", notes: "" });
    showToast.success("Bug created.");
  };
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Bug Fixing</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Track bugs through fixing, retesting and closure.
        </p>
      </div>
      <form
        onSubmit={add}
        className="grid gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
      >
        <Input
          label="Bug Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Select
          label="Severity"
          value={form.severity}
          options={["High", "Medium", "Low"].map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
        />
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit">Create Bug</Button>
        </div>
      </form>
      <div className="space-y-3">
        {bugs.map((b) => (
          <article
            key={b.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-cm-text-muted">{b.id}</p>
                <h2 className="font-semibold text-cm-text">{b.title}</h2>
              </div>
              <div className="flex gap-2">
                <Badge tone={b.severity === "High" ? "danger" : "warning"}>
                  {b.severity}
                </Badge>
                <Badge tone={b.status === "Closed" ? "success" : "info"}>
                  {b.status}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <Select
                label="Status"
                value={b.status}
                options={STATUSES.map((v) => ({ value: v, label: v }))}
                onChange={(e) =>
                  setBugs((p) =>
                    p.map((x) =>
                      x.id === b.id ? { ...x, status: e.target.value } : x,
                    ),
                  )
                }
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
