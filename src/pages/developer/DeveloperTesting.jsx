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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cm-text">
            Developer Testing
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Record and save developer test results before tester review.
          </p>
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

      {loading && (
        <div
          className="rounded-cm-lg border border-cm-border bg-cm-card p-6 text-sm text-cm-text-muted"
          role="status"
        >
          Loading your assigned tasks and testing records...
        </div>
      )}

      {!loading && loadError && (
        <section
          className="rounded-cm-lg border border-red-200 bg-cm-card p-6"
          role="alert"
        >
          <p className="font-medium text-cm-text">
            Could not load developer testing records.
          </p>
          <p className="mt-1 text-sm text-cm-text-muted">{loadError}</p>
          <Button className="mt-4" size="sm" onClick={loadRecords}>
            Try Again
          </Button>
        </section>
      )}

      {!loading && !loadError && items.length === 0 && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-8 text-center">
          <h2 className="font-semibold text-cm-text">
            No assigned tasks found
          </h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            Developer testing records will appear here when tasks are assigned
            to you.
          </p>
        </section>
      )}

      {!loading &&
        !loadError &&
        items.map((item) => {
          const draft = drafts[item.taskUuid] ?? {
            result: item.result ?? "Pending",
            notes: item.notes ?? "",
          };
          const saving = savingIds.includes(item.taskUuid);

          return (
            <section
              key={item.taskUuid}
              className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-cm-text-muted">
                    {item.project}
                  </p>
                  <h2 className="mt-1 font-semibold text-cm-text">
                    {item.taskTitle}
                  </h2>
                  <p className="mt-1 text-xs text-cm-text-muted">
                    Task status: {item.taskStatus}
                  </p>
                </div>

                <Badge tone={getBadgeTone(item.result)}>
                  {item.result}
                </Badge>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                    updateDraft(item.taskUuid, "notes", event.target.value)
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
                <p className="mt-3 text-xs text-cm-text-muted">
                  Last tested: {new Date(item.testedAt).toLocaleString()}
                </p>
              )}

              <div className="mt-4 flex justify-end">
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
  );
}