import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CalendarDays, FileText, Pencil, Plus, RefreshCw } from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import InlineDeleteButton from "../../components/common/InlineDeleteButton";
import RichTextEditor from "../../components/common/RichTextEditor";
import RichTextView from "../../components/common/RichTextView";
import { showToast } from "../../components/common/Toast";
import PageHeader from "../../components/layout/PageHeader";
import TableSearch from "../../components/tables/TableSearch";
import TablePagination from "../../components/tables/TablePagination";
import { useAuth } from "../../hooks/useAuth";
import usePagination from "../../hooks/usePagination";
import {
  SOP_DEPARTMENTS,
  createSop,
  deleteSop,
  getSop,
  getSopError,
  getSops,
  updateSop,
} from "../../services/sopService";

/**
 * SOPs — Standard Operating Procedures.
 * Admin & HR create, edit and delete them (rich text, like Company Policies).
 * Every employee can open and read them. Used for every employee role.
 */

const EDITOR_ROLES = ["admin", "hr"];
const EMPTY = { title: "", department: "General", effectiveDate: "", content: "" };

// "2026-11-01" → "01 Nov 2026" (built from parts so the day can't shift)
const formatDate = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

const hasText = (html) =>
  String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim().length > 0 || /<img\s/i.test(html || "");

function SopFormModal({ editing, onClose, onSaved }) {
  const [values, setValues] = useState(editing ? null : EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Editing → load the full text first
  useEffect(() => {
    if (!editing) return undefined;
    let ignore = false;

    getSop(editing.uuid)
      .then((sop) => {
        if (!ignore) {
          setValues({
            title: sop.title,
            department: sop.department,
            effectiveDate: sop.effectiveDate ? String(sop.effectiveDate).slice(0, 10) : "",
            content: sop.content,
          });
        }
      })
      .catch((error) => {
        if (!ignore) setLoadError(getSopError(error, "Couldn't open this SOP."));
      });

    return () => {
      ignore = true;
    };
  }, [editing]);

  const set = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const save = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (values.title.trim().length < 3) nextErrors.title = "Title must be at least 3 characters.";
    if (!hasText(values.content)) nextErrors.content = "Write the procedure.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      title: values.title.trim(),
      department: values.department,
      effectiveDate: values.effectiveDate || null,
      content: values.content,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateSop(editing.uuid, payload);
        showToast.success("SOP saved.");
      } else {
        await createSop(payload);
        showToast.success("SOP created.");
      }
      onSaved();
    } catch (error) {
      showToast.error(getSopError(error, "Couldn't save the SOP."));
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      closeDisabled={saving}
      eyebrow="SOPS"
      title={editing ? "Edit SOP" : "New SOP"}
      description="Write the procedure step by step. Every employee will be able to read it."
      icon={editing ? Pencil : Plus}
      size="xl"
    >
      {loadError ? (
        <ErrorState title="Couldn't open this SOP" description={loadError} />
      ) : !values ? (
        <Loader label="Opening SOP…" />
      ) : (
        <form noValidate onSubmit={save} className="space-y-5 px-6 py-6 sm:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_180px]">
            <Input
              label="Title"
              required
              maxLength={200}
              placeholder="e.g. How to raise a leave request"
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
              error={errors.title}
            />
            <Select
              label="Department"
              value={values.department}
              options={SOP_DEPARTMENTS.map((value) => ({ value, label: value }))}
              onChange={(event) => set("department", event.target.value || "General")}
            />
            <Input
              label="Effective from"
              type="date"
              value={values.effectiveDate}
              onChange={(event) => set("effectiveDate", event.target.value)}
            />
          </div>

          <RichTextEditor
            label="Procedure"
            value={values.content}
            onChange={(html) => set("content", html)}
            error={errors.content}
            placeholder="Step 1…"
          />

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create SOP"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function SopViewModal({ sop, onClose }) {
  const [full, setFull] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let ignore = false;
    getSop(sop.uuid)
      .then((data) => {
        if (!ignore) setFull(data);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getSopError(error, "Couldn't open this SOP."));
      });
    return () => {
      ignore = true;
    };
  }, [sop.uuid]);

  return (
    <Modal
      onClose={onClose}
      eyebrow={sop.department.toUpperCase()}
      title={sop.title}
      description={[
        sop.effectiveDate && `Effective from ${formatDate(sop.effectiveDate)}`,
        `Last updated ${formatDateTime(sop.updatedAt)}${sop.updatedBy ? ` by ${sop.updatedBy}` : ""}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      icon={BookOpenCheck}
      size="xl"
    >
      <div className="px-6 py-6 sm:px-8">
        {loadError ? (
          <ErrorState title="Couldn't open this SOP" description={loadError} />
        ) : !full ? (
          <Loader label="Opening SOP…" />
        ) : (
          <RichTextView html={full.content} />
        )}
      </div>
    </Modal>
  );
}

export default function SOPs() {
  const { role } = useAuth();
  const canEdit = EDITOR_ROLES.includes(role);

  const [sops, setSops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(null); // null | { editing: sop | null }
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState(null);
  const [deletingUuid, setDeletingUuid] = useState(null);

  useEffect(() => {
    let ignore = false;

    getSops()
      .then((list) => {
        if (ignore) return;
        setSops(list);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getSopError(error, "Couldn't load SOPs."));
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
    return sops.filter(
      (sop) =>
        (department === "All" || sop.department === department) &&
        (!query || `${sop.title} ${sop.department} ${sop.preview}`.toLowerCase().includes(query)),
    );
  }, [sops, search, department]);

  // 10 per page
  const pager = usePagination(visible);

  const handleDelete = async (sop) => {
    if (confirmDeleteUuid !== sop.uuid) {
      setConfirmDeleteUuid(sop.uuid);
      return;
    }

    setDeletingUuid(sop.uuid);
    try {
      await deleteSop(sop.uuid);
      setSops((current) => current.filter((item) => item.uuid !== sop.uuid));
      showToast.success(`SOP "${sop.title}" deleted.`);
    } catch (error) {
      showToast.error(getSopError(error, "Couldn't delete the SOP."));
    } finally {
      setDeletingUuid(null);
      setConfirmDeleteUuid(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow={canEdit ? "COMPANY" : "KNOWLEDGE BASE"}
        title="SOPs"
        description={
          canEdit
            ? "Standard operating procedures for the whole team. Write them here — every employee can read them."
            : "How we do things at Hawk'N. Open any procedure to read it step by step."
        }
        icon={BookOpenCheck}
        actions={
          canEdit && (
            <Button
              type="button"
              variant="outline"
              leftIcon={<Plus size={16} />}
              onClick={() => setForm({ editing: null })}
              className="!min-h-[44px] !whitespace-nowrap"
            >
              New SOP
            </Button>
          )
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Procedures</h2>
            <p className="text-sm text-slate-500">
              {isLoading ? "Loading…" : `${sops.length} ${sops.length === 1 ? "SOP" : "SOPs"}`}
            </p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <TableSearch value={search} onChange={setSearch} placeholder="Search SOPs…" />
          <Select
            aria-label="Department"
            value={department}
            options={["All", ...SOP_DEPARTMENTS].map((value) => ({
              value,
              label: value === "All" ? "All departments" : value,
            }))}
            onChange={(event) => setDepartment(event.target.value || "All")}
          />
        </div>

        {isLoading ? (
          <Loader label="Loading SOPs…" />
        ) : loadError ? (
          <ErrorState title="Couldn't load SOPs" description={loadError} onRetry={reload} />
        ) : sops.length === 0 ? (
          <EmptyState
            title="No SOPs yet"
            description={canEdit ? "Write the first procedure for your team." : "Your HR team hasn't published any SOPs yet."}
          />
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No SOPs match your search.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pager.pageItems.map((sop) => (
              <article
                key={sop.uuid}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-base font-bold text-[#101a3a]">{sop.title}</h3>
                      <Badge tone="info">{sop.department}</Badge>
                    </div>
                    {sop.preview && <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-slate-500">{sop.preview}</p>}
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                      {sop.effectiveDate && (
                        <>
                          <CalendarDays className="h-3.5 w-3.5" />
                          Effective {formatDate(sop.effectiveDate)} ·
                        </>
                      )}
                      Updated {formatDateTime(sop.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button size="sm" variant={canEdit ? "outline" : "primary"} onClick={() => setViewing(sop)}>
                    Read
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Pencil size={14} />}
                        onClick={() => setForm({ editing: sop })}
                        disabled={deletingUuid === sop.uuid}
                      >
                        Edit
                      </Button>
                      <InlineDeleteButton
                        isConfirming={confirmDeleteUuid === sop.uuid}
                        loading={deletingUuid === sop.uuid}
                        disabled={deletingUuid !== null && deletingUuid !== sop.uuid}
                        onDelete={() => handleDelete(sop)}
                        onKeep={() => setConfirmDeleteUuid(null)}
                      />
                    </>
                  )}
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

      {viewing && <SopViewModal sop={viewing} onClose={() => setViewing(null)} />}

      {form && (
        <SopFormModal
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
