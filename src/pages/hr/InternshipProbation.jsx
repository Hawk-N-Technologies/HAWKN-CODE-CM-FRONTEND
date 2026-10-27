
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  AlertTriangle,
  Clock,
  GraduationCap,
  UserCheck,
  CalendarDays,
  CalendarClock,
  Plus,
  RefreshCw,
  ClipboardCheck,
  Search,
  X,
  UserRound,
  CircleDollarSign,
  ArrowRight,
  CheckCircle2,
  FileText,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/tables/DataTable";
import EmployeeAutocomplete from "../../components/payroll/EmployeeAutocomplete";
import { showToast } from "../../components/common/Toast";
import {
  getErrorMessage,
  getFieldErrors,
  searchSalaryEmployees,
} from "../../services/payrollService";
import {
  closePeriod,
  createPeriod,
  extendPeriod,
  getPeriods,
  reviewPeriod,
} from "../../services/internshipProbationService";

// ---------------------------------------------------------------------------
// Constants and helpers
// ---------------------------------------------------------------------------

const PERFORMANCE = [
  "Pending",
  "Needs Improvement",
  "Good",
  "Excellent",
];

const DEFAULT_MONTHS = {
  Internship: 6,
  Probation: 3,
};

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

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const pad = (number) => String(number).padStart(2, "0");

const toYmd = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const today = () => toYmd(new Date());

