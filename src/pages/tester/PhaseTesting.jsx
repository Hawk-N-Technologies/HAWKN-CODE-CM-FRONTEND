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

const TEST_STATUSES = ["Pending", "Passed", "Failed"];

const STATUS_TONE = {
  Pending: "warning",
  Passed: "success",
  Failed: "danger",
};

const getSelectValue = (value) => value?.target?.value ?? value;

function PageHeader({ total, pending, passed, failed }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -right-5 -top-12 -z-10 h-52 w-52 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Quality Assurance
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
            Phase Testing
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            Validate project modules and features phase by phase, track test
            outcomes, and document verification results.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              {total} Total Tests
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              {pending} Pending
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              {passed} Passed
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              {failed} Failed
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 xl:w-[280px] xl:shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Total Phases
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-white">
              {total}
            </p>
            <p className="mt-1 text-xs text-slate-400">Testing records</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Verified
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-300">
              {passed}
            </p>
            <p className="mt-1 text-xs text-slate-400">Passed tests</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, description, tone, icon }) {
  const iconStyles = {
    warning: "bg-amber-50 text-amber-600",
    success: "bg-emerald-50 text-emerald-600",
    danger: "bg-rose-50 text-rose-600",
  };

  return (
    <article className="rounded-[20px] border border-cm-border bg-cm-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-cm-text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-cm-text">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-cm-text-muted">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyles[tone]}`}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

function PhaseSummary({ data }) {
  const counts = {
    pending: data.filter((item) => item[3] === "Pending").length,
    passed: data.filter((item) => item[3] === "Passed").length,
    failed: data.filter((item) => item[3] === "Failed").length,
  };

  const summaries = [
    {
      label: "Pending",
      value: counts.pending,
      description: "Awaiting phase validation",
      tone: "warning",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Passed",
      value: counts.passed,
      description: "Successfully validated",
      tone: "success",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="m5 12.5 4.2 4.2L19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Failed",
      value: counts.failed,
      description: "Requires attention",
      tone: "danger",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="m8.5 8.5 7 7m0-7-7 7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {summaries.map((item) => (
        <SummaryCard key={item.label} {...item} />
      ))}
    </section>
  );
}

function PhaseCard({ item, onUpdate, onSave }) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-cm-border bg-cm-card shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-cm-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M8 8h8M8 12h8M8 16h4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-blue-700">
              {item[0]}
            </span>

            <h2 className="mt-2 break-words text-base font-bold text-cm-text">
              {item[1]}
            </h2>

            <p className="mt-1 text-sm text-cm-text-muted">
              Module: <span className="font-medium text-cm-text">{item[2]}</span>
            </p>
          </div>
        </div>

        <Badge tone={STATUS_TONE[item[3]] || "neutral"}>{item[3]}</Badge>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <div className="min-w-0">
          <Select
            label="Test Result"
            value={item[3]}
            options={TEST_STATUSES.map((status) => ({
              value: status,
              label: status,
            }))}
            onChange={(value) =>
              onUpdate(item[0], 3, getSelectValue(value))
            }
          />
        </div>

        <div className="min-w-0">
          <Textarea
            label="Testing Notes"
            value={item[4]}
            onChange={(value) =>
              onUpdate(item[0], 4, getSelectValue(value))
            }
            placeholder="Enter phase testing notes..."
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-cm-border bg-cm-bg/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[11px] text-cm-text-muted">
          Review the test result and notes before saving.
        </p>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => onSave(item)}>
            Save Result
          </Button>
        </div>
      </div>
    </article>
  );
}

function SavePhaseModal({ item, onClose, onConfirm }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-phase-title"
        className="my-auto w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(2,6,23,0.3)]"
      >
        <header className="relative isolate overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-6">
          <div className="pointer-events-none absolute -right-10 -top-16 -z-10 h-48 w-48 rounded-full border border-blue-300/10" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Phase Testing Workflow
                </span>
              </div>

              <h2
                id="save-phase-title"
                className="text-xl font-bold tracking-tight text-white"
              >
                Confirm Test Result
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                Review the phase validation result before saving.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close confirmation dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-slate-300 transition-colors hover:bg-white/15 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="m7 7 10 10M17 7 7 17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Phase Record
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">{item[0]}</p>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item[3] === "Passed"
                    ? "bg-emerald-50 text-emerald-700"
                    : item[3] === "Failed"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-amber-50 text-amber-700"
                }`}
              >
                {item[3]}
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-700">
              {item[1]}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Module: {item[2]}
            </p>
          </div>

          <div>
            <p className="text-sm leading-6 text-slate-700">
              Confirm that you want to save this phase testing result.
            </p>

            {item[3] === "Failed" && (
              <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
                This phase has failed validation. Ensure the testing notes
                describe the issue that requires attention.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Confirm Save
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PhaseTesting() {
  const [data, setData] = useState(initial);
  const [pendingSave, setPendingSave] = useState(null);

  const up = (id, key, value) => {
    setData((current) =>
      current.map((item) =>
        item[0] === id
          ? item.map((field, index) => (index === key ? value : field))
          : item,
      ),
    );
  };

  const handleSaveRequest = (item) => {
    setPendingSave([...item]);
  };

  const handleConfirmSave = () => {
    if (!pendingSave) return;

    const currentRecord = data.find((item) => item[0] === pendingSave[0]);

    if (!currentRecord) {
      setPendingSave(null);
      return;
    }

    showToast.success("Phase testing result saved.");
    setPendingSave(null);
  };

  const counts = {
    pending: data.filter((item) => item[3] === "Pending").length,
    passed: data.filter((item) => item[3] === "Passed").length,
    failed: data.filter((item) => item[3] === "Failed").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        total={data.length}
        pending={counts.pending}
        passed={counts.passed}
        failed={counts.failed}
      />

      <PhaseSummary data={data} />

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-cm-text">
              Phase Validation
            </h2>
            <p className="mt-1 text-xs text-cm-text-muted">
              Review modules and record their testing outcomes.
            </p>
          </div>

          <span className="text-xs font-medium text-cm-text-muted">
            {data.length} {data.length === 1 ? "phase" : "phases"}
          </span>
        </div>

        {data.length === 0 ? (
          <div className="rounded-[22px] border border-cm-border bg-cm-card px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path
                  d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M8 8h8M8 12h8M8 16h4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h3 className="mt-4 text-sm font-bold text-cm-text">
              No phase testing records
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-cm-text-muted">
              Project phases will appear here when testing records are
              available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.map((item) => (
              <PhaseCard
                key={item[0]}
                item={item}
                onUpdate={up}
                onSave={handleSaveRequest}
              />
            ))}
          </div>
        )}
      </section>

      <SavePhaseModal
        item={pendingSave}
        onClose={() => setPendingSave(null)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}
