import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";

const testingResults = [
  "Pending",
  "Passed",
  "Failed",
  "Changes Requested",
];

const getResultTone = (value) => {
  switch (value) {
    case "Passed":
      return "success";
    case "Failed":
      return "danger";
    case "Changes Requested":
      return "warning";
    default:
      return "warning";
  }
};

export default function ClientTesting() {
  const [result, setResult] = useState("Pending");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    showToast.success("Client testing update saved.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-blue-300/10" />
        <div className="pointer-events-none absolute -right-8 -top-20 h-56 w-56 rounded-full border border-blue-300/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200">
                Tester Workspace
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Client Testing
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
              Track client-side validation, review feedback, and record testing
              results before project delivery.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200">
                Project: PRJ-001
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200">
                Acme Retail ERP
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Testing Result
              </p>
              <div className="mt-3">
                <Badge tone={getResultTone(result)}>{result}</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Client Feedback
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {notes.trim() ? "Added" : "Empty"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Feedback observations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testing Overview */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Project Reference
              </p>
              <p className="mt-2 text-lg font-bold text-cm-text">
                PRJ-001
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 7.5 7.5 4.3 7.5-4.3M12 12v9"
                />
              </svg>
            </div>
          </div>

          <p className="mt-2 text-xs text-cm-text-muted">
            Client project identification
          </p>
        </div>

        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Current Result
              </p>
              <p className="mt-2 text-lg font-bold text-cm-text">
                {result}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 12 2 2 4-4"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
          </div>

          <p className="mt-2 text-xs text-cm-text-muted">
            Latest client testing selection
          </p>
        </div>

        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Feedback Status
              </p>
              <p className="mt-2 text-lg font-bold text-cm-text">
                {notes.trim() ? "Available" : "Not Added"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h8M8 11h8M8 15h5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                />
              </svg>
            </div>
          </div>

          <p className="mt-2 text-xs text-cm-text-muted">
            Recorded client observations
          </p>
        </div>
      </section>

      {/* Client Testing Details */}
      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-cm-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cm-text-muted">
                Client Validation
              </p>
            </div>

            <h2 className="mt-2 text-lg font-bold text-cm-text">
              Acme Retail ERP
            </h2>

            <p className="mt-1 text-sm text-cm-text-muted">
              Review the client testing result and document feedback.
            </p>
          </div>

          <Badge tone={getResultTone(result)}>{result}</Badge>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Select
                label="Client Testing Result"
                value={result}
                options={testingResults.map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(e) => setResult(e.target.value)}
              />

              <p className="text-xs text-cm-text-muted">
                Select the result of the client-side validation.
              </p>
            </div>

            <div className="space-y-2">
              <Textarea
                label="Client Feedback"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record client testing feedback..."
              />

              <p className="text-xs text-cm-text-muted">
                Record feedback, requested changes, or validation observations.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-cm-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-cm-text-muted">
              Review the selected result and feedback before saving.
            </p>

            <Button onClick={handleSave}>
              Save Update
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
