import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CalendarClock, ExternalLink, GraduationCap, Pencil, Plus, RefreshCw, Video } from "lucide-react";

import Badge from "../../components/common/Badge";
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
import { TRAINING_TONE, formatDateTime, matches, toLocalInput } from "../../components/testing/testingUtils";
import usePagination from "../../hooks/usePagination";
import {
  getTesterProjects,
  getTestingError,
  getTrainings,
  scheduleTraining,
  updateTraining,
} from "../../services/testingService";

/**
 * Tester → Field Training.
 * Schedule training sessions for the client (date & time, Google Meet /
 * walkthrough link, notes) and mark them done. The client sees every session
 * and is told when one is scheduled, moved or cancelled.
 */

const STATUSES = ["Scheduled", "Rescheduled", "Completed", "Cancelled"];

function TrainingModal({ projects, editing, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: editing
      ? {
          title: editing.title,
          scheduledAt: toLocalInput(editing.scheduledAt),
          durationMinutes: editing.durationMinutes ?? "",
          meetingLink: editing.meetingLink ?? "",
          notes: editing.notes ?? "",
          status: editing.status,
        }
      : { projectId: projects[0]?.uuid ?? "", title: "", scheduledAt: "", durationMinutes: 60, meetingLink: "", notes: "" },
  });

  const onSubmit = async (values) => {
    const payload = {
      title: values.title,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      durationMinutes: values.durationMinutes === "" ? null : Number(values.durationMinutes),
      meetingLink: values.meetingLink,
      notes: values.notes,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateTraining(editing.uuid, { ...payload, status: values.status });
        showToast.success("Training updated.");
      } else {
        await scheduleTraining({ ...payload, projectId: values.projectId });
        showToast.success("Training scheduled. The client has been told.");
      }
      onSaved();
    } catch (error) {
      showToast.error(getTestingError(error, "Couldn't save the training."));
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      closeDisabled={saving}
      eyebrow="FIELD TRAINING"
      title={editing ? "Edit Training" : "Schedule Training"}
      description="The client sees the date, the meeting link and your notes."
      icon={GraduationCap}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6 sm:px-8">
        {editing ? (
          <Input label="Project" value={editing.project.name} readOnly disabled />
        ) : (
          <Select
            label="Project"
            required
            options={projects.map((project) => ({ value: project.uuid, label: project.name }))}
            placeholder="Select project"
            {...register("projectId", { required: "Pick a project" })}
            error={errors.projectId?.message}
          />
        )}
        <Input
          label="Title"
          required
          maxLength={150}
          placeholder="e.g. Admin panel walkthrough"
          {...register("title", {
            required: "Title is required",
            minLength: { value: 3, message: "Title is too short" },
          })}
          error={errors.title?.message}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date & time"
            type="datetime-local"
            required
            {...register("scheduledAt", { required: "Pick a date and time" })}
            error={errors.scheduledAt?.message}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            min={5}
            max={600}
            {...register("durationMinutes", {
              min: { value: 5, message: "At least 5 minutes" },
              max: { value: 600, message: "At most 600 minutes" },
            })}
            error={errors.durationMinutes?.message}
          />
        </div>
        <Input
          label="Meeting / walkthrough link"
          placeholder="https://meet.google.com/…"
          {...register("meetingLink", {
            pattern: { value: /^(https?:\/\/\S+)?$/i, message: "Use a full link starting with https://" },
          })}
          error={errors.meetingLink?.message}
        />
        <TextArea
          label="Notes (optional)"
          rows={3}
          maxLength={2000}
          placeholder="Agenda, who should attend, what was covered…"
          {...register("notes")}
        />
        {editing && (
          <Select label="Status" options={STATUSES.map((value) => ({ value, label: value }))} {...register("status")} />
        )}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} leftIcon={editing ? <Pencil size={16} /> : <Plus size={16} />}>
            {editing ? "Save changes" : "Schedule training"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function FieldTraining() {
  const [trainings, setTrainings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { editing: training | null }

  useEffect(() => {
    let ignore = false;

    Promise.all([getTrainings(), getTesterProjects()])
      .then(([list, projectList]) => {
        if (ignore) return;
        setTrainings(list);
        setProjects(projectList);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getTestingError(error, "Couldn't load training sessions."));
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
    return trainings.filter((item) => matches(query, item.title, item.project.name, item.status));
  }, [trainings, search]);

  // 10 per page
  const pager = usePagination(visible);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="TESTING"
        title="Field Training"
        description="Schedule training sessions for your clients and keep notes. Clients see every session and get told about changes."
        icon={GraduationCap}
        actions={
          <Button
            type="button"
            variant="outline"
            leftIcon={<Plus size={16} />}
            disabled={isLoading || projects.length === 0}
            onClick={() => setModal({ editing: null })}
            className="!min-h-[44px] !whitespace-nowrap"
          >
            Schedule Training
          </Button>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Training sessions</h2>
            <p className="text-sm text-slate-500">Latest first.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        {trainings.length > 0 && (
          <div className="mb-4">
            <TableSearch value={search} onChange={setSearch} placeholder="Search title, project or status…" />
          </div>
        )}

        {isLoading ? (
          <Loader label="Loading training sessions…" />
        ) : loadError ? (
          <ErrorState title="Couldn't load training sessions" description={loadError} onRetry={reload} />
        ) : trainings.length === 0 ? (
          <EmptyState
            title="No training sessions yet"
            description={
              projects.length ? "Schedule the first session for your client." : "You aren't testing any projects yet."
            }
          />
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No sessions match your search.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pager.pageItems.map((training) => (
              <article
                key={training.uuid}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-base font-bold text-[#101a3a]">{training.title}</h3>
                      <Badge tone={TRAINING_TONE[training.status]}>{training.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{training.project.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDateTime(training.scheduledAt)}
                      {training.durationMinutes ? ` · ${training.durationMinutes} min` : ""}
                    </p>
                    {training.notes && (
                      <p className="mt-1 line-clamp-2 max-w-xl text-xs text-slate-500">{training.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {training.meetingLink && (
                    <a
                      href={training.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      <Video className="h-4 w-4" /> Join <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Button size="sm" variant="outline" leftIcon={<Pencil size={14} />} onClick={() => setModal({ editing: training })}>
                    Edit
                  </Button>
                </div>
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

      {modal && (
        <TrainingModal
          projects={projects}
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
