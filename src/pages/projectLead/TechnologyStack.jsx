import { useState } from "react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

function TechnologyStack() {
  const [stack, setStack] = useState({
    frontend: "React",
    backend: "Node.js",
    database: "PostgreSQL",
    deployment: "Render",
    versionControl: "GitHub",
  });

  const update = (key, value) =>
    setStack((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Technology Stack</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Define the technology used by the project.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Frontend"
            value={stack.frontend}
            onChange={(e) => update("frontend", e.target.value)}
          />
          <Input
            label="Backend"
            value={stack.backend}
            onChange={(e) => update("backend", e.target.value)}
          />
          <Input
            label="Database"
            value={stack.database}
            onChange={(e) => update("database", e.target.value)}
          />
          <Input
            label="Deployment"
            value={stack.deployment}
            onChange={(e) => update("deployment", e.target.value)}
          />
          <Input
            label="Version Control"
            value={stack.versionControl}
            onChange={(e) => update("versionControl", e.target.value)}
          />
        </div>
        <div className="mt-6 flex justify-end border-t border-cm-border pt-4">
          <Button onClick={() => showToast.success("Technology stack saved.")}>
            Save Technology Stack
          </Button>
        </div>
      </section>
    </div>
  );
}

export default TechnologyStack;
