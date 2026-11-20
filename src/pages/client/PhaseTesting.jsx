import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, MessageSquareWarning, RefreshCw, XCircle } from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TextArea from "../../components/common/TextArea";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import PageHeader from "../../components/layout/PageHeader";
import TableSearch from "../../components/tables/TableSearch";
import TablePagination from "../../components/tables/TablePagination";
import { CLIENT_APPROVAL_TONE, formatDateTime, matches } from "../../components/testing/testingUtils";
import usePagination from "../../hooks/usePagination";
import { decidePhase, getClientPhases, getTestingError } from "../../services/testingService";

/**
 * Client → Phase Approval.
 * Phases (usually the UI/design) our team needs you to approve. Approve, or
 * tell us what to change — reject / request changes need a short note.
 */

const LABEL = {
  Pending: "Waiting for you",
  Approved: "Approved",
  Rejected: "Rejected",
  "Changes Requested": "Changes requested",
};

function NoteModal({ phase, decision, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const rejecting = decision === "Rejected";

  const send = async () => {
    if (note.trim().length < 3) {
      setError("Tell us what needs to change.");
      return;
    }
    setSaving(true);
    try {
      await decidePhase(phase.uuid, { decision, note: note.trim() });
      showToast.success("Thank you — your answer has been sent to the team.");
      onDone();
    } catch (err) {
      showToast.error(getTestingError(err, "Couldn't send your answer."));
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      closeDisabled={saving}
      eyebrow="PHASE APPROVAL"
      title={rejecting ? `Reject “${phase.name}”` : `Request changes to “${phase.name}”`}
      description={phase.project.name}
      icon={MessageSquareWarning}
      size="sm"
    >
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <TextArea
          label={rejecting ? "Why doesn't this work for you?" : "What would you like changed?"}
          required
          rows={4}
          maxLength={2000}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setError("");
          }}
          error={error}
          placeholder="e.g. Please make the buttons bigger"
        />
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" variant={rejecting ? "danger" : "primary"} loading={saving} onClick={send}>
            {rejecting ? "Reject phase" : "Send request"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function PhaseTesting() {
  const [phases, setPhases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [approving, setApproving] = useState(null);
  const [noteFor, setNoteFor] = useState(null); // { phase, decision }

  useEffect(() => {
    let ignore = false;

    getClientPhases()
      .then((list) => {
        if (ignore) return;
        setPhases(list);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getTestingError(error, "Couldn't load phases."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  // Waiting-for-you first, then the rest
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return phases
      .filter((phase) => matches(query, phase.name, phase.project.name, LABEL[phase.clientApprovalStatus]))
      .sort((a, b) => (a.clientApprovalStatus === "Pending" ? -1 : 0) - (b.clientApprovalStatus === "Pending" ? -1 : 0));
  }, [phases, search]);

  // 10 per page
  const pager = usePagination(visible);
  const waiting = phases.filter((phase) => phase.clientApprovalStatus === "Pending").length;

  const approve = async (phase) => {
    setApproving(phase.uuid);
    try {
      await decidePhase(phase.uuid, { decision: "Approved" });
      showToast.success(`Thank you — “${phase.name}” is approved.`);
      reload();
    } catch (error) {
      showToast.error(getTestingError(error, "Couldn't approve the phase."));
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="CLIENT PORTAL"
        title="Phase Approval"
        description="Our team needs your approval on these phases before moving on. Approve, or tell us what to change."
        icon={ClipboardCheck}
      />

      {waiting > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          {waiting} {waiting === 1 ? "phase is" : "phases are"} waiting for your approval.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Phases</h2>
            <p className="text-sm text-slate-500">Waiting for you first.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        {phases.length > 0 && (
          <div className="mb-4">
            <TableSearch value={search} onChange={setSearch} placeholder="Search phase or project…" />
          </div>
        )}

        {isLoading ? (
          <Loader label="Loading phases…" />
        ) : loadError ? (
          <ErrorState title="Couldn't load phases" description={loadError} onRetry={reload} />
        ) : phases.length === 0 ? (
          <EmptyState title="Nothing to approve yet" description="When a phase needs your approval, it will appear here." />
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No phases match your search.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pager.pageItems.map((phase) => (
              <article
                key={phase.uuid}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-base font-bold text-[#101a3a]">{phase.name}</h3>
                    <Badge tone={CLIENT_APPROVAL_TONE[phase.clientApprovalStatus]}>
                      {LABEL[phase.clientApprovalStatus]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {phase.project.name} · {phase.moduleName}
                  </p>
                  {phase.description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{phase.description}</p>}
                  {phase.clientNote && (
                    <p className="mt-2 max-w-2xl whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <span className="font-semibold">Your note:</span> {phase.clientNote}
                    </p>
                  )}
                  {phase.clientRespondedAt && phase.clientApprovalStatus !== "Pending" && (
                    <p className="mt-1 text-[11px] text-slate-400">Answered {formatDateTime(phase.clientRespondedAt)}</p>
                  )}
                </div>

                {phase.clientApprovalStatus === "Pending" && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<XCircle size={14} />}
                      disabled={approving === phase.uuid}
                      onClick={() => setNoteFor({ phase, decision: "Rejected" })}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<MessageSquareWarning size={14} />}
                      disabled={approving === phase.uuid}
                      onClick={() => setNoteFor({ phase, decision: "Changes Requested" })}
                    >
                      Request changes
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<CheckCircle2 size={14} />}
                      loading={approving === phase.uuid}
                      onClick={() => approve(phase)}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </article>
            ))}
            {pager.hasPages && (
              <TablePagination
                page={pager.page}
                pageSize={pager.pageSize}
                total={pager.total}
                onPageChange={pager.setPage}
              />
            )}
          </div>
        )}
      </section>

      {noteFor && (
        <NoteModal
          phase={noteFor.phase}
          decision={noteFor.decision}
          onClose={() => setNoteFor(null)}
          onDone={() => {
            setNoteFor(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
