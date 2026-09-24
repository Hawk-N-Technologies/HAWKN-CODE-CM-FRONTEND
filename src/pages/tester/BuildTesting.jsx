import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";
export default function BuildTesting() {
  const [data, setData] = useState([
    ["BUILD-142", "Acme Retail ERP", "Staging", "v1.4.2", "Pending"],
    ["BUILD-091", "Internal HRMS", "QA", "v0.9.1", "Passed"],
  ]);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Build Testing</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Validate application builds in assigned environments.
        </p>
      </div>
      {data.map((x) => (
        <section
          key={x[0]}
          className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-cm-text-muted">
                {x[0]} · {x[3]}
              </p>
              <h2 className="font-semibold text-cm-text">{x[1]}</h2>
              <p className="text-sm text-cm-text-muted">{x[2]}</p>
            </div>
            <Badge tone={x[4] === "Passed" ? "success" : "warning"}>
              {x[4]}
            </Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select
              label="Build Result"
              value={x[4]}
              options={["Pending", "Passed", "Failed"].map((v) => ({
                value: v,
                label: v,
              }))}
              onChange={(e) =>
                setData((p) =>
                  p.map((y) =>
                    y[0] === x[0]
                      ? [y[0], y[1], y[2], y[3], e.target.value]
                      : y,
                  ),
                )
              }
            />
            <Textarea
              label="Build Notes"
              placeholder="Add build testing notes..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => showToast.success("Build test result saved.")}
            >
              Save Result
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
}
