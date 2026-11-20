import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, MessageSquarePlus, PackageCheck, RefreshCw } from "lucide-react";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import TextArea from "../../components/common/TextArea";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import PageHeader from "../../components/layout/PageHeader";
import TableSearch from "../../components/tables/TableSearch";
import TablePagination from "../../components/tables/TablePagination";
import DeliveryCard from "../../components/delivery/DeliveryCard";
import DeliveryDetails from "../../components/delivery/DeliveryDetails";
import {
  CLIENT_STATUS_LABEL,
  deliverySearchText,
  formatDateTime,
} from "../../components/delivery/deliveryUtils";
import usePagination from "../../hooks/usePagination";
import {
  acceptDelivery,
  getDeliveries,
  getDeliveryError,
  requestDeliveryFollowUp,
} from "../../services/deliveryService";

/**
 * Client → Delivery.
 * Deliveries approved by Admin: open the live link and how-to documents, then
 * Accept (the project is completed) or ask for a Follow-up (a Change Request
 * ticket, also visible under Bugs & Issues).
 */

const PRIORITIES = ["Low", "Medium", "High", "Critical"];

function FollowUpModal({ delivery, onClose, onDone }) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { title: "", description: "", severity: "Medium" } });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await requestDeliveryFollowUp(delivery.uuid, values);
      showToast.success("Follow-up sent. We've raised a Change Request for you.");
      onDone();
    } catch (error) {
      showToast.error(getDeliveryError(error, "Couldn't send the follow-up."));
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      closeDisabled={saving}
      eyebrow="FOLLOW-UP"
      title="Ask for a follow-up"
      description={`Tell us what you'd like changed in ${delivery.project.name}. This creates a Change Request you can track under Bugs & Issues.`}
      icon={MessageSquarePlus}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6 sm:px-8">
        <Input
          label="What would you like changed?"
          required
          maxLength={200}
          placeholder="e.g. Add a dark mode"
          {...register("title", {
            required: "Please add a short title",
            minLength: { value: 3, message: "Title is too short" },
          })}
          error={errors.title?.message}
        />
        <TextArea
          label="Details (optional)"
          rows={4}
          maxLength={5000}
          placeholder="Anything that helps us understand the change"
          {...register("description")}
        />
        <Select
          label="Priority"
          options={PRIORITIES.map((value) => ({ value, label: value }))}
          {...register("severity")}
        />
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} leftIcon={<MessageSquarePlus size={16} />}>
            Send follow-up
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Delivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  const [followUpFor, setFollowUpFor] = useState(null);
  const [acceptingUuid, setAcceptingUuid] = useState(null);

  useEffect(() => {
    let ignore = false;

    getDeliveries()
      .then((list) => {
        if (ignore) return;
        setDeliveries(list);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getDeliveryError(error, "Couldn't load your deliveries."));
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

  const accept = async (delivery) => {
    setAcceptingUuid(delivery.uuid);
    try {
      await acceptDelivery(delivery.uuid);
      showToast.success(`Thank you! ${delivery.project.name} is now marked as completed.`);
      setViewing(null);
      reload();
    } catch (error) {
      showToast.error(getDeliveryError(error, "Couldn't accept the delivery."));
    } finally {
      setAcceptingUuid(null);
    }
  };

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? deliveries.filter((item) => deliverySearchText(item).includes(query)) : deliveries;
  }, [deliveries, search]);

  // 10 per page
  const pager = usePagination(visible);
  const waiting = deliveries.filter((item) => item.status === "Sent to Client").length;

  const actionsFor = (delivery) =>
    delivery.status === "Sent to Client" && (
      <>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<MessageSquarePlus size={14} />}
          onClick={() => setFollowUpFor(delivery)}
          disabled={acceptingUuid === delivery.uuid}
        >
          Follow-up
        </Button>
        <Button
          size="sm"
          leftIcon={<CheckCircle2 size={14} />}
          loading={acceptingUuid === delivery.uuid}
          onClick={() => accept(delivery)}
        >
          Accept
        </Button>
      </>
    );

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="CLIENT PORTAL"
        title="Delivery"
        description="Your finished projects: open the live link and guides, then accept the delivery or ask for a follow-up."
        icon={PackageCheck}
      />

      {waiting > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          {waiting} {waiting === 1 ? "delivery is" : "deliveries are"} waiting for your review.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Your deliveries</h2>
            <p className="text-sm text-slate-500">Open a delivery to see the live link and guides.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        {deliveries.length > 0 && (
          <div className="mb-4">
            <TableSearch value={search} onChange={setSearch} placeholder="Search project or version…" />
          </div>
        )}

        {isLoading ? (
          <Loader label="Loading your deliveries…" />
        ) : loadError ? (
          <ErrorState title="Couldn't load your deliveries" description={loadError} onRetry={reload} />
        ) : deliveries.length === 0 ? (
          <EmptyState
            title="No deliveries yet"
            description="When your project is ready, it will appear here for you to review."
          />
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No deliveries match your search.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pager.pageItems.map((delivery) => (
              <DeliveryCard
                key={delivery.uuid}
                delivery={delivery}
                statusLabel={CLIENT_STATUS_LABEL[delivery.status]}
                meta={`Delivered ${formatDateTime(delivery.sentToClientAt)}`}
              >
                <Button size="sm" variant="outline" onClick={() => setViewing(delivery)}>
                  View
                </Button>
                {actionsFor(delivery)}
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

      {viewing && (
        <Modal
          onClose={() => setViewing(null)}
          eyebrow={(CLIENT_STATUS_LABEL[viewing.status] ?? viewing.status).toUpperCase()}
          title={viewing.project.name}
          description={viewing.versionLabel ? `Version ${viewing.versionLabel}` : undefined}
          icon={PackageCheck}
          size="md"
        >
          <div className="space-y-6 px-6 py-6 sm:px-8">
            <DeliveryDetails delivery={viewing} />
            {viewing.status === "Sent to Client" && (
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                {actionsFor(viewing)}
              </div>
            )}
          </div>
        </Modal>
      )}

      {followUpFor && (
        <FollowUpModal
          delivery={followUpFor}
          onClose={() => setFollowUpFor(null)}
          onDone={() => {
            setFollowUpFor(null);
            setViewing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
