import { useState } from "react";

const METHODS = [
  { value: "RECORD_CHECK", label: "Record check", hint: "Label scanned, record reviewed" },
  { value: "PHYSICAL_INSPECTION", label: "Physical inspection", hint: "Box opened and contents counted" },
];

/** Record the verification result for one box. */
export default function VerificationForm({ onSubmit, busy }) {
  const [method, setMethod] = useState("RECORD_CHECK");
  const [result, setResult] = useState("MATCH");
  const [notes, setNotes] = useState("");
  const needsNotes = result === "MISMATCH" && !notes.trim();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (needsNotes) return;
    onSubmit({ method, result, notes: notes.trim() });
  };

  const choice = (active, tone) =>
    `flex-1 rounded-cm-lg border-2 px-3 py-3 text-left font-semibold ${
      active ? (tone === "bad" ? "border-cm-danger-600 bg-cm-danger-100" : "border-cm-blue-600 bg-cm-blue-50") : "border-cm-border bg-cm-card"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-cm-xl border border-cm-border bg-cm-card p-4 shadow-cm-sm">
      <h3 className="font-semibold">Record verification</h3>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">How was it checked?</legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          {METHODS.map((item) => (
            <button key={item.value} type="button" aria-pressed={method === item.value}
              onClick={() => setMethod(item.value)} className={choice(method === item.value)}>
              {item.label}
              <span className="block text-xs font-normal text-cm-text-muted">{item.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Result</legend>
        <div className="flex gap-2">
          <button type="button" aria-pressed={result === "MATCH"} onClick={() => setResult("MATCH")} className={choice(result === "MATCH")}>
            Match
          </button>
          <button type="button" aria-pressed={result === "MISMATCH"} onClick={() => setResult("MISMATCH")} className={choice(result === "MISMATCH", "bad")}>
            Mismatch
          </button>
        </div>
      </fieldset>

      <div>
        <label htmlFor="verify-notes" className="mb-1 block text-sm font-medium">
          Notes {result === "MISMATCH" ? "(required: what does not match?)" : "(optional)"}
        </label>
        <textarea id="verify-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-cm-lg border border-cm-border px-3 py-2 text-base" />
      </div>

      <button type="submit" disabled={busy || needsNotes}
        className="h-12 w-full rounded-cm-lg bg-cm-blue-600 font-semibold text-white hover:bg-cm-blue-700 disabled:opacity-50">
        {busy ? "Saving…" : "Save verification"}
      </button>
    </form>
  );
}
