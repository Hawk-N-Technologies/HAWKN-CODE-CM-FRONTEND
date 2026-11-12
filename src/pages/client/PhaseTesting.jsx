import { useState } from "react";
import Badge from "../../components/common/Badge";
import Select from "../../components/common/Select";

const INITIAL_TESTS = [
  {
    id: "TEST-001",
    phase: "Core Development",
    project: "Acme Retail ERP",
    scenario: "User authentication",
    result: "Passed",
    tester: "Ankit Patel",
  },
  {
    id: "TEST-002",
    phase: "Core Development",
    project: "Acme Retail ERP",
    scenario: "CSV report export",
    result: "Failed",
    tester: "Ankit Patel",
  },
  {
    id: "TEST-003",
    phase: "Testing",
    project: "Internal HRMS",
    scenario: "Employee attendance",
    result: "Pending",
    tester: "Neha Shah",
  },
];

const RESULTS = ["Pending", "Passed", "Failed", "Retest"];

export default function PhaseTesting() {
  const [tests, setTests] = useState(INITIAL_TESTS);

  const updateResult = (id, result) => {
    setTests((items) =>
      items.map((item) => (item.id === id ? { ...item, result } : item)),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Phase Testing</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Review testing results for project phases.
        </p>
      </div>

      <div className="space-y-3">
        {tests.map((test) => (
          <section
            key={test.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-cm-text-muted">{test.id}</p>
                <h2 className="mt-1 font-semibold text-cm-text">
                  {test.scenario}
                </h2>
                <p className="mt-1 text-xs text-cm-text-muted">
                  {test.project} · {test.phase} · Tester: {test.tester}
                </p>
              </div>

              <Badge
                tone={
                  test.result === "Passed"
                    ? "success"
                    : test.result === "Failed"
                      ? "danger"
                      : "warning"
                }
              >
                {test.result}
              </Badge>
            </div>

            <div className="mt-4 max-w-sm">
              <Select
                label="Test Result"
                value={test.result}
                options={RESULTS.map((value) => ({ value, label: value }))}
                onChange={(event) => updateResult(test.id, event.target.value)}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