const formatDate = (value) => {
  if (!value) return "—";

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const addMonths = (value, months) => {
  const [year, month, day] = value.split("-").map(Number);
  const target = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();

  return toYmd(
    new Date(
      target.getFullYear(),
      target.getMonth(),
      Math.min(day, lastDay)
    )
  );
};

const addDays = (value, days) => {
  const [year, month, day] = value.split("-").map(Number);
  return toYmd(new Date(year, month - 1, day + days));
};

function applyServerErrors(error, setError, setEmployeeError) {
  const fieldErrors = getFieldErrors(error);

  if (!fieldErrors) return;

  Object.entries(fieldErrors).forEach(([field, message]) => {
    if (field === "userUuid" && setEmployeeError) {
      setEmployeeError(message);
    } else {
      setError(field, { type: "server", message });
    }
  });
}

// ---------------------------------------------------------------------------
// Shared form components
// ---------------------------------------------------------------------------

function InternshipModal({
  title,
  subtitle,
  icon: Icon,
  badge,
  onClose,
  dismissDisabled = false,
  children,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !dismissDisabled) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismissDisabled, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !dismissDisabled) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="internship-modal-title"
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="relative isolate shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0b1833] via-[#122b4d] to-[#1c4168] px-5 py-5 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-1 -top-10 h-36 w-36 rounded-full border border-white/[0.07]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-sm">
                <Icon size={19} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="internship-modal-title"
                    className="text-lg font-semibold tracking-tight text-white sm:text-xl"
                  >
                    {title}
                  </h2>
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-200">
                    {badge}
                  </span>
                </div>
                {subtitle && (
                  <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-300">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={dismissDisabled}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={17} />
            </button>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>Internship and probation operations</span>
            <span className="text-slate-500">/</span>
            <span>Employee period and performance details</span>
          </div>
        </header>
        <div className="overflow-y-auto bg-white">{children}</div>
      </section>
    </div>
  );
}

function FormButtons({
  onCancel,
  isSubmitting,
  label,
  variant = "primary",
}) {
  return (
    <div className="flex flex-col-reverse gap-3 rounded-xl border-t border-cm-border bg-slate-50 p-4 sm:flex-row sm:justify-end md:col-span-3">
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting}
        onClick={onCancel}
      >
        Cancel
      </Button>

      <Button type="submit" variant={variant} loading={isSubmitting}>
        {label}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Start internship or probation
// ---------------------------------------------------------------------------

function StartForm({ onDone, onCancel }) {
  const [employee, setEmployee] = useState(null);
  const [employeeError, setEmployeeError] = useState("");
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

    setValue("endDate", addMonths(startDate, DEFAULT_MONTHS[type]), {
      shouldValidate: true,
    });
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
        stipend:
          values.periodType === "Internship" && values.stipend !== ""
            ? Number(values.stipend)
            : null,
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
    <InternshipModal
      title="Start Internship / Probation"
      subtitle="Select an employee and define the employment period."
      icon={Plus}
      badge="NEW PERIOD"
      onClose={onCancel}
      dismissDisabled={isSubmitting}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-3"
      >
      <div className="md:col-span-3">
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
          placeholder="Search employee by name..."
        />
      </div>

      <Select
        label="Employment Period"
        required
        options={["Internship", "Probation"].map((type) => ({
          value: type,
          label: type,
        }))}
        error={errors.periodType?.message}
        {...register("periodType", {
          required: "Type is required",
          onChange: (event) =>
            suggestEnd(event.target.value, getValues("startDate")),
        })}
      />

      {periodType === "Internship" ? (
        <Input
          label="Monthly Stipend (₹)"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 12000"
          error={errors.stipend?.message}
          {...register("stipend", {
            validate: (value) =>
              value === "" ||
              Number(value) >= 0 ||
              "Stipend can't be negative",
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
          onChange: (event) =>
            suggestEnd(getValues("periodType"), event.target.value),
        })}
      />

      <Input
        label="End Date"
        type="date"
        required
        helperText={`Suggested duration: ${DEFAULT_MONTHS[periodType]} months`}
        error={errors.endDate?.message}
        {...register("endDate", {
          required: "End date is required",
          validate: (value) =>
            value > getValues("startDate") ||
            "End date must be after the start date",
          onChange: () => setEndTouched(true),
        })}
      />

      <div className="md:col-span-2">
        <Input
          label="Notes (optional)"
          placeholder="Role, reporting manager, or other details"
          error={errors.notes?.message}
          {...register("notes", {
            maxLength: {
              value: 1000,
              message: "Max 1000 characters",
            },
          })}
        />
      </div>

      <FormButtons
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        label="Start Period"
      />
      </form>
    </InternshipModal>
  );
}

// ---------------------------------------------------------------------------
// Performance review
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
    const payload = {
      performance: values.performance,
      notes: values.notes,
    };

    if (isInternship) {
      payload.stipend =
        values.stipend === "" ? null : Number(values.stipend);
    }

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
    <InternshipModal
      title={`Performance Review: ${record.employee.fullName}`}
      subtitle={`${record.periodType} · ${formatDate(record.startDate)} to ${formatDate(record.endDate)}`}
      icon={ClipboardCheck}
      badge="PERFORMANCE REVIEW"
      onClose={onCancel}
      dismissDisabled={isSubmitting}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-3"
      >
      <Select
        label="Performance Rating"
        required
        options={PERFORMANCE.map((value) => ({
          value,
          label: value,
        }))}
        error={errors.performance?.message}
        {...register("performance", {
          required: "Performance is required",
        })}
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
            validate: (value) =>
              value === "" ||
              Number(value) >= 0 ||
              "Stipend can't be negative",
          })}
        />
      ) : (
        <div className="hidden md:block" />
      )}

      <Input
        label="Review Notes"
        placeholder="Summarize progress and areas to improve"
        error={errors.notes?.message}
        {...register("notes", {
          maxLength: {
            value: 1000,
            message: "Max 1000 characters",
          },
        })}
      />

      <FormButtons
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        label="Save Review"
      />
      </form>
    </InternshipModal>
  );
}

// ---------------------------------------------------------------------------
// Extend period
// ---------------------------------------------------------------------------

