import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";

const INITIAL = [
  {
    id: "SOP-001",
    title: "Employee Onboarding SOP",
    department: "HR",
    effectiveDate: "2026-09-01",
    acknowledgement: "Required",
    status: "Active",
    fileName: "employee-onboarding.pdf",
  },
  {
    id: "SOP-002",
    title: "Leave Process",
    department: "HR",
    effectiveDate: "2026-08-15",
    acknowledgement: "Required",
    status: "Active",
    fileName: "leave-process.pdf",
  },
];

function SOPs() {
  const [sops, setSops] = useState(INITIAL);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    department: "HR",
    effectiveDate: "",
    acknowledgement: "Required",
  });

  const add = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.effectiveDate) {
      showToast.error("Title and effective date are required.");
      return;
    }
    setSops((prev) => [
      ...prev,
      {
        id: `SOP-${String(prev.length + 1).padStart(3, "0")}`,
        ...form,
        status: "Active",
        fileName: file?.name ?? null,
      },
    ]);
    setForm({
      title: "",
      department: "HR",
      effectiveDate: "",
      acknowledgement: "Required",
    });
    setFile(null);
    showToast.success("SOP added.");
  };

  const acknowledge = (id) => {
    setSops((prev) =>
      prev.map((sop) =>
        sop.id === id ? { ...sop, acknowledgement: "Acknowledged" } : sop,
      ),
    );
    showToast.success("SOP acknowledgement recorded.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">SOPs</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          HR SOPs, process updates, effective dates and acknowledgement
          requirements.
        </p>
      </div>

      <form
        onSubmit={add}
        className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-cm-text">Add SOP</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Select
            label="Department"
            value={form.department}
            options={["HR", "Company"].map((v) => ({ value: v, label: v }))}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <Input
            label="Effective Date"
            type="date"
            required
            value={form.effectiveDate}
            onChange={(e) =>
              setForm({ ...form, effectiveDate: e.target.value })
            }
          />
        </div>
        <Select
          label="Acknowledgement"
          value={form.acknowledgement}
          options={["Required", "Not Required"].map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(e) =>
            setForm({ ...form, acknowledgement: e.target.value })
          }
        />
        <FileUpload
          label="SOP Document (optional)"
          onFileSelect={setFile}
          helperText="PDF or Word document."
        />
        <div className="flex justify-end">
          <Button type="submit">Add SOP</Button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {sops.map((sop) => (
          <article
            key={sop.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-cm-text">{sop.title}</h2>
                  <Badge tone="success">{sop.status}</Badge>
                  <Badge
                    tone={
                      sop.acknowledgement === "Acknowledged"
                        ? "success"
                        : "warning"
                    }
                  >
                    {sop.acknowledgement}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-cm-text-muted">
                  {sop.department} · Effective {sop.effectiveDate}
                  {sop.fileName ? ` · ${sop.fileName}` : ""}
                </p>
              </div>
              {sop.acknowledgement === "Required" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledge(sop.id)}
                >
                  Acknowledge
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default SOPs;
