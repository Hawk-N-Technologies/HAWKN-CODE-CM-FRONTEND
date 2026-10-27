import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

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

const EMPTY_FORM = {
  title: "",
  department: "HR",
  effectiveDate: "",
  acknowledgement: "Required",
};

function formatDate(value) {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MetricCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${tones[tone]}`}
        >
          <Icon size={20} />
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function SOPModal({ children, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sop-modal-title"
        className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl"
      >
        {/* Premium modal header */}
        <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0b1833] via-[#122b4d] to-[#1c4168] px-5 py-6 sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 -top-10 h-40 w-40 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-[-90px] right-28 h-44 w-44 rounded-full border border-white/5" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur-sm">
                <FileText size={23} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200">
                  People operations
                </p>

                <h2
                  id="sop-modal-title"
                  className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl"
                >
                  Add Standard Operating Procedure
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-blue-100/80">
                  Add a company procedure, define its effective date, and set
                  acknowledgement requirements.
                </p>

                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    New SOP
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close add SOP dialog"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-blue-100/80">
            <ShieldCheck size={15} />
            <span>Standardized processes · Company documentation</span>
          </div>
        </header>

        {children}
      </section>
    </div>
  );
}

function SOPs() {
  const [sops, setSops] = useState(INITIAL);
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [form, setForm] = useState(EMPTY_FORM);

  const summary = useMemo(
    () => ({
      total: sops.length,
      active: sops.filter((sop) => sop.status === "Active").length,
      required: sops.filter(
        (sop) => sop.acknowledgement === "Required",
      ).length,
      acknowledged: sops.filter(
        (sop) => sop.acknowledgement === "Acknowledged",
      ).length,
    }),
    [sops],
  );

  const filteredSops = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sops.filter((sop) => {
      const matchesSearch =
        !query ||
        sop.title.toLowerCase().includes(query) ||
        sop.department.toLowerCase().includes(query) ||
        sop.id.toLowerCase().includes(query) ||
        (sop.fileName || "").toLowerCase().includes(query);

      const matchesDepartment =
        departmentFilter === "All" ||
        sop.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [sops, search, departmentFilter]);

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFile(null);
  };

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
        title: form.title.trim(),
        status: "Active",
        fileName: file?.name ?? null,
      },
    ]);

    setForm(EMPTY_FORM);
    setFile(null);
    setShowForm(false);

    showToast.success("SOP added.");
  };

  const acknowledge = (id) => {
    setSops((prev) =>
      prev.map((sop) =>
        sop.id === id
          ? { ...sop, acknowledgement: "Acknowledged" }
          : sop,
      ),
    );

    showToast.success("SOP acknowledgement recorded.");
  };

  return (
    <div className="min-w-0 space-y-6 pb-6">
      {/* Page hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/80 p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-blue-100" />
        <div className="pointer-events-none absolute -right-2 -top-12 h-44 w-44 rounded-full border border-blue-100/80" />
        <div className="pointer-events-none absolute bottom-[-100px] right-40 h-48 w-48 rounded-full border border-blue-100/60" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b1833] text-white shadow-lg shadow-slate-900/10">
              <BookOpen size={23} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
                People operations
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Standard Operating Procedures
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage company procedures, track effective dates, and maintain
                acknowledgement records in one place.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  SOP management
                </span>

                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-500">
                  {summary.total} total documents
                </span>
              </div>
            </div>
          </div>

          <div className="relative shrink-0">
            <Button onClick={() => setShowForm(true)}>
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Add SOP
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            SOP overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A quick overview of documented procedures and acknowledgement
            requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total SOPs"
            value={summary.total}
            detail="All recorded procedures"
            icon={ClipboardList}
            tone="blue"
          />

          <MetricCard
            label="Active SOPs"
            value={summary.active}
            detail="Currently active documents"
            icon={CheckCircle2}
            tone="green"
          />

          <MetricCard
            label="Acknowledgement required"
            value={summary.required}
            detail="Awaiting acknowledgement"
            icon={ShieldCheck}
            tone="amber"
          />

          <MetricCard
            label="Acknowledged"
            value={summary.acknowledged}
            detail="Recorded acknowledgements"
            icon={BookOpen}
            tone="slate"
          />
        </div>
      </section>

      {/* SOP register */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              SOP register
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse procedures and manage acknowledgement status.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search SOPs or documents..."
                aria-label="Search SOPs"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="relative shrink-0 sm:w-40">
              <Select
                label="Department"
                value={departmentFilter}
                options={["All", "HR", "Company"].map((value) => ({
                  value,
                  label: value === "All" ? "All departments" : value,
                }))}
                onChange={(event) =>
                  setDepartmentFilter(event.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredSops.length}
            </span>{" "}
            of {sops.length} SOPs
          </p>

          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Document register
          </span>
        </div>

        <div className="space-y-3 p-4 pt-1 sm:p-5 sm:pt-2">
          {filteredSops.map((sop) => (
            <article
              key={sop.id}
              className="group rounded-2xl border border-slate-200/80 bg-white p-4 transition duration-200 hover:border-blue-200 hover:shadow-md sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 transition group-hover:bg-blue-100">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {sop.title}
                      </h3>

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

                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {sop.id}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 size={15} className="text-slate-400" />
                        {sop.department}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} className="text-slate-400" />
                        Effective {formatDate(sop.effectiveDate)}
                      </span>
                    </div>

                    {sop.fileName && (
                      <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <FileText
                          size={14}
                          className="shrink-0 text-blue-600"
                        />
                        <span className="truncate">{sop.fileName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  {sop.acknowledgement === "Required" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledge(sop.id)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 size={15} />
                        Acknowledge
                      </span>
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                      <CheckCircle2 size={14} />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}

          {filteredSops.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                <FileText size={25} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No matching SOPs
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {sops.length === 0
                  ? "Start building your SOP register by adding the first procedure."
                  : "Try another search term or change the department filter."}
              </p>

              {sops.length === 0 ? (
                <div className="mt-5">
                  <Button onClick={() => setShowForm(true)}>
                    <span className="inline-flex items-center gap-2">
                      <Plus size={16} />
                      Add First SOP
                    </span>
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDepartmentFilter("All");
                  }}
                  className="mt-4 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Add SOP modal */}
      {showForm && (
        <SOPModal onClose={closeForm}>
          <form
            onSubmit={add}
            className="min-h-0 overflow-y-auto"
          >
            <div className="space-y-5 p-5 sm:p-7">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Procedure details
                </h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Enter the SOP information and choose its acknowledgement
                  requirements.
                </p>
              </div>

              <Input
                label="SOP Title"
                required
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Department"
                  value={form.department}
                  options={["HR", "Company"].map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                />

                <Input
                  label="Effective Date"
                  type="date"
                  required
                  value={form.effectiveDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      effectiveDate: event.target.value,
                    })
                  }
                />
              </div>

              <Select
                label="Acknowledgement"
                value={form.acknowledgement}
                options={["Required", "Not Required"].map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(event) =>
                  setForm({
                    ...form,
                    acknowledgement: event.target.value,
                  })
                }
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                    <FileText size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Supporting document
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Attach the SOP document if available. This field is
                      optional.
                    </p>
                  </div>
                </div>

                <FileUpload
                  label="SOP Document (optional)"
                  onFileSelect={setFile}
                  helperText="PDF or Word document."
                />
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-xs leading-5 text-slate-500">
                Fields marked as required must be completed.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                >
                  Cancel
                </Button>

                <Button type="submit">
                  <span className="inline-flex items-center gap-2">
                    <Plus size={16} />
                    Add SOP
                  </span>
                </Button>
              </div>
            </footer>
          </form>
        </SOPModal>
      )}
    </div>
  );
}

export default SOPs;