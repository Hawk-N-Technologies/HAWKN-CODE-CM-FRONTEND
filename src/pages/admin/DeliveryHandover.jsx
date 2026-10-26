import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL_PROJECTS = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    phases: "4 / 4",
    handover: "Ready",
    buildTesting: "Pending",
    training: "Pending",
    delivery: "Pending",
  },
  {
    id: "PRJ-002",
    name: "Northstar Website",
    phases: "2 / 3",
    handover: "Blocked",
    buildTesting: "Not Started",
    training: "Not Started",
    delivery: "Not Started",
  },
];

function DeliveryHandover() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? null);
  const [trainingStatus, setTrainingStatus] = useState("Pending");
  const [bugFixing, setBugFixing] = useState(false);

  const selected = projects.find((project) => project.id === selectedId);
  const phasesComplete =
    selected?.phases?.split(" / ")[0] === selected?.phases?.split(" / ")[1];

  const updateStatus = (key, value) => {
    if (!selected) return;
    setProjects((prev) =>
      prev.map((project) =>
        project.id === selected.id ? { ...project, [key]: value } : project,
      ),
    );
  };

  const startHandover = () => {
    if (!selected || !phasesComplete) {
      showToast.error("All project phases must be completed before handover.");
      return;
    }
    updateStatus("handover", "In Progress");
    showToast.success("Handover initiated.");
  };

  const saveTraining = () => {
    updateStatus("training", trainingStatus);
    showToast.success("Training status updated.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Delivery & Handover</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Complete build testing, field training and final delivery after all
          phases are complete.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => setSelectedId(project.id)}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 text-left shadow-sm"
          >
            <p className="text-xs text-cm-text-muted">{project.id}</p>
            <h2 className="mt-1 font-semibold text-cm-text">{project.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                tone={project.handover === "Ready" ? "success" : "warning"}
              >
                {project.handover}
              </Badge>
              <span className="text-xs text-cm-text-muted">
                Phases {project.phases}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">{selected.id}</p>
              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {selected.name}
              </h2>
            </div>
            <Badge tone={phasesComplete ? "success" : "warning"}>
              {phasesComplete ? "All Phases Completed" : "Phases Pending"}
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            {[
              ["Handover", selected.handover],
              ["Build Testing", selected.buildTesting],
              ["Field Training", selected.training],
              ["Delivery", selected.delivery],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-cm-border p-4"
              >
                <p className="text-xs text-cm-text-muted">{label}</p>
                <p className="mt-1 text-sm font-semibold text-cm-text">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={startHandover} disabled={!phasesComplete}>
              Initiate Handover
            </Button>
            <Button
              variant="outline"
              onClick={() => updateStatus("buildTesting", "Completed")}
              disabled={!phasesComplete}
            >
              Mark Build Testing Complete
            </Button>
            <Button
              variant="outline"
              onClick={() => updateStatus("delivery", "Completed")}
              disabled={selected.training !== "Completed"}
            >
              Complete Delivery
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-cm-border p-5">
              <h3 className="text-sm font-semibold text-cm-text">
                Field Training
              </h3>
              <p className="mt-1 text-xs text-cm-text-muted">
                Tester updates training status on the training day.
              </p>
              <div className="mt-4 flex gap-3">
                <Select
                  label="Training Status"
                  value={trainingStatus}
                  options={["Pending", "In Progress", "Completed"].map((v) => ({
                    value: v,
                    label: v,
                  }))}
                  onChange={(e) => setTrainingStatus(e.target.value)}
                />
                <div className="self-end">
                  <Button size="sm" onClick={saveTraining}>
                    Save
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-cm-border p-5">
              <h3 className="text-sm font-semibold text-cm-text">
                Bug-Fixing Loop
              </h3>
              <p className="mt-1 text-xs text-cm-text-muted">
                Bug found → Bug-Fixing Phase → Fix → Retest → Continue Delivery.
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant={bugFixing ? "danger" : "outline"}
                  onClick={() => setBugFixing((value) => !value)}
                >
                  {bugFixing
                    ? "Bug-Fixing Phase Active"
                    : "Create Bug-Fixing Phase"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default DeliveryHandover;
