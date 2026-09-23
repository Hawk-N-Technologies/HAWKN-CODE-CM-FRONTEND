import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL_PROJECTS = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    brdStatus: "Approved",
    lead: "Unassigned",
    tester: "Unassigned",
    developers: 0,
    planning: "Not Started",
  },
  {
    id: "PRJ-002",
    name: "Northstar Website",
    brdStatus: "Approved",
    lead: "Unassigned",
    tester: "Unassigned",
    developers: 0,
    planning: "Not Started",
  },
];

const PEOPLE = {
  leads: ["Rohan Mehta", "Mira Patel"],
  testers: ["Mira Patel", "Aisha Khan"],
  developers: ["Aarav Shah", "Neha Joshi", "Dev Patel", "Ishita Shah"],
};

function Operations() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? null);
  const [assignments, setAssignments] = useState({
    lead: "",
    tester: "",
    developers: [],
    technology: "",
    erDiagram: "",
    flowchart: "",
  });

  const selected = projects.find((project) => project.id === selectedId);

  const toggleDeveloper = (name) => {
    setAssignments((prev) => ({
      ...prev,
      developers: prev.developers.includes(name)
        ? prev.developers.filter((item) => item !== name)
        : [...prev.developers, name],
    }));
  };

  const saveOperations = () => {
    if (!selected) return;
    setProjects((prev) =>
      prev.map((project) =>
        project.id === selected.id
          ? {
              ...project,
              lead: assignments.lead || "Unassigned",
              tester: assignments.tester || "Unassigned",
              developers: assignments.developers.length,
              planning: assignments.technology ? "In Progress" : "Not Started",
            }
          : project,
      ),
    );
    showToast.success("Operations plan updated.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Operations</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          After BRD approval, assign the project team and start project
          planning.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => setSelectedId(project.id)}
            className={`rounded-cm-lg border p-5 text-left shadow-sm transition ${
              selectedId === project.id
                ? "border-blue-500 bg-cm-card"
                : "border-cm-border bg-cm-card"
            }`}
          >
            <p className="text-xs text-cm-text-muted">{project.id}</p>
            <h2 className="mt-1 font-semibold text-cm-text">{project.name}</h2>
            <div className="mt-3 flex items-center justify-between">
              <Badge tone="success">{project.brdStatus}</Badge>
              <span className="text-xs text-cm-text-muted">
                {project.planning}
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
            <Badge tone="success">BRD Approved</Badge>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Project Lead"
              value={assignments.lead}
              options={[
                { value: "", label: "Select Project Lead" },
                ...PEOPLE.leads.map((v) => ({ value: v, label: v })),
              ]}
              onChange={(e) =>
                setAssignments({ ...assignments, lead: e.target.value })
              }
            />
            <Select
              label="Tester"
              value={assignments.tester}
              options={[
                { value: "", label: "Select Tester" },
                ...PEOPLE.testers.map((v) => ({ value: v, label: v })),
              ]}
              onChange={(e) =>
                setAssignments({ ...assignments, tester: e.target.value })
              }
            />
            <Select
              label="Technology Stack"
              value={assignments.technology}
              options={[
                { value: "", label: "Select technology" },
                { value: "MERN", label: "MERN" },
                { value: ".NET + React", label: ".NET + React" },
                { value: "Java + React", label: "Java + React" },
              ]}
              onChange={(e) =>
                setAssignments({ ...assignments, technology: e.target.value })
              }
            />
            <Select
              label="ERP / ER Diagram"
              value={assignments.erDiagram}
              options={[
                { value: "", label: "Not uploaded" },
                { value: "Uploaded", label: "Uploaded" },
              ]}
              onChange={(e) =>
                setAssignments({ ...assignments, erDiagram: e.target.value })
              }
            />
            <Select
              label="Flowchart"
              value={assignments.flowchart}
              options={[
                { value: "", label: "Not uploaded" },
                { value: "Uploaded", label: "Uploaded" },
              ]}
              onChange={(e) =>
                setAssignments({ ...assignments, flowchart: e.target.value })
              }
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-cm-text">Developers</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PEOPLE.developers.map((developer) => {
                const selectedDeveloper =
                  assignments.developers.includes(developer);
                return (
                  <Button
                    key={developer}
                    size="sm"
                    variant={selectedDeveloper ? "primary" : "outline"}
                    onClick={() => toggleDeveloper(developer)}
                  >
                    {developer}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-cm-border pt-4">
            <Button onClick={saveOperations}>Save Operations Plan</Button>
          </div>
        </section>
      )}
    </div>
  );
}

export default Operations;
