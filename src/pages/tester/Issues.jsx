import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Bug, CalendarDays, RefreshCw, Pencil, X } from "lucide-react";

import Badge from "../../components/common/Badge";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";

const STATUSES = [
  "Submitted",
  "Under Review",
  "Confirmed",
  "Feature Request",
  "Rejected",
];

const CLASSIFICATIONS = ["Bug", "Feature Request"];

const STATUS_TONES = {
  Submitted: "info",
  "Under Review": "warning",
  Confirmed: "success",
  "Feature Request": "info",
  Rejected: "danger",
};

const SEVERITY_TONES = {
  Low: "neutral",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

const EMPTY_EDIT_FORM = {
  status: "Submitted",
  classification: "Bug",
};

const getIssuesList = (response) => {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.issues)) return payload.issues;
  return [];
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function Bugs() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editIssue, setEditIssue] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const getIssues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/bugs/issuesForTester", {
        withCredentials: true,
      });

      if (response.status === 200) {
        setIssues(getIssuesList(response));
      }
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to fetch issues."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getIssues();
  }, [getIssues]);

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesStatus = !statusFilter || issue.status === statusFilter;
      const matchesSearch =
        !query ||
        [
          issue.id,
          issue.uuid,
          issue.title,
          issue.description,
          issue.severity,
          issue.status,
          issue.classification,
          issue.projectId,
          issue.moduleId,
        ]
          .filter((value) => value !== null && value !== undefined)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [issues, search, statusFilter]);

  const openEditModal = (issue) => {
    setEditIssue(issue);
    setEditForm({
      status: issue.status || "Submitted",
      classification: issue.classification || "Bug",
    });
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditIssue(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const updateEditField = (field, value) => {
    setEditForm((previous) => ({ ...previous, [field]: value }));
  };

  // Front-end-only update for now. Replace this with the update API when its
  // route and request payload are available.
  const handleUpdateIssue = async (event) => {
    event.preventDefault();
    if (!editIssue) return;

    if (
      !STATUSES.includes(editForm.status) ||
      !CLASSIFICATIONS.includes(editForm.classification)
    ) {
      showToast.error("Please select a valid status and classification.");
      return;
    }

    console.log(editForm);
    console.log(editIssue);
    setSaving(true);
    try {
      const res = await axios.patch(
        `/api/bugs/issues/${editIssue.uuid}/status`,
        editForm,
        { withCredentials: true },
      );

      if (res.status == 201 || res.status == 200) {
        showToast.success("Issue updated successfully (local state only).");
        setEditIssue(null);
        getIssues();
        setEditForm(EMPTY_EDIT_FORM);
      }
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to update issue."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Issues for Testing</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Review reported issues and update their status and classification.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={getIssues}
          disabled={loading}
        >
          <span className="flex items-center gap-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Search issues"
          name="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title, ID, severity..."
        />

        <Select
          label="Filter by status"
          name="statusFilter"
          value={statusFilter}
          options={STATUSES.map((status) => ({
            value: status,
            label: status,
          }))}
          placeholder="All statuses"
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-cm-lg border border-cm-border bg-cm-card p-8">
          <Loader />
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-10 text-center">
          <Bug size={32} className="mx-auto text-cm-text-muted" />
          <p className="mt-3 font-medium text-cm-text">No issues found</p>
          <p className="mt-1 text-sm text-cm-text-muted">
            Try changing the search term or status filter.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredIssues.map((issue) => (
            <article
              key={issue.uuid || issue.id}
              className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-cm-text-muted">
                    ISSUE-{String(issue.id).padStart(3, "0")} · Project{" "}
                    {issue.projectId ?? "—"} · Module {issue.moduleId ?? "—"}
                  </p>
                  <h2 className="mt-1 font-semibold text-cm-text">
                    {issue.title || "Untitled issue"}
                  </h2>
                  {issue.uuid && (
                    <p className="mt-1 break-all text-xs text-cm-text-muted">
                      {issue.uuid}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone={SEVERITY_TONES[issue.severity] || "neutral"}>
                    {issue.severity || "Unspecified"}
                  </Badge>
                  <Badge tone={STATUS_TONES[issue.status] || "neutral"}>
                    {issue.status || "Unknown"}
                  </Badge>
                  <Badge tone="neutral">
                    {issue.classification || "Unclassified"}
                  </Badge>
                </div>
              </div>

              {issue.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-cm-text-muted">
                  {issue.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-cm-text-muted">
                <span className="flex items-center gap-1">
                  <CalendarDays size={13} />
                  {formatDate(issue.createdAt)}
                </span>
                {issue.reviewedBy != null && (
                  <span>Reviewed by: {issue.reviewedBy}</span>
                )}
              </div>

              {issue.reviewNotes && (
                <p className="mt-3 rounded-lg bg-cm-bg p-3 text-sm text-cm-text-muted">
                  <span className="font-medium text-cm-text">
                    Review notes:{" "}
                  </span>
                  {issue.reviewNotes}
                </p>
              )}

              <div className="mt-4 flex justify-end border-t border-cm-border pt-4">
                <Button type="button" onClick={() => openEditModal(issue)}>
                  <span className="flex items-center gap-2">
                    <Pencil size={15} />
                    Update Issue
                  </span>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editIssue && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-issue-title"
            className="w-full max-w-lg rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="edit-issue-title"
                  className="text-lg font-semibold text-cm-text"
                >
                  Update Issue
                </h2>
                <p className="mt-1 text-sm text-cm-text-muted">
                  ISSUE-{String(editIssue.id).padStart(3, "0")} ·{" "}
                  {editIssue.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Close update modal"
                className="rounded-md p-1 text-cm-text-muted hover:bg-cm-bg disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateIssue} className="mt-5 space-y-4">
              <Select
                label="Status"
                name="status"
                required
                value={editForm.status}
                options={STATUSES.map((status) => ({
                  value: status,
                  label: status,
                }))}
                onChange={(event) =>
                  updateEditField("status", event.target.value)
                }
              />

              <Select
                label="Classification"
                name="classification"
                required
                value={editForm.classification}
                options={CLASSIFICATIONS.map((classification) => ({
                  value: classification,
                  label: classification,
                }))}
                onChange={(event) =>
                  updateEditField("classification", event.target.value)
                }
              />

              <div className="flex justify-end gap-3 border-t border-cm-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={closeEditModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader />
                      Updating...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
