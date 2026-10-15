import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AlertTriangle, Clock, GraduationCap, UserCheck } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/tables/DataTable";
import EmployeeAutocomplete from "../../components/payroll/EmployeeAutocomplete";
import { showToast } from "../../components/common/Toast";
import { getErrorMessage, getFieldErrors, searchSalaryEmployees } from "../../services/payrollService";
import {
  closePeriod,
  createPeriod,
  extendPeriod,
  getPeriods,
  reviewPeriod,
} from "../../services/internshipProbationService";

// ---------------------------------------------------------------------------
// Constants + helpers
// ---------------------------------------------------------------------------

const PERFORMANCE = ["Pending", "Needs Improvement", "Good", "Excellent"];

// Default length when HR picks a start date (they can change it)
const DEFAULT_MONTHS = { Internship: 6, Probation: 3 };

const PERFORMANCE_TONE = {
  Pending: "neutral",
  "Needs Improvement": "warning",
  Good: "info",
  Excellent: "success",
};

const STATUS_TONE = {
  Active: "info",
  Confirmed: "success",
  Converted: "success",
  Ended: "neutral",
  Terminated: "danger",
};

const STATUS_LABEL = {
  Active: "Active",
  Confirmed: "Confirmed",
  Converted: "Moved to Probation",
  Ended: "Ended",
  Terminated: "Terminated",
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const pad = (n) => String(n).padStart(2, "0");
const toYmd = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const today = () => toYmd(new Date());

// "2026-10-01" → "1 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  const [year, month, day] = String(yyyyMmDd).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// "2026-01-31" + 1 month → "2026-02-28" (clamps to the last day of the month)
const addMonths = (yyyyMmDd, months) => {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  const target = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return toYmd(new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay)));
};

// "YYYY-MM-DD" + n days
const addDays = (yyyyMmDd, days) => {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  return toYmd(new Date(year, month - 1, day + days));
};

// Backend field errors → under the matching inputs
function applyServerErrors(error, setError, setEmployeeError) {
  const fieldErrors = getFieldErrors(error);
  if (!fieldErrors) return;
  Object.entries(fieldErrors).forEach(([field, message]) => {
    if (field === "userUuid" && setEmployeeError) setEmployeeError(message);
    else setError(field, { type: "server", message });
  });
}

// Shared card wrapper for the action forms
function FormCard({ title, subtitle, onSubmit, children }) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
    >
      <div className="md:col-span-3">
        <h2 className="text-sm font-semibold text-cm-text">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-cm-text-muted">{subtitle}</p>}
      </div>
      {children}
    </form>
  );
}

