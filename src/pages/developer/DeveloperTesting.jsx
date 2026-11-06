import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock3,
  FolderKanban,
  ClipboardCheck,
  CalendarClock,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";
import {
  getDeveloperTestingError,
  getMyTestingRecords,
  saveDeveloperTestingResult,
} from "../../services/developerTestingService";

const RESULT_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Passed", label: "Passed" },
  { value: "Failed", label: "Failed" },
];

function getBadgeTone(result) {
  if (result === "Passed") return "success";
  if (result === "Failed") return "danger";
  return "warning";
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
  dotClass,
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <span
        className={`absolute right-5 top-5 h-2.5 w-2.5 rounded-full ${dotClass}`}
      />

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={20} />
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </article>
  );
}

export default function DeveloperTesting() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingIds, setSavingIds] = useState([]);
  const [drafts, setDrafts] = useState({});

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const records = await getMyTestingRecords();
      setItems(Array.isArray(records) ? records : []);

      setDrafts(
        Object.fromEntries(
          (Array.isArray(records) ? records : []).map((record) => [
            record.taskUuid,
            {
              result: record.result ?? "Pending",
              notes: record.notes ?? "",
            },
          ]),
        ),
      );
    } catch (error) {
      const message = getDeveloperTestingError(error);
      setLoadError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const updateDraft = (taskUuid, field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [taskUuid]: {
        result: previous[taskUuid]?.result ?? "Pending",
        notes: previous[taskUuid]?.notes ?? "",
        [field]: value,
      },
    }));
  };

  const saveResult = async (record) => {
    const draft = drafts[record.taskUuid] ?? {
      result: record.result ?? "Pending",
      notes: record.notes ?? "",
    };

    if (draft.result === "Failed" && !draft.notes.trim()) {
      showToast.error("Add testing notes before saving a failed result.");
      return;
    }

    setSavingIds((previous) => [...previous, record.taskUuid]);

    try {
      const saved = await saveDeveloperTestingResult(record.taskUuid, {
        result: draft.result,
        notes: draft.notes,
      });

      setItems((previous) =>
        previous.map((item) =>
          item.taskUuid === record.taskUuid
            ? { ...item, ...saved }
            : item,
        ),
      );

      setDrafts((previous) => ({
        ...previous,
        [record.taskUuid]: {
          result: saved.result,
          notes: saved.notes ?? "",
        },
      }));

      showToast.success(`${record.taskTitle} result saved.`);
    } catch (error) {
      showToast.error(getDeveloperTestingError(error));
    } finally {
      setSavingIds((previous) =>
        previous.filter((id) => id !== record.taskUuid),
      );
    }
  };

  const passedCount = items.filter(
    (item) => item.result === "Passed",
  ).length;

  const failedCount = items.filter(
    (item) => item.result === "Failed",
  ).length;

  const pendingCount = items.filter(
    (item) => !item.result || item.result === "Pending",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Standardized My Attendance-style page header */}
      <header className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 -z-10 h-[290px] w-[290px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-20 -z-10 h-[220px] w-[220px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-100px] left-[38%] -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-100">
              <Sparkles size={13} />
              Personal Workspace
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px]">
              Developer Testing
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
              Record and save developer test results before tester review.
              Track your testing outcomes and notes in one place.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
                <FlaskConical size={14} className="text-blue-300" />
                Testing workspace
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
                <ClipboardCheck size={14} className="text-blue-300" />
                {loading ? "Loading records..." : `${items.length} assigned tasks`}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3 xl:justify-end">
            <div className="min-w-[145px] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Testing records
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                {loading ? "Loading..." : items.length}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadRecords}
              loading={loading}
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={15} />
                Refresh
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Testing summary */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Your testing overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Summary of your assigned developer testing results.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Assigned Tasks"
            value={loading ? "—" : items.length}
            description="Tasks available for testing"
            icon={ClipboardCheck}
            iconClass="bg-indigo-50 text-indigo-600"
            dotClass="bg-indigo-500"
          />

          <SummaryCard
            label="Passed"
            value={loading ? "—" : passedCount}
            description="Successfully tested"
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
            dotClass="bg-emerald-500"
          />

          <SummaryCard
            label="Failed"
            value={loading ? "—" : failedCount}
            description="Require attention"
            icon={XCircle}
            iconClass="bg-rose-50 text-rose-600"
            dotClass="bg-rose-500"
          />

          <SummaryCard
            label="Pending"
            value={loading ? "—" : pendingCount}
            description="Awaiting test results"
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600"
            dotClass="bg-amber-500"
          />
        </div>
      </section>

      {/* Loading state */}
      {loading && (
        <div
          className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
          role="status"
        >
          <RefreshCw
            size={24}
            className="mx-auto mb-3 animate-spin text-blue-600"
          />
          <p className="text-sm font-semibold text-slate-800">
            Loading your testing records
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Retrieving assigned tasks and their latest testing results.
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && loadError && (
        <section
          className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <XCircle size={19} />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-slate-900">
                Could not load developer testing records.
              </p>
              <p className="mt-1 text-sm text-slate-500">{loadError}</p>

              <Button
                className="mt-4"
                size="sm"
                onClick={loadRecords}
              >
                Try Again
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && !loadError && items.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FolderKanban size={22} />
          </div>

          <h2 className="font-semibold text-slate-900">
            No assigned tasks found
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Developer testing records will appear here when tasks are assigned
            to you.
          </p>
        </section>
      )}

      {/* Testing records */}
      {!loading && !loadError && items.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Assigned Testing Tasks
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review task details, record your result and save testing notes.
              </p>
            </div>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              {items.length} {items.length === 1 ? "record" : "records"}
            </span>
          </div>

          <div className="space-y-4">
            {items.map((item) => {
              const draft = drafts[item.taskUuid] ?? {
                result: item.result ?? "Pending",
                notes: item.notes ?? "",
              };

              const saving = savingIds.includes(item.taskUuid);

              return (
                <article
                  key={item.taskUuid}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  {/* Task identity */}
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:px-6">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <FlaskConical size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <FolderKanban size={13} />
                          {item.project || "Project"}
                        </p>

                        <h3 className="mt-1 break-words text-base font-semibold text-slate-900">
                          {item.taskTitle}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Task status:{" "}
                          <span className="font-medium text-slate-700">
                            {item.taskStatus || "Not specified"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Saved result
                      </span>
                      <Badge tone={getBadgeTone(item.result)}>
                        {item.result ?? "Pending"}
                      </Badge>
                    </div>
                  </div>

                  {/* Testing form */}
                  <div className="px-5 py-5 sm:px-6">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <ClipboardCheck size={16} />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                          Testing Details
                        </h4>
                        <p className="text-xs text-slate-500">
                          Enter the outcome of your developer testing.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <Select
                        name={`result-${item.taskUuid}`}
                        label="Test Result"
                        value={draft.result}
                        options={RESULT_OPTIONS}
                        onChange={(event) =>
                          updateDraft(
                            item.taskUuid,
                            "result",
                            event.target.value,
                          )
                        }
                        disabled={saving}
                      />

                      <Textarea
                        name={`notes-${item.taskUuid}`}
                        label="Testing Notes"
                        value={draft.notes}
                        placeholder="Describe what you tested and any issues found..."
                        onChange={(event) =>
                          updateDraft(
                            item.taskUuid,
                            "notes",
                            event.target.value,
                          )
                        }
                        disabled={saving}
                        required={draft.result === "Failed"}
                        error={
                          draft.result === "Failed" && !draft.notes.trim()
                            ? "Notes are required for a failed result."
                            : ""
                        }
                        rows={3}
                      />
                    </div>

                    {item.testedAt && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        <CalendarClock size={14} />
                        Last tested:{" "}
                        {new Date(item.testedAt).toLocaleString()}
                      </div>
                    )}

                    <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                      <p className="text-xs text-slate-400">
                        Failed results require testing notes.
                      </p>

                      <Button
                        size="sm"
                        onClick={() => saveResult(item)}
                        loading={saving}
                      >
                        Save Result
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
