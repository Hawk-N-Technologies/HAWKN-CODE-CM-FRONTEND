import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";

const trainingStatuses = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Rescheduled",
];

const getStatusTone = (value) => {
  switch (value) {
    case "Completed":
      return "success";
    case "In Progress":
      return "info";
    case "Rescheduled":
      return "warning";
    default:
      return "neutral";
  }
};

export default function FieldTraining() {
  const [status, setStatus] = useState("Scheduled");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    showToast.success("Training update saved.");
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
              Field Training
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
              Track field training sessions, monitor progress, and record
              training observations.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200">
                Training ID: TRAIN-001
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200">
                Client Application Training
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Current Status
              </p>
              <div className="mt-3">
                <Badge tone={getStatusTone(status)}>{status}</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Notes
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {notes.trim() ? "Added" : "Empty"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Training observations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Training Overview */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Training Reference
              </p>
              <p className="mt-2 text-lg font-bold text-cm-text">
                TRAIN-001
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
                  d="M12 6v6l4 2"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xs text-cm-text-muted">
            Session identification
          </p>
        </div>

        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Session Status
              </p>
              <p className="mt-2 text-lg font-bold text-cm-text">
                {status}
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
                  d="M9 12l2 2 4-4"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xs text-cm-text-muted">
            Current training progress
          </p>
        </div>

        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Observation Notes
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
            Recorded training observations
          </p>
        </div>
      </section>

      {/* Training Details */}
      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-cm-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cm-text-muted">
                Training Session
              </p>
            </div>
            <h2 className="mt-2 text-lg font-bold text-cm-text">
              Client Application Training
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              Update the session status and document your observations.
            </p>
          </div>

          <Badge tone={getStatusTone(status)}>{status}</Badge>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Select
                label="Training Status"
                value={status}
                options={trainingStatuses.map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(e) => setStatus(e.target.value)}
              />

              <p className="text-xs text-cm-text-muted">
                Select the current stage of this training session.
              </p>
            </div>

            <div className="space-y-2">
              <Textarea
                label="Training Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record training observations..."
              />

              <p className="text-xs text-cm-text-muted">
                Document observations, outcomes, or relevant training details.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-cm-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-cm-text-muted">
              Review the training status and notes before saving your update.
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