function FormButtons({ onCancel, isSubmitting, label, variant = "primary" }) {
  return (
    <div className="flex justify-end gap-3 md:col-span-3">
      <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant={variant} loading={isSubmitting}>
        {label}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Start Internship / Probation
// ---------------------------------------------------------------------------

function StartForm({ onDone, onCancel }) {
  const [employee, setEmployee] = useState(null);
  const [employeeError, setEmployeeError] = useState("");
  // Once HR types an end date themselves, stop auto-suggesting it
  const [endTouched, setEndTouched] = useState(false);
  const start = today();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      periodType: "Internship",
      startDate: start,
      endDate: addMonths(start, DEFAULT_MONTHS.Internship),
      stipend: "",
      notes: "",
    },
  });

  const periodType = useWatch({ control, name: "periodType" });

  const suggestEnd = (type, startDate) => {
    if (endTouched || !startDate) return;
    setValue("endDate", addMonths(startDate, DEFAULT_MONTHS[type]), { shouldValidate: true });
  };

  const onSubmit = async (values) => {
    if (!employee) {
      setEmployeeError("Select an employee from the suggestions");
      return;
    }
    try {
      const res = await createPeriod({
        userUuid: employee.uuid,
        periodType: values.periodType,
        startDate: values.startDate,
        endDate: values.endDate,
        // Stipend is only for internships; empty box → no stipend
        stipend: values.periodType === "Internship" && values.stipend !== "" ? Number(values.stipend) : null,
        notes: values.notes,
      });
      showToast.success(`${res.message}.`);
      onDone();
    } catch (error) {
      applyServerErrors(error, setError, setEmployeeError);
      showToast.error(getErrorMessage(error, "Couldn't start the period."));
    }
  };

  return (
    <FormCard
      title="Start Internship / Probation"
      subtitle="The employee's employment type is updated automatically."
      onSubmit={handleSubmit(onSubmit)}
    >
      <EmployeeAutocomplete
        label="Employee"
        required
        selected={employee}
        onSelect={(picked) => {
          setEmployee(picked);
          if (picked) setEmployeeError("");
        }}
        searchFn={searchSalaryEmployees}
        error={employeeError}
        placeholder="Start typing a name…"
      />

      <Select
        label="Type"
        required
        options={["Internship", "Probation"].map((type) => ({ value: type, label: type }))}
        error={errors.periodType?.message}
        {...register("periodType", {
          required: "Type is required",
          onChange: (event) => suggestEnd(event.target.value, getValues("startDate")),
        })}
      />

      {periodType === "Internship" ? (
        <Input
          label="Monthly Stipend (₹, optional)"
          type="number"
          min="0"
          step="0.01"
          error={errors.stipend?.message}
          {...register("stipend", {
            validate: (value) => value === "" || Number(value) >= 0 || "Stipend can't be negative",
          })}
        />
      ) : (
        <div className="hidden md:block" />
      )}

      <Input
        label="Start Date"
        type="date"
        required
        error={errors.startDate?.message}
        {...register("startDate", {
          required: "Start date is required",
          onChange: (event) => suggestEnd(getValues("periodType"), event.target.value),
        })}
      />

      <Input
        label="End Date"
        type="date"
        required
        helperText={`Suggested: ${DEFAULT_MONTHS[periodType]} months from start`}
        error={errors.endDate?.message}
        {...register("endDate", {
          required: "End date is required",
          validate: (value) => value > getValues("startDate") || "End date must be after the start date",
          onChange: () => setEndTouched(true),
        })}
      />

      <Input
        label="Notes (optional)"
        placeholder="e.g. Frontend intern, reports to Project Lead"
        error={errors.notes?.message}
        {...register("notes", { maxLength: { value: 1000, message: "Max 1000 characters" } })}
      />

      <FormButtons onCancel={onCancel} isSubmitting={isSubmitting} label="Start" />
    </FormCard>
  );
}

// ---------------------------------------------------------------------------
// Review: performance / notes / stipend
// ---------------------------------------------------------------------------

function ReviewForm({ record, onDone, onCancel }) {
  const isInternship = record.periodType === "Internship";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      performance: record.performance,
      notes: record.notes ?? "",
      stipend: record.stipend ?? "",
    },
  });

  const onSubmit = async (values) => {
    const payload = { performance: values.performance, notes: values.notes };
    // Internship: empty box clears the stipend; probation never sends it
    if (isInternship) payload.stipend = values.stipend === "" ? null : Number(values.stipend);

    try {
      await reviewPeriod(record.uuid, payload);
      showToast.success(`Review saved for ${record.employee.fullName}.`);
      onDone();
    } catch (error) {
      applyServerErrors(error, setError);
      showToast.error(getErrorMessage(error, "Couldn't save review."));
    }
  };

  return (
    <FormCard
      title={`Review — ${record.employee.fullName}`}
      subtitle={`${record.periodType} · ${formatDate(record.startDate)} → ${formatDate(record.endDate)}`}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Select
        label="Performance"
        required
        options={PERFORMANCE.map((value) => ({ value, label: value }))}
        error={errors.performance?.message}
        {...register("performance", { required: "Performance is required" })}
      />

      {isInternship ? (
        <Input
          label="Monthly Stipend (₹)"
          type="number"
          min="0"
          step="0.01"
          helperText="Leave empty for no stipend."
          error={errors.stipend?.message}
          {...register("stipend", {
            validate: (value) => value === "" || Number(value) >= 0 || "Stipend can't be negative",
          })}
        />
      ) : (
        <div className="hidden md:block" />
      )}

      <Input
        label="Notes"
        placeholder="Review notes"
        error={errors.notes?.message}
        {...register("notes", { maxLength: { value: 1000, message: "Max 1000 characters" } })}
      />

      <FormButtons onCancel={onCancel} isSubmitting={isSubmitting} label="Save Review" />
    </FormCard>
  );
}

