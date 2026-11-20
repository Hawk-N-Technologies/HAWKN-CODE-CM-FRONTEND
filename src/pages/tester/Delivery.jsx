import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { PackageCheck, Plus, RefreshCw, Send, Trash2 } from "lucide-react";

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
import { deliverySearchText } from "../../components/delivery/deliveryUtils";
import usePagination from "../../hooks/usePagination";
import {
  getDeliveries,
  getDeliveryError,
  getTesterDeliveryProjects,
  resubmitDelivery,
  submitDelivery,
} from "../../services/deliveryService";

/**
 * Tester → Delivery.
 * Submit a finished project for Admin approval (live link, how-to docs,
 * deliverables — never the codebase). If Admin sends it back, fix and resubmit.
 */

const URL_RULE = {
  pattern: { value: /^https?:\/\/\S+$/i, message: "Use a full link starting with https://" },
};

const emptyForm = (project) => ({
  projectId: project?.uuid ?? "",
  versionLabel: "",
  liveUrl: project?.suggestedLiveUrl ?? "",
  deliverables: [{ value: "" }],
  docs: project?.suggestedDocUrl ? [{ title: "Documentation", url: project.suggestedDocUrl }] : [],
  notes: "",
});

const fromDelivery = (delivery) => ({
  projectId: delivery.project.uuid,
  versionLabel: delivery.versionLabel ?? "",
  liveUrl: delivery.liveUrl,
  deliverables: delivery.deliverables.map((value) => ({ value })),
  docs: delivery.docs.map((doc) => ({ ...doc })),
  notes: delivery.notes ?? "",
});