function ExtendForm({ record, onDone, onCancel }) {
  const minDate = addDays(record.endDate, 1);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      newEndDate: addMonths(record.endDate, 1),
      notes: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      await extendPeriod(record.uuid, {
        newEndDate: values.newEndDate,
        notes: values.notes,
      });

      showToast.success(
        `${record.employee.fullName}'s ${record.periodType.toLowerCase()} extended to ${formatDate(values.newEndDate)}.`
      );

      onDone();
    } catch (error) {
      applyServerErrors(error, setError);
      showToast.error(getErrorMessage(error, "Couldn't extend."));
    }
  };

  return (
    <InternshipModal
      title={`Extend ${record.periodType}: ${record.employee.fullName}`}
      subtitle={`Current end date: ${formatDate(record.endDate)}${record.extensionCount ? ` · Extended ${record.extensionCount} time(s)` : ""}`}
      icon={CalendarClock}
      badge="PERIOD EXTENSION"
      onClose={onCancel}
      dismissDisabled={isSubmitting}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-3"
      >
      <div className="flex flex-col gap-3">
        <Input
          label="New End Date"
          type="date"
          required
          min={minDate}
          error={errors.newEndDate?.message}
          {...register("newEndDate", {
            required: "New end date is required",
            validate: (value) =>
              value >= minDate ||
              "Must be after the current end date",
          })}
        />

        <div className="flex flex-wrap gap-2">
          {[1, 3].map((months) => (
            <Button
              key={months}
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setValue(
                  "newEndDate",
                  addMonths(record.endDate, months),
                  { shouldValidate: true }
                )
              }
            >
              +{months} month{months > 1 ? "s" : ""}
            </Button>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <Input
          label="Reason for Extension (optional)"
          placeholder="Explain why additional time is required"
          error={errors.notes?.message}
          {...register("notes", {
            maxLength: {
              value: 1000,
              message: "Max 1000 characters",
            },
          })}
        />
      </div>

      <FormButtons
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        label="Extend Period"
      />
      </form>
    </InternshipModal>
  );
}

// ---------------------------------------------------------------------------
// Close period with outcome
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
    defaultValues: {
      outcome: "Confirmed",
      probationEndDate: addMonths(today(), DEFAULT_MONTHS.Probation),
      notes: "",
    },
  });

  const outcome = useWatch({ control, name: "outcome" });
  const isExit = outcome === "Ended" || outcome === "Terminated";

  const onSubmit = async (values) => {
    const payload = {
      outcome: values.outcome,
      notes: values.notes,
    };

    if (values.outcome === "Converted") {
      payload.probationEndDate = values.probationEndDate;
    }

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
    <InternshipModal
      title={`Close ${record.periodType}: ${record.employee.fullName}`}
      subtitle={`${formatDate(record.startDate)} to ${formatDate(record.endDate)} · Performance: ${record.performance}`}
      icon={CheckCircle2}
      badge="PERIOD CLOSURE"
      onClose={onCancel}
      dismissDisabled={isSubmitting}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-3"
      >
      <Select
        label="Outcome"
        required
        options={closeOptions(record.periodType)}
        helperText={OUTCOME_HELP[outcome]}
        error={errors.outcome?.message}
        {...register("outcome", {
          required: "Outcome is required",
        })}
      />

      {outcome === "Converted" ? (
        <Input
          label="Probation End Date"
          type="date"
          required
          min={addDays(today(), 1)}
          helperText="The probation period starts today."
          error={errors.probationEndDate?.message}
          {...register("probationEndDate", {
            required: "Probation end date is required",
            validate: (value) =>
              value > today() || "Must be after today",
          })}
        />
      ) : (
        <div className="hidden md:block" />
      )}

      <Input
        label="Closure Notes (optional)"
        placeholder="Record the reason or outcome"
        error={errors.notes?.message}
        {...register("notes", {
          maxLength: {
            value: 1000,
            message: "Max 1000 characters",
          },
        })}
      />

      {isExit && (
        <div className="flex items-start gap-3 rounded-xl border border-cm-danger-600/30 bg-cm-danger-100 p-4 text-sm text-cm-danger-600 md:col-span-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Employee exit warning</p>
            <p className="mt-1 leading-5">
              This action marks {record.employee.fullName} as Exited. Verify
              the selected outcome before submitting.
            </p>
          </div>
        </div>
      )}

      <FormButtons
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        label={isExit ? "Close and Mark Exited" : "Confirm Outcome"}
        variant={isExit ? "danger" : "primary"}
      />
      </form>
    </InternshipModal>
  );
}

