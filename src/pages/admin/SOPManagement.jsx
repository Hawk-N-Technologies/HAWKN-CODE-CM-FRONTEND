import { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";
import { required } from "../../utils/validators";
import { DEPARTMENTS } from "../../data/employees";

/**
 * Admin -> SOP Management (Standard Operating Procedures per department).
 *
 * All state is local (no backend/file-storage yet) — the selected file
 * is only kept as a filename for display; nothing is actually uploaded.
 * Swap `handleSubmit` for a real API call (multipart form data) once a
 * backend exists.
 */
const EMPTY_FORM = { title: "", department: "", description: "" };

function SOPManagement() {
  const [sops, setSops] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_FORM });

  const onSubmit = async (values) => {
    setIsSaving(true);
    try {
      // TODO: replace with a real multipart upload once the backend exists.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setSops((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ...values, fileName: selectedFile?.name ?? null },
      ]);
      showToast.success("SOP added.");
      reset(EMPTY_FORM);
      setSelectedFile(null);
    } catch {
      showToast.error("Couldn't save the SOP. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    if (pendingDeleteId === id) {
      setSops((prev) => prev.filter((sop) => sop.id !== id));
      setPendingDeleteId(null);
      showToast.info("SOP removed.");
    } else {
      setPendingDeleteId(id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">SOP Management</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Standard Operating Procedures, organized by department.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-cm-text">Add an SOP</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Title"
            required
            placeholder="e.g. New Employee Onboarding"
            error={errors.title?.message}
            {...register("title", { required: required("Title") })}
          />
          <Select
            label="Department"
            required
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            error={errors.department?.message}
            {...register("department", { required: required("Department") })}
          />
        </div>

        <Input
          label="Description"
          multiline
          rows={4}
          required
          placeholder="What this SOP covers, step by step…"
          error={errors.description?.message}
          {...register("description", { required: required("Description") })}
        />

        <FileUpload
          label="Attachment (optional)"
          onFileSelect={setSelectedFile}
          helperText="PDF or Word document, up to 10MB."
        />

        <div className="flex justify-end border-t border-cm-border pt-4">
          <Button type="submit" loading={isSaving}>
            Add SOP
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {sops.length === 0 ? (
          <div className="rounded-cm-lg border border-cm-border bg-cm-card p-6 text-center text-sm text-cm-text-muted shadow-sm">
            No SOPs added yet. Use the form above to add the first one.
          </div>
        ) : (
          sops.map((sop) => (
            <div key={sop.id} className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-cm-text">{sop.title}</h3>
                    <Badge tone="info">{sop.department}</Badge>
                  </div>
                  {sop.fileName && (
                    <p className="mt-1 text-xs text-cm-text-muted">📎 {sop.fileName}</p>
                  )}
                </div>
                <Button size="sm" variant="danger" onClick={() => handleDeleteClick(sop.id)}>
                  {pendingDeleteId === sop.id ? "Confirm?" : "Delete"}
                </Button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-cm-text-muted">
                {sop.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SOPManagement;