function DeliveryForm({ projects, editing, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const submittable = projects.filter((project) => project.canSubmit);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: editing ? fromDelivery(editing) : emptyForm(submittable[0]),
  });

  const deliverables = useFieldArray({ control, name: "deliverables" });
  const docs = useFieldArray({ control, name: "docs" });

  // Picking a project pre-fills its live link / docs link from Deployment Planning
  const projectField = register("projectId", { required: "Pick a project" });
  const changeProject = (event) => {
    projectField.onChange(event);
    const project = projects.find((item) => item.uuid === event.target.value);
    reset({ ...emptyForm(project), notes: getValues("notes") });
  };

  const onSubmit = async (values) => {
    const payload = {
      versionLabel: values.versionLabel,
      liveUrl: values.liveUrl,
      deliverables: values.deliverables.map((item) => item.value).filter((item) => item.trim()),
      docs: values.docs.filter((doc) => doc.title.trim() || doc.url.trim()),
      notes: values.notes,
    };

    if (payload.deliverables.length === 0) {
      showToast.error("Add at least one deliverable.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await resubmitDelivery(editing.uuid, payload);
        showToast.success("Delivery resubmitted for admin approval.");
      } else {
        await submitDelivery({ ...payload, projectId: values.projectId });
        showToast.success("Delivery submitted for admin approval.");
      }
      onSaved();
    } catch (error) {
      showToast.error(getDeliveryError(error, "Couldn't submit the delivery."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      closeDisabled={saving}
      eyebrow="DELIVERY & HANDOVER"
      title={editing ? "Fix & Resubmit Delivery" : "Submit Delivery"}
      description="Share the live link, how-to documents and what's being delivered. The codebase is never handed over."
      icon={PackageCheck}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-6 sm:px-8">
        {editing?.adminNote && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
              What Admin asked you to fix
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-rose-800">{editing.adminNote}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {editing ? (
            <Input label="Project" value={editing.project.name} readOnly disabled />
          ) : (
            <Select
              label="Project"
              required
              {...projectField}
              onChange={changeProject}
              options={submittable.map((project) => ({ value: project.uuid, label: project.name }))}
              placeholder="Select project"
              error={errors.projectId?.message}
            />
          )}

          <Input
            label="Version (optional)"
            placeholder="e.g. v1.0"
            maxLength={50}
            {...register("versionLabel")}
          />
        </div>

        <Input
          label="Live link"
          required
          placeholder="https://your-app.example.com"
          {...register("liveUrl", { required: "Live link is required", ...URL_RULE })}
          error={errors.liveUrl?.message}
        />

        {/* Deliverables */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            Deliverables <span className="text-rose-600">*</span>
          </legend>
          <div className="mt-2 space-y-2">
            {deliverables.fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Input
                  containerClassName="flex-1"
                  placeholder="e.g. Admin panel"
                  maxLength={200}
                  aria-label={`Deliverable ${index + 1}`}
                  {...register(`deliverables.${index}.value`)}
                />
                {deliverables.fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deliverables.remove(index)}
                    aria-label={`Remove deliverable ${index + 1}`}
                    className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {deliverables.fields.length < 30 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              leftIcon={<Plus size={14} />}
              onClick={() => deliverables.append({ value: "" })}
            >
              Add deliverable
            </Button>
          )}
        </fieldset>

        {/* How-to documents */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">How-to documents</legend>
          <p className="text-xs text-slate-500">Links to guides (Google Drive, Notion, PDF…). Up to 10.</p>
          <div className="mt-2 space-y-2">
            {docs.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <Input
                  placeholder="Title, e.g. How to add a user"
                  maxLength={150}
                  aria-label={`Document ${index + 1} title`}
                  {...register(`docs.${index}.title`, { required: "Title is required" })}
                  error={errors.docs?.[index]?.title?.message}
                />
                <Input
                  placeholder="https://…"
                  aria-label={`Document ${index + 1} link`}
                  {...register(`docs.${index}.url`, { required: "Link is required", ...URL_RULE })}
                  error={errors.docs?.[index]?.url?.message}
                />
                <button
                  type="button"
                  onClick={() => docs.remove(index)}
                  aria-label={`Remove document ${index + 1}`}
                  className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {docs.fields.length < 10 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              leftIcon={<Plus size={14} />}
              onClick={() => docs.append({ title: "", url: "" })}
            >
              Add document
            </Button>
          )}
        </fieldset>

        <TextArea
          label="Notes (optional)"
          rows={3}
          maxLength={2000}
          placeholder="Anything Admin or the client should know"
          {...register("notes")}
        />

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} leftIcon={<Send size={16} />}>
            {editing ? "Resubmit for approval" : "Submit for approval"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Delivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null); // null | { editing: delivery | null }
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getDeliveries(), getTesterDeliveryProjects()])
      .then(([list, projectList]) => {
        if (ignore) return;
        setDeliveries(list);
        setProjects(projectList);
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

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? deliveries.filter((item) => deliverySearchText(item).includes(query)) : deliveries;
  }, [deliveries, search]);

  // 10 per page
  const pager = usePagination(visible);
  const canSubmitAny = projects.some((project) => project.canSubmit);
  const sentBack = deliveries.filter((item) => item.status === "Sent Back").length;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="TESTING"
        title="Delivery"
        description="Submit finished projects for admin approval. Once approved, the client can accept the delivery or ask for a follow-up."
        icon={PackageCheck}
        actions={
          <Button
            type="button"
            variant="outline"
            leftIcon={<Plus size={16} />}
            disabled={isLoading || !canSubmitAny}
            onClick={() => setForm({ editing: null })}
            className="!min-h-[44px] !whitespace-nowrap"
          >
            Submit Delivery
          </Button>
        }
      />

      {sentBack > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {sentBack} {sentBack === 1 ? "delivery was" : "deliveries were"} sent back by Admin — open
          {sentBack === 1 ? " it" : " them"} to see what to fix.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Your deliveries</h2>
            <p className="text-sm text-slate-500">Every delivery for the projects you test.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        {deliveries.length > 0 && (
          <div className="mb-4">
            <TableSearch value={search} onChange={setSearch} placeholder="Search project, version or status…" />
          </div>
        )}

        {isLoading ? (
          <Loader label="Loading deliveries…" />
        ) : loadError ? (
          <ErrorState title="Couldn't load deliveries" description={loadError} onRetry={reload} />
        ) : deliveries.length === 0 ? (
          <EmptyState
            title="No deliveries yet"
            description={
              canSubmitAny
                ? "When a project is ready, submit it here for admin approval."
                : "None of your projects can be delivered right now."
            }
          />
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No deliveries match your search.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pager.pageItems.map((delivery) => (
              <DeliveryCard key={delivery.uuid} delivery={delivery}>
                <Button size="sm" variant="outline" onClick={() => setViewing(delivery)}>
                  View
                </Button>
                {delivery.status === "Sent Back" && (
                  <Button size="sm" onClick={() => setForm({ editing: delivery })}>
                    Fix & Resubmit
                  </Button>
                )}
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
          eyebrow={viewing.status.toUpperCase()}
          title={viewing.project.name}
          description={viewing.versionLabel ? `Version ${viewing.versionLabel}` : undefined}
          icon={PackageCheck}
          size="md"
        >
          <div className="px-6 py-6 sm:px-8">
            <DeliveryDetails delivery={viewing} showAdminNote={viewing.status === "Sent Back"} />
          </div>
        </Modal>
      )}

      {form && (
        <DeliveryForm
          projects={projects}
          editing={form.editing}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
