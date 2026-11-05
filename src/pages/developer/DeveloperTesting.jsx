
import { useCallback, useEffect, useState } from "react";
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
      const safeRecords = Array.isArray(records) ? records : [];

      setItems(safeRecords);
      setDrafts(
        Object.fromEntries(
          safeRecords.map((record) => [
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

  const passedCount = items.filter((item) => item.result === "Passed").length;
  const failedCount = items.filter((item) => item.result === "Failed").length;
  const pendingCount = items.filter(
    (item) => !item.result || item.result === "Pending",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Standardized Developer Page Header */}
      <section className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 px-5 py-5 shadow-sm sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full border border-blue-100/80" />
        <div className="pointer-events-none absolute -right-2 -top-6 h-28 w-28 rounded-full border border-blue-100/70" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[13px] bg-[#0b1833] text-lg font-bold text-white shadow-sm sm:h-[62px] sm:w-[62px]">
              DEV
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700 sm:text-xs">
                Development
              </p>
              <h1 className="mt-1.5 text-[25px] font-bold leading-tight tracking-tight text-[#101b32] sm:text-[28px] lg:text-[30px]">
                Developer Testing
              </h1>
              <p className="mt-1 text-[13px] text-slate-500 sm:text-sm">
                Record and save developer test results before tester review.
              </p>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm">
              {items.length} Assigned Tasks
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadRecords}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* Testing Summary */}
      {!loading && !loadError && items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Total Assigned
            </p>
            <p className="mt-2 text-2xl font-bold text-[#101b32]">
              {items.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Tasks available for testing
            </p>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Pending
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {pendingCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Awaiting test results
            </p>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Passed
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {passedCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Successfully tested
            </p>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Failed
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {failedCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Require attention
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          className="rounded-[16px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm"
          role="status"
        >
          Loading your assigned tasks and testing records...
        </div>
      )}

      {/* Error State */}
      {!loading && loadError && (
        <section
          className="rounded-[16px] border border-red-200 bg-white p-6 shadow-sm"
          role="alert"
        >
          <p className="font-semibold text-slate-800">
            Could not load developer testing records.
          </p>
          <p className="mt-1 text-sm text-slate-500">{loadError}</p>
          <Button className="mt-4" size="sm" onClick={loadRecords}>
            Try Again
          </Button>
        </section>
      )}

      {/* Empty State */}
      {!loading && !loadError && items.length === 0 && (
        <section className="rounded-[16px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <span className="text-lg font-bold">T</span>
          </div>
          <h2 className="mt-3 font-semibold text-[#101b32]">
            No assigned tasks found
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Developer testing records will appear here when tasks are assigned
            to you.
          </p>
        </section>
      )}

      {/* Assigned Testing Records */}
      {!loading && !loadError && items.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#101b32]">
                Assigned Testing Tasks
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Update the result and provide notes for each assigned task.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {items.length} Records
            </span>
          </div>

          {items.map((item) => {
            const draft = drafts[item.taskUuid] ?? {
              result: item.result ?? "Pending",
              notes: item.notes ?? "",
            };
            const saving = savingIds.includes(item.taskUuid);

            return (
              <section
                key={item.taskUuid}
                className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                      {item.project}
                    </p>
                    <h3 className="mt-1.5 text-base font-bold text-[#101b32]">
                      {item.taskTitle}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Task status: {item.taskStatus}
                    </p>
                  </div>

                  <Badge tone={getBadgeTone(item.result)}>
                    {item.result}
                  </Badge>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                  <p className="mt-3 text-xs text-slate-400">
                    Last tested: {new Date(item.testedAt).toLocaleString()}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    {draft.result === "Failed"
                      ? "Testing notes are required for failed results."
                      : "Save your result when testing is complete."}
                  </p>

                  <Button
                    size="sm"
                    onClick={() => saveResult(item)}
                    loading={saving}
                  >
                    Save Result
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
