import { useState } from "react";
import Badge from "../../components/common/Badge";

const HIERARCHY = [
  { level: "Management", people: ["Admin"] },
  { level: "Project Leads", people: ["Rohan Mehta"] },
  { level: "Developers", people: ["Aarav Shah", "Neha Joshi", "Dev Patel"] },
  { level: "Testers", people: ["Mira Patel", "Aisha Khan"] },
];

function EmployeeProfile() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Employee Hierarchy</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Company hierarchy across management, project leads, developers and
          testers.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {HIERARCHY.map((group, index) => (
          <section
            key={group.level}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cm-border text-sm font-semibold text-cm-text">
                {index + 1}
              </div>
              <h2 className="font-semibold text-cm-text">{group.level}</h2>
              <Badge tone="info">{group.people.length} people</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 pl-12">
              {group.people.map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setSelected(person)}
                  className="rounded-lg border border-cm-border px-4 py-2 text-sm text-cm-text hover:border-blue-400"
                >
                  {person}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-cm-text">{selected}</h2>
          <p className="mt-2 text-sm text-cm-text-muted">
            Employee hierarchy details and role responsibilities can be
            connected to the employee profile.
          </p>
        </section>
      )}
    </div>
  );
}

export default EmployeeProfile;
