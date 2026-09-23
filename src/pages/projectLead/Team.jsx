import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const PEOPLE = {
  developers: ["Aarav Shah", "Neha Joshi", "Dev Patel", "Ishita Shah"],
  testers: ["Mira Patel", "Aisha Khan"],
};

function Team() {
  const [lead, setLead] = useState("Rohan Mehta");
  const [developers, setDevelopers] = useState(["Aarav Shah", "Neha Joshi"]);
  const [tester, setTester] = useState("Mira Patel");

  const toggleDeveloper = (name) => {
    setDevelopers((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name],
    );
  };

  const save = () => showToast.success("Project team updated.");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Team</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Assign and manage the project team.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Project Lead"
            value={lead}
            options={[{ value: lead, label: lead }]}
            onChange={(e) => setLead(e.target.value)}
          />
          <Select
            label="Tester"
            value={tester}
            options={PEOPLE.testers.map((v) => ({ value: v, label: v }))}
            onChange={(e) => setTester(e.target.value)}
          />
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-cm-text">Developers</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PEOPLE.developers.map((developer) => (
              <Button
                key={developer}
                size="sm"
                variant={developers.includes(developer) ? "primary" : "outline"}
                onClick={() => toggleDeveloper(developer)}
              >
                {developer}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-cm-border p-4">
          <p className="text-xs text-cm-text-muted">Current assignment</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="info">Lead: {lead}</Badge>
            <Badge tone="purple">Tester: {tester}</Badge>
            {developers.map((developer) => (
              <Badge key={developer} tone="neutral">
                {developer}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-cm-border pt-4">
          <Button onClick={save}>Save Team</Button>
        </div>
      </section>
    </div>
  );
}

export default Team;