// ---------------------------------------------------------------------------
// Dashboard components
// ---------------------------------------------------------------------------

function SummaryCard({ icon: Icon, label, value, tone, description }) {
  const tones = {
    info: "bg-cm-blue-100 text-cm-blue-700",
    warning: "bg-cm-warning-100 text-cm-warning-600",
    danger: "bg-cm-danger-100 text-cm-danger-600",
    success: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-cm-text-muted">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-cm-text">
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs leading-5 text-cm-text-muted">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.info}`}
        >
          <Icon size={21} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function TimeLeft({ record }) {
  if (record.status !== "Active") {
    return (
      <Badge tone={STATUS_TONE[record.status] || "neutral"}>
        {STATUS_LABEL[record.status] || record.status}
      </Badge>
    );
  }

  if (record.isOverdue) {
    const days = Math.abs(record.daysLeft);

    return (
      <Badge tone="danger">
        Overdue by {days} day{days === 1 ? "" : "s"}
      </Badge>
    );
  }

  if (record.daysLeft === 0) {
    return <Badge tone="warning">Ends today</Badge>;
  }

  return (
    <Badge tone={record.isDueSoon ? "warning" : "neutral"}>
      {record.daysLeft} day{record.daysLeft === 1 ? "" : "s"} left
    </Badge>
  );
}

const TYPE_FILTERS = ["All", "Internship", "Probation"];

const STATUS_FILTERS = [
  { value: "Active", label: "Active periods" },
  { value: "Closed", label: "Closed periods" },
  { value: "All", label: "All records" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function InternshipProbation() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    getPeriods()
      .then((list) => {
        if (ignore) return;

        setRecords(list);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(
            getErrorMessage(error, "Couldn't load records.")
          );
        }
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
    setFormKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDone = () => {
    setForm(null);
    reload();
  };

  const summary = useMemo(() => {
    const active = records.filter(
      (record) => record.status === "Active"
    );

    return {
      interns: active.filter(
        (record) => record.periodType === "Internship"
      ).length,
      probation: active.filter(
        (record) => record.periodType === "Probation"
      ).length,
      dueSoon: active.filter((record) => record.isDueSoon).length,
      overdue: active.filter((record) => record.isOverdue).length,
      totalActive: active.length,
      closed: records.filter(
        (record) => record.status !== "Active"
      ).length,
    };
  }, [records]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (
        typeFilter !== "All" &&
        record.periodType !== typeFilter
      ) {
        return false;
      }

      if (statusFilter === "Active" && record.status !== "Active") {
        return false;
      }

      if (
        statusFilter === "Closed" &&
        record.status === "Active"
      ) {
        return false;
      }

      if (!query) return true;

      const searchable = [
        record.employee?.fullName,
        record.employee?.email,
        record.periodType,
        record.performance,
        record.status,
        STATUS_LABEL[record.status],
        record.startDate,
        record.endDate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [records, typeFilter, statusFilter, search]);

  const columns = [
    {
      key: "employee",
      header: "EMPLOYEE",
      render: (row) => (
        <div className="flex min-w-[190px] items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-bg text-cm-text-muted">
            <UserRound size={19} />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-cm-text">
              {row.employee.fullName}
            </p>
            <p className="mt-1 max-w-[220px] truncate text-xs text-cm-text-muted">
              {row.employee.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "PERIOD TYPE",
      render: (row) => (
        <Badge
          tone={row.periodType === "Internship" ? "info" : "warning"}
        >
          {row.periodType}
        </Badge>
      ),
    },
    {
      key: "period",
      header: "EMPLOYMENT PERIOD",
      render: (row) => (
        <div className="min-w-[180px]">
          <div className="flex items-center gap-2 text-sm text-cm-text">
            <CalendarDays
              size={15}
              className="shrink-0 text-cm-text-muted"
            />
            <span>
              {formatDate(row.startDate)} to {formatDate(row.endDate)}
            </span>
          </div>

          {row.extensionCount > 0 && (
            <p className="mt-1.5 text-xs text-cm-text-muted">
              Extended {row.extensionCount} time(s)
              {row.originalEndDate
                ? ` · Original end: ${formatDate(row.originalEndDate)}`
                : ""}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "time",
      header: "DEADLINE",
      render: (row) => <TimeLeft record={row} />,
    },
    {
      key: "stipend",
      header: "MONTHLY STIPEND",
      render: (row) => (
        <div className="min-w-[110px]">
          {row.stipend == null ? (
            <span className="text-sm text-cm-text-muted">Not set</span>
          ) : (
            <>
              <p className="font-semibold text-cm-text">
                {formatMoney(row.stipend)}
              </p>
              <p className="mt-0.5 text-xs text-cm-text-muted">per month</p>
            </>
          )}
        </div>
      ),
    },
    {
      key: "performance",
      header: "PERFORMANCE",
      render: (row) => (
        <Badge
          tone={PERFORMANCE_TONE[row.performance] || "neutral"}
        >
          {row.performance || "Pending"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      render: (row) =>
        row.status === "Active" ? (
          <div className="flex min-w-[230px] flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openForm({ mode: "review", record: row })
              }
            >
              Review
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openForm({ mode: "extend", record: row })
              }
            >
              Extend
            </Button>

            <Button
              size="sm"
              onClick={() =>
                openForm({ mode: "close", record: row })
              }
            >
              Close
            </Button>
          </div>
        ) : (
          <span className="text-xs text-cm-text-muted">
            No actions available
          </span>
        ),
    },
  ];

  const formProps = {
    key: formKey,
    onDone: handleDone,
    onCancel: () => setForm(null),
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-card text-cm-text shadow-sm">
            <GraduationCap size={24} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-cm-text">
                Internship & Probation
              </h1>

              <Badge tone="neutral">HR Management</Badge>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-cm-text-muted">
              Manage employment periods, performance reviews, stipends,
              extensions, and confirmation outcomes.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={reload}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw
                size={15}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </span>
          </Button>

          <Button
            onClick={() =>
              form?.mode === "start"
                ? setForm(null)
                : openForm({ mode: "start" })
            }
          >
            <span className="inline-flex items-center gap-2">
              {form?.mode === "start" ? (
                <X size={16} />
              ) : (
                <Plus size={16} />
              )}
              {form?.mode === "start"
                ? "Close Form"
                : "Start Period"}
            </span>
          </Button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={GraduationCap}
          label="Active Interns"
          value={summary.interns}
          tone="info"
          description="Currently in an internship"
        />

        <SummaryCard
          icon={UserCheck}
          label="On Probation"
          value={summary.probation}
          tone="success"
          description="Currently in a probation period"
        />

        <SummaryCard
          icon={Clock}
          label="Ending in 14 Days"
          value={summary.dueSoon}
          tone="warning"
          description="Periods requiring an upcoming review"
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Overdue Periods"
          value={summary.overdue}
          tone="danger"
          description="Active periods past their end date"
        />
      </div>

      {/* PERIOD COUNTS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-cm-lg border border-cm-border bg-cm-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cm-bg text-cm-text-muted">
            <UserCheck size={19} />
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">All Active Periods</p>
            <p className="mt-1 text-xl font-bold text-cm-text">
              {summary.totalActive}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-cm-lg border border-cm-border bg-cm-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cm-bg text-cm-text-muted">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Closed Records</p>
            <p className="mt-1 text-xl font-bold text-cm-text">
              {summary.closed}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-cm-lg border border-cm-border bg-cm-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cm-bg text-cm-text-muted">
            <CircleDollarSign size={19} />
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">
              Active Internship Stipends
            </p>
            <p className="mt-1 text-xl font-bold text-cm-text">
              {records
                .filter(
                  (record) =>
                    record.status === "Active" &&
                    record.periodType === "Internship" &&
                    record.stipend != null
                )
                .length}
            </p>
            <p className="mt-1 text-xs text-cm-text-muted">
              Intern records with a stipend set
            </p>
          </div>
        </div>
      </div>

      {/* ACTION FORM */}
      {form?.mode === "start" && (
        <StartForm {...formProps} />
      )}

      {form?.mode === "review" && (
        <ReviewForm record={form.record} {...formProps} />
      )}

      {form?.mode === "extend" && (
        <ExtendForm record={form.record} {...formProps} />
      )}

      {form?.mode === "close" && (
        <CloseForm record={form.record} {...formProps} />
      )}

      {/* RECORDS PANEL */}
      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-cm-border p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-cm-text">
                Employment Periods
              </h2>

              <Badge tone="neutral">{visible.length} Records</Badge>
            </div>

            <p className="mt-1 text-sm text-cm-text-muted">
              Review deadlines, employee performance, and current period status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{summary.totalActive} Active</Badge>
            <Badge tone="neutral">{summary.closed} Closed</Badge>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col gap-4 border-b border-cm-border px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filter by period type"
            >
              {TYPE_FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === option}
                  onClick={() => setTypeFilter(option)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                    typeFilter === option
                      ? "border-[#000052] bg-[#000052] text-white"
                      : "border-cm-border bg-cm-card text-cm-text hover:bg-cm-bg"
                  }`}
                >
                  {option === "All" ? "All Types" : option}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cm-text-muted"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee or period..."
                aria-label="Search internship and probation records"
                className="h-10 w-full rounded-lg border border-cm-border bg-cm-bg pl-9 pr-9 text-sm text-cm-text outline-none transition focus:border-cm-blue-500 focus:ring-2 focus:ring-cm-blue-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cm-text-muted hover:text-cm-text"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor="period-status-filter"
              className="text-xs font-medium text-cm-text-muted"
            >
              Employment status
            </label>

            <select
              id="period-status-filter"
              aria-label="Filter by employment status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-cm-border bg-cm-card px-3 text-sm text-cm-text outline-none focus:border-cm-blue-500 focus:ring-2 focus:ring-cm-blue-500/10 sm:w-48"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-cm-text-muted">
            <span>
              Showing{" "}
              <strong className="text-cm-text">{visible.length}</strong> of{" "}
              <strong className="text-cm-text">{records.length}</strong>{" "}
              records
            </span>

            {(search || typeFilter !== "All" || statusFilter !== "Active") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("All");
                  setStatusFilter("Active");
                }}
                className="inline-flex items-center gap-1 font-medium text-cm-text underline underline-offset-2"
              >
                <X size={13} />
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* TABLE / STATES */}
        <div className="p-4 sm:p-6">
          {loadError ? (
            <div className="rounded-xl border border-cm-border p-4">
              <ErrorState
                title="Couldn't load records"
                description={loadError}
                onRetry={reload}
              />
            </div>
          ) : isLoading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
              <RefreshCw
                size={23}
                className="animate-spin text-cm-text-muted"
              />
              <p className="text-sm text-cm-text-muted">
                Loading employment periods...
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cm-bg text-cm-text-muted">
                {search ? <Search size={25} /> : <FileText size={25} />}
              </div>

              <h3 className="mt-4 font-semibold text-cm-text">
                {search
                  ? "No matching records"
                  : statusFilter === "Active"
                    ? "No active internship or probation periods"
                    : "No employment records found"}
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-cm-text-muted">
                {search
                  ? "Try a different employee name, email, period type, or performance rating."
                  : statusFilter === "Active"
                    ? "There are no active periods for the selected filters."
                    : "No records match the selected period and status filters."}
              </p>

              {search || typeFilter !== "All" || statusFilter !== "Active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("All");
                    setStatusFilter("Active");
                  }}
                >
                  Reset Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => openForm({ mode: "start" })}
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus size={15} />
                    Start First Period
                  </span>
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={visible.map((record) => ({
                ...record,
                id: record.uuid,
              }))}
              isLoading={isLoading}
              emptyMessage="No records found."
            />
          )}
        </div>

        {!isLoading && !loadError && records.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-cm-border bg-cm-bg/50 px-5 py-3 text-xs text-cm-text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              {visible.length} matching{" "}
              {visible.length === 1 ? "record" : "records"}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              Data loaded from the internship/probation service
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

export default InternshipProbation;
