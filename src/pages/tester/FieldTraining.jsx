import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";
export default function FieldTraining() {
  const [status, setStatus] = useState("Scheduled"),
    [notes, setNotes] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Field Training</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Track field training sessions and observations.
        </p>
      </div>
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-cm-text-muted">TRAIN-001</p>
            <h2 className="text-lg font-semibold text-cm-text">
              Client Application Training
            </h2>
          </div>
          <Badge tone={status === "Completed" ? "success" : "info"}>
            {status}
          </Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Select
            label="Training Status"
            value={status}
            options={[
              "Scheduled",
              "In Progress",
              "Completed",
              "Rescheduled",
            ].map((v) => ({ value: v, label: v }))}
            onChange={(e) => setStatus(e.target.value)}
          />
          <Textarea
            label="Training Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record training observations..."
          />
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => showToast.success("Training update saved.")}>
            Save Update
          </Button>
        </div>
      </section>
    </div>
  );
}
