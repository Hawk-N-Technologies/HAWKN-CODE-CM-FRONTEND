import { useState } from "react";
import Badge from "../../components/common/Badge";
import Select from "../../components/common/Select";
const statuses = ["Open", "In Progress", "Fixed", "Retest", "Closed"];
const initial = [
  ["BUG-001", "CSV export failure", "Acme Retail ERP", "High", "Open"],
  ["BUG-002", "Mobile layout issue", "Internal HRMS", "Medium", "In Progress"],
  ["BUG-003", "Validation message", "Client Portal", "Low", "Retest"],
];
export default function Bugs() {
  const [data, setData] = useState(initial);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Bugs</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Review bugs discovered during testing.
        </p>
      </div>
      {data.map((b) => (
        <article
          key={b[0]}
          className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-cm-text-muted">
                {b[0]} · {b[2]}
              </p>
              <h2 className="mt-1 font-semibold text-cm-text">{b[1]}</h2>
            </div>
            <div className="flex gap-2">
              <Badge
                tone={
                  b[3] === "High"
                    ? "danger"
                    : b[3] === "Medium"
                      ? "warning"
                      : "neutral"
                }
              >
                {b[3]}
              </Badge>
              <Badge tone="info">{b[4]}</Badge>
            </div>
          </div>
          <div className="mt-4">
            <Select
              label="Status"
              value={b[4]}
              options={statuses.map((v) => ({ value: v, label: v }))}
              onChange={(e) =>
                setData((p) =>
                  p.map((x) =>
                    x[0] === b[0]
                      ? [x[0], x[1], x[2], x[3], e.target.value]
                      : x,
                  ),
                )
              }
            />
          </div>
        </article>
      ))}
    </div>
  );
}
