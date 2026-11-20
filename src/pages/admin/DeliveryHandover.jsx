import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  Send,
  Undo2,
  UsersRound,
} from "lucide-react";

import Button from "../../components/common/Button";
import TextArea from "../../components/common/TextArea";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import StatCard from "../../components/cards/StatCard";
import PageHeader from "../../components/layout/PageHeader";
import TableSearch from "../../components/tables/TableSearch";
import TablePagination from "../../components/tables/TablePagination";
import DeliveryCard from "../../components/delivery/DeliveryCard";
import DeliveryDetails from "../../components/delivery/DeliveryDetails";
import { deliverySearchText, formatDateTime } from "../../components/delivery/deliveryUtils";
import usePagination from "../../hooks/usePagination";
import {
  approveDelivery,
  getDeliveries,
  getDeliveryError,
  sendBackDelivery,
} from "../../services/deliveryService";

/**
 * Admin → Delivery & Handover.
 * Testers submit deliveries; Admin approves them (they go to the client) or
 * sends them back to the tester with a note. The client then accepts
 * (project completed) or asks for a follow-up (Change Request ticket).
 */

const FILTERS = [
  { key: "waiting", label: "Waiting for approval", statuses: ["Pending Admin Approval"] },
  { key: "client", label: "With client", statuses: ["Sent to Client"] },
  { key: "back", label: "Sent back", statuses: ["Sent Back"] },
  { key: "followup", label: "Follow-up", statuses: ["Follow-up Requested"] },
  { key: "done", label: "Accepted", statuses: ["Accepted"] },
  { key: "all", label: "All", statuses: null },
];

function ReviewModal({ delivery, onClose, onDone }) {
  const [mode, setMode] = useState("view"); // view | send-back
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [busy, setBusy] = useState(null);
  const canReview = delivery.status === "Pending Admin Approval";

  const approve = async () => {
    setBusy("approve");
    try {
      await approveDelivery(delivery.uuid);
      showToast.success("Approved — the client can now see this delivery.");
      onDone();
    } catch (error) {
      showToast.error(getDeliveryError(error, "Couldn't approve the delivery."));
      setBusy(null);
    }
  };

  const sendBack = async () => {
    if (note.trim().length < 3) {
      setNoteError("Tell the tester what to fix.");
      return;
    }
    setBusy("back");
    try {
      await sendBackDelivery(delivery.uuid, note.trim());
      showToast.success("Sent back to the tester.");
      onDone();
    } catch (error) {
      showToast.error(getDeliveryError(error, "Couldn't send the delivery back."));
      setBusy(null);
    }
  };

  return (
    <Modal
      onClose={onClose}
      closeDisabled={Boolean(busy)}
      eyebrow="DELIVERY & HANDOVER"
      title={delivery.project.name}
      description={[
        delivery.versionLabel && `Version ${delivery.versionLabel}`,
        `Client: ${delivery.clientName}`,
        delivery.submittedBy && `Submitted by ${delivery.submittedBy} · ${formatDateTime(delivery.submittedAt)}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      icon={PackageCheck}
      size="md"
    >
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <DeliveryDetails delivery={delivery} showAdminNote={delivery.status === "Sent Back"} />

        {canReview && mode === "send-back" && (
          <TextArea
            label="What should the tester fix?"
            required
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setNoteError("");
            }}
            error={noteError}
            placeholder="e.g. The user guide link is missing."
          />
        )}

        {canReview && (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            {mode === "view" ? (
              <>
                <Button
                  variant="outline"
                  leftIcon={<Undo2 size={16} />}
                  onClick={() => setMode("send-back")}
                  disabled={Boolean(busy)}
                >
                  Send back to tester
                </Button>
                <Button leftIcon={<CheckCircle2 size={16} />} loading={busy === "approve"} onClick={approve}>
                  Approve & send to client
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setMode("view")} disabled={Boolean(busy)}>
                  Back
                </Button>
                <Button variant="danger" leftIcon={<Send size={16} />} loading={busy === "back"} onClick={sendBack}>
                  Send back
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function DeliveryHandover() {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState("waiting");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let ignore = false;

    getDeliveries()
      .then((list) => {
        if (ignore) return;
        setDeliveries(list);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getDeliveryError(error, "Couldn't load deliveries."));
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

  const countOf = (statuses) =>
    statuses ? deliveries.filter((item) => statuses.includes(item.status)).length : deliveries.length;

  const visible = useMemo(() => {
    const { statuses } = FILTERS.find((item) => item.key === filter);
    const query = search.trim().toLowerCase();

    return deliveries.filter(
      (item) =>
        (!statuses || statuses.includes(item.status)) &&
        (!query || deliverySearchText(item).includes(query)),
    );
  }, [deliveries, filter, search]);

  // 10 per page
  const pager = usePagination(visible);
  const live = (value) => (isLoading ? "…" : loadError ? "—" : String(value));

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Delivery & Handover"
        description="Approve deliveries submitted by testers before they reach the client, or send them back with a note. The codebase is never handed over."
        icon={PackageCheck}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting for approval" value={live(countOf(["Pending Admin Approval"]))} icon={<Clock3 size={18} />} />
        <StatCard label="With client" value={live(countOf(["Sent to Client"]))} icon={<UsersRound size={18} />} />
        <StatCard label="Follow-ups" value={live(countOf(["Follow-up Requested"]))} icon={<Undo2 size={18} />} />
        <StatCard label="Accepted" value={live(countOf(["Accepted"]))} icon={<CheckCircle2 size={18} />} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Deliveries</h2>
            <p className="text-sm text-slate-500">Open a delivery to review it.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2" aria-label="Delivery filters">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === item.key
                  ? "border-[#0b1932] bg-[#0b1932] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"
              }`}
            >
              {item.label} ({countOf(item.statuses)})
            </button>
          ))}
        </div>

        <div className="mb-4">
          <TableSearch value={search} onChange={setSearch} placeholder="Search project, client or tester…" />
        </div>

        {isLoading ? (
          <Loader label="Loading deliveries…" />
        ) : loadError ? (
          <ErrorState title="Couldn't load deliveries" description={loadError} onRetry={reload} />
        ) : visible.length === 0 ? (
          <EmptyState
            title={deliveries.length === 0 ? "No deliveries yet" : "Nothing here"}
            description={
              deliveries.length === 0
                ? "Deliveries appear here when a tester submits a finished project."
                : "No deliveries match this filter or search."
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {pager.pageItems.map((delivery) => (
              <DeliveryCard
                key={delivery.uuid}
                delivery={delivery}
                meta={`${delivery.clientName} · submitted by ${delivery.submittedBy ?? "—"} · ${formatDateTime(delivery.submittedAt)}`}
              >
                <Button
                  size="sm"
                  variant={delivery.status === "Pending Admin Approval" ? "primary" : "outline"}
                  onClick={() => setSelected(delivery)}
                >
                  {delivery.status === "Pending Admin Approval" ? "Review" : "View"}
                </Button>
              </DeliveryCard>
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

      {selected && (
        <ReviewModal
          delivery={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
