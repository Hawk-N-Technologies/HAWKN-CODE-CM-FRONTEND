import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const TYPES = ["Feature", "Module", "Integration", "Enhancement"];

function ModulesFeatures() {
  const [items, setItems] = useState([
    {
      id: 1,
      phase: "Core Development",
      name: "Authentication",
      type: "Module",
      status: "Completed",
    },
    {
      id: 2,
      phase: "Core Development",
      name: "Dashboard",
      type: "Feature",
      status: "In Progress",
    },
    {
      id: 3,
      phase: "Testing",
      name: "Reports",
      type: "Feature",
      status: "Not Started",
    },
  ]);
  const [form, setForm] = useState({
    phase: "Core Development",
    name: "",
    type: "Feature",
  });

  const add = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: Date.now(), ...form, status: "Not Started" },
    ]);
    setForm((prev) => ({ ...prev, name: "" }));
    showToast.success("Module / feature added.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Modules / Features</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Manage modules and features under each project phase.
        </p>
      </div>

      <form
        onSubmit={add}
        className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
      >
        <Input
          label="Phase"
          value={form.phase}
          onChange={(e) => setForm({ ...form, phase: e.target.value })}
        />
        <Input
          label="Module / Feature Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Select
          label="Type"
          value={form.type}
          options={TYPES.map((v) => ({ value: v, label: v }))}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        />
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit">Add Item</Button>
        </div>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-cm-text-muted">{item.phase}</p>
                <h2 className="mt-1 font-semibold text-cm-text">{item.name}</h2>
              </div>
              <div className="flex gap-2">
                <Badge tone="info">{item.type}</Badge>
                <Badge
                  tone={item.status === "Completed" ? "success" : "neutral"}
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModulesFeatures;