// ---------------------------------------------------------------------------
// Extend the end date
// ---------------------------------------------------------------------------

function ExtendForm({ record, onDone, onCancel }) {
  const minDate = addDays(record.endDate, 1);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { newEndDate: addMonths(record.endDate, 1), notes: "" } });

  const onSubmit = async (values) => {
    try {
      await extendPeriod(record.uuid, { newEndDate: values.newEndDate, notes: values.notes });
      showToast.success(`${record.employee.fullName}'s ${record.periodType.toLowerCase()} extended to ${formatDate(values.newEndDate)}.`);
      onDone();
    } catch (error) {
      applyServerErrors(error, setError);
      showToast.error(getErrorMessage(error, "Couldn't extend."));
    }
  };

  return (
    <FormCard
      title={`Extend ${record.periodType} — ${record.employee.fullName}`}
      subtitle={`Currently ends ${formatDate(record.endDate)}${record.extensionCount ? ` (extended ${record.extensionCount}× already)` : ""}.`}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <Input
          label="New End Date"
          type="date"
          required
          min={minDate}
          error={errors.newEndDate?.message}
          {...register("newEndDate", {
            required: "New end date is required",
            validate: (value) => value >= minDate || "Must be after the current end date",
          })}
        />
        <div className="flex gap-2">
          {[1, 3].map((months) => (
            <Button
              key={months}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setValue("newEndDate", addMonths(record.endDate, months), { shouldValidate: true })}
            >
              +{months} month{months > 1 ? "s" : ""}
            </Button>
          ))}
        </div>
      </div>

      <Input
        label="Reason (optional)"
        placeholder="e.g. Needs more time on core skills"
        containerClassName="md:col-span-2"
        error={errors.notes?.message}
        {...register("notes", { maxLength: { value: 1000, message: "Max 1000 characters" } })}
      />

      <FormButtons onCancel={onCancel} isSubmitting={isSubmitting} label="Extend" />
    </FormCard>
  );
}

// ---------------------------------------------------------------------------
// Close with an outcome
// ---------------------------------------------------------------------------

function closeOptions(periodType) {
  return periodType === "Internship"
    ? [
        { value: "Confirmed", label: "Hire as Full Time" },
        { value: "Converted", label: "Move to Probation" },
        { value: "Ended", label: "End Internship (not hiring)" },
        { value: "Terminated", label: "Terminate early" },
      ]
    : [
        { value: "Confirmed", label: "Confirm as Full Time" },
        { value: "Terminated", label: "Terminate" },
      ];
}

const OUTCOME_HELP = {
  Confirmed: "The employee becomes Full Time.",
  Converted: "The internship closes and a probation period starts today.",
  Ended: "The employee will be marked as Exited.",
  Terminated: "The employee will be marked as Exited.",
};

