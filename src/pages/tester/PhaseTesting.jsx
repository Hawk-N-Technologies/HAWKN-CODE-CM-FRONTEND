import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";
const initial = [
  ["PH-001", "Discovery", "Requirements", "Passed", "Requirements verified."],
  ["PH-002", "Core Development", "Authentication", "Pending", ""],
  [
    "PH-003",
    "Core Development",
    "Reports",
    "Failed",
    "Export validation failed.",
  ],
];
export default function PhaseTesting() {
  const [data, setData] = useState(initial);
  const up = (id, k, v) =>
    setData((p) =>
      p.map((x) => (x[0] === id ? x.map((a, i) => (i === k ? v : a)) : x)),
    );
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Phase Testing</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Validate modules and features phase by phase.
        </p>
      </div>
      {data.map((x) => (
        <section
          key={x[0]}
          className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-cm-text-muted">{x[0]}</p>
              <h2 className="font-semibold text-cm-text">
                {x[1]} · {x[2]}
              </h2>
            </div>
            <Badge
              tone={
                x[3] === "Passed"
                  ? "success"
                  : x[3] === "Failed"
                    ? "danger"
                    : "warning"
              }
            >
              {x[3]}
            </Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select
              label="Test Result"
              value={x[3]}
              options={["Pending", "Passed", "Failed"].map((v) => ({
                value: v,
                label: v,
              }))}
              onChange={(e) => up(x[0], 3, e.target.value)}
            />
            <Textarea
              label="Testing Notes"
              value={x[4]}
              onChange={(e) => up(x[0], 4, e.target.value)}
              placeholder="Enter phase testing notes..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => showToast.success("Phase testing result saved.")}
            >
              Save Result
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
}
