import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";
export default function ClientTesting() {
  const [result, setResult] = useState("Pending"),
    [notes, setNotes] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Client Testing</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Track client-side validation and feedback before delivery.
        </p>
      </div>
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-cm-text-muted">PRJ-001</p>
            <h2 className="text-lg font-semibold text-cm-text">
              Acme Retail ERP
            </h2>
          </div>
          <Badge
            tone={
              result === "Passed"
                ? "success"
                : result === "Failed"
                  ? "danger"
                  : "warning"
            }
          >
            {result}
          </Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Select
            label="Client Testing Result"
            value={result}
            options={["Pending", "Passed", "Failed", "Changes Requested"].map(
              (v) => ({ value: v, label: v }),
            )}
            onChange={(e) => setResult(e.target.value)}
          />
          <Textarea
            label="Client Feedback"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record client testing feedback..."
          />
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => showToast.success("Client testing update saved.")}
          >
            Save Update
          </Button>
        </div>
      </section>
    </div>
  );
}