function CloseForm({ record, onDone, onCancel }) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { outcome: "Confirmed", probationEndDate: addMonths(today(), DEFAULT_MONTHS.Probation), notes: "" },
  });

  const outcome = useWatch({ control, name: "outcome" });
  const isExit = outcome === "Ended" || outcome === "Terminated";

  const onSubmit = async (values) => {
    const payload = { outcome: values.outcome, notes: values.notes };
    if (values.outcome === "Converted") payload.probationEndDate = values.probationEndDate;

    try {
      const res = await closePeriod(record.uuid, payload);
      showToast.success(`${record.employee.fullName}: ${res.message}.`);
      onDone();
    } catch (error) {
      applyServerErrors(error, setError);
      showToast.error(getErrorMessage(error, "Couldn't close."));
    }
  };

  return (
    <FormCard
      title={`Close ${record.periodType} — ${record.employee.fullName}`}
      subtitle={`${formatDate(record.startDate)} → ${formatDate(record.endDate)} · Performance: ${record.performance}`}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Select
        label="Outcome"
        required
        options={closeOptions(record.periodType)}
        helperText={OUTCOME_HELP[outcome]}
        error={errors.outcome?.message}
        {...register("outcome", { required: "Outcome is required" })}
      />

      {outcome === "Converted" ? (
        <Input
          label="Probation End Date"
          type="date"
          required
          min={addDays(today(), 1)}
          helperText="Probation starts today."
          error={errors.probationEndDate?.message}
          {...register("probationEndDate", {
            required: "Probation end date is required",
            validate: (value) => value > today() || "Must be after today",
          })}
        />
      ) : (
        <div className="hidden md:block" />
      )}

      <Input
        label="Notes (optional)"
        placeholder="e.g. Passed review"
        error={errors.notes?.message}
        {...register("notes", { maxLength: { value: 1000, message: "Max 1000 characters" } })}
      />

      {isExit && (
        <div className="flex items-start gap-2 rounded-lg border border-cm-danger-600/30 bg-cm-danger-100 p-3 text-sm text-cm-danger-600 md:col-span-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          This can't be undone here — {record.employee.fullName} will be marked as Exited.
        </div>
      )}

      <FormButtons
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        label={isExit ? "Close & Mark Exited" : "Close"}
        variant={isExit ? "danger" : "primary"}
      />
    </FormCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    info: "text-cm-blue-700 bg-cm-blue-100",
    warning: "text-cm-warning-600 bg-cm-warning-100",
    danger: "text-cm-danger-600 bg-cm-danger-100",
  };
  return (
    <div className="flex items-center gap-3 rounded-cm-lg border border-cm-border bg-cm-card p-4 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tones[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-bold text-cm-text">{value}</p>
        <p className="text-xs text-cm-text-muted">{label}</p>
      </div>
    </div>
  );
}

// "12 days left" / "Ends today" / "Overdue by 4 days"
function TimeLeft({ record }) {
  if (record.status !== "Active") {
    return <Badge tone={STATUS_TONE[record.status]}>{STATUS_LABEL[record.status]}</Badge>;
  }
  if (record.isOverdue) {
    const days = Math.abs(record.daysLeft);
    return <Badge tone="danger">Overdue by {days} day{days === 1 ? "" : "s"}</Badge>;
  }
  if (record.daysLeft === 0) return <Badge tone="warning">Ends today</Badge>;
  return (
    <Badge tone={record.isDueSoon ? "warning" : "neutral"}>
      {record.daysLeft} day{record.daysLeft === 1 ? "" : "s"} left
    </Badge>
  );
}

const TYPE_FILTERS = ["All", "Internship", "Probation"];
const STATUS_FILTERS = [
  { value: "Active", label: "Active" },
  { value: "Closed", label: "Closed" },
  { value: "All", label: "All" },
];

function InternshipProbation() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Active");
  // Form: null (closed) | { mode: "start" } | { mode: "review"|"extend"|"close", record }
  const [form, setForm] = useState(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let ignore = false; // page closed before the answer arrived → drop it
    getPeriods()
      .then((list) => {
        if (ignore) return;
        setRecords(list);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, "Couldn't load records."));
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
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const openForm = (next) => {
    setForm(next);
    setFormKey((key) => key + 1); // fresh form with the right defaults
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDone = () => {
    setForm(null);
    reload();
  };

  // Dashboard numbers — active periods only
  const summary = useMemo(() => {
    const active = records.filter((record) => record.status === "Active");
    return {
      interns: active.filter((record) => record.periodType === "Internship").length,
      probation: active.filter((record) => record.periodType === "Probation").length,
      dueSoon: active.filter((record) => record.isDueSoon).length,
      overdue: active.filter((record) => record.isOverdue).length,
    };
  }, [records]);

  const visible = useMemo(
    () =>
      records.filter((record) => {
        if (typeFilter !== "All" && record.periodType !== typeFilter) return false;
        if (statusFilter === "Active") return record.status === "Active";
        if (statusFilter === "Closed") return record.status !== "Active";
        return true;
      }),
    [records, typeFilter, statusFilter],
  );

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => (
        <div>
          <div className="font-medium text-cm-text">{row.employee.fullName}</div>
          <div className="text-xs text-cm-text-muted">{row.employee.email}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <Badge tone={row.periodType === "Internship" ? "info" : "warning"}>{row.periodType}</Badge>,
    },
    {
      key: "period",
      header: "Period",
      render: (row) => (
        <div>
          <div className="text-cm-text">
            {formatDate(row.startDate)} → {formatDate(row.endDate)}
          </div>
          {row.extensionCount > 0 && (
            <div className="text-xs text-cm-text-muted">
              Extended {row.extensionCount}× (was {formatDate(row.originalEndDate)})
            </div>
          )}
        </div>
      ),
    },
    { key: "time", header: "Status", render: (row) => <TimeLeft record={row} /> },
    {
      key: "stipend",
      header: "Stipend",
      render: (row) => (row.stipend === null ? "—" : `${formatMoney(row.stipend)}/mo`),
    },
    {
      key: "performance",
      header: "Performance",
      render: (row) => <Badge tone={PERFORMANCE_TONE[row.performance]}>{row.performance}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "Active" ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => openForm({ mode: "review", record: row })}>
              Review
            </Button>
            <Button size="sm" variant="outline" onClick={() => openForm({ mode: "extend", record: row })}>
              Extend
            </Button>
            <Button size="sm" onClick={() => openForm({ mode: "close", record: row })}>
              Close
            </Button>
          </div>
        ) : null,
    },
  ];

  const formProps = { key: formKey, onDone: handleDone, onCancel: () => setForm(null) };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Internship / Probation</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Track internship and probation periods, performance and intern stipend.
          </p>
        </div>
        <Button onClick={() => (form?.mode === "start" ? setForm(null) : openForm({ mode: "start" }))}>
          {form?.mode === "start" ? "Close" : "Start Internship / Probation"}
        </Button>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard icon={GraduationCap} label="Active interns" value={summary.interns} tone="info" />
        <SummaryCard icon={UserCheck} label="On probation" value={summary.probation} tone="info" />
        <SummaryCard icon={Clock} label="Ending in 14 days" value={summary.dueSoon} tone="warning" />
        <SummaryCard icon={AlertTriangle} label="Overdue — action needed" value={summary.overdue} tone="danger" />
      </div>

      {/* Action form (one at a time) */}
      {form?.mode === "start" && <StartForm {...formProps} />}
      {form?.mode === "review" && <ReviewForm record={form.record} {...formProps} />}
      {form?.mode === "extend" && <ExtendForm record={form.record} {...formProps} />}
      {form?.mode === "close" && <CloseForm record={form.record} {...formProps} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by type">
          {TYPE_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={typeFilter === option}
              onClick={() => setTypeFilter(option)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                typeFilter === option
                  ? "border-[#000052] bg-[#000052] text-white"
                  : "border-cm-border bg-cm-card text-cm-text hover:border-[#000052]/30"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {/* Plain <select>: the shared Select is built for forms (uncontrolled) */}
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 w-40 rounded-cm-md border border-cm-border bg-white px-3 text-sm text-cm-text focus:border-cm-blue-500 focus:outline-none focus:ring-2 focus:ring-cm-blue-500"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load records" description={loadError} onRetry={reload} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visible.map((record) => ({ ...record, id: record.uuid }))}
          isLoading={isLoading}
          emptyMessage={
            statusFilter === "Active" ? "No one is on internship or probation right now." : "No records found."
          }
        />
      )}
    </div>
  );
}

export default InternshipProbation;