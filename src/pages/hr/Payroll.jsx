import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CalendarDays, Search, X } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/tables/DataTable";
import EmployeeAutocomplete from "../../components/payroll/EmployeeAutocomplete";
import { showToast } from "../../components/common/Toast";
import {
  createPayroll,
  getErrorMessage,
  getFieldErrors,
  getPayroll,
  processPayroll,
} from "../../services/payrollService";

// ---------------------------------------------------------------------------
// Constants + helpers
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = ["Bank Transfer", "UPI", "Cheque", "Cash"];

// This month as "YYYY-MM" in the user's local time
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// "2026-09" → "September 2026"
const formatMonth = (yyyyMm) => {
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

// "2026-08-31" → "31 Aug 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Same paise-based math as the backend, so the preview always matches
const calcNet = (base, lop, bonus) => {
  const paise = (value) => Math.round((Number(value) || 0) * 100);
  return (paise(base) - paise(lop) + paise(bonus)) / 100;
};

// Empty number box → 0 instead of NaN
const toNumber = (value) => (value === "" || value === null ? 0 : Number(value));

const EMPTY_FILTERS = { employee: null, startDate: "", endDate: "" };

const FORM_DEFAULTS = () => ({
  payPeriod: currentMonth(),
  baseSalary: "",
  lopDeduction: 0,
  bonus: 0,
  paymentMethod: "Bank Transfer",
});

// ---------------------------------------------------------------------------
// Create Payroll form
// ---------------------------------------------------------------------------

function CreatePayrollForm({ onCreated, onCancel }) {
  const [employee, setEmployee] = useState(null);
  const [employeeError, setEmployeeError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: FORM_DEFAULTS() });

  // Live values for the net-salary preview (useWatch = React-19-safe version of watch)
  const [baseSalary, lopDeduction, bonus] = useWatch({
    control,
    name: ["baseSalary", "lopDeduction", "bonus"],
  });
  const net = calcNet(baseSalary, lopDeduction, bonus);

  const onSubmit = async (values) => {
    if (!employee) {
      setEmployeeError("Select an employee from the suggestions");
      return;
    }

    try {
      // netSalary is NOT sent — the server calculates it
      const record = await createPayroll({
        userUuid: employee.uuid,
        payPeriod: values.payPeriod,
        baseSalary: toNumber(values.baseSalary),
        lopDeduction: toNumber(values.lopDeduction),
        bonus: toNumber(values.bonus),
        paymentMethod: values.paymentMethod,
      });

      showToast.success(`Payroll created for ${record.employee.fullName} (${formatMonth(record.payPeriod)}).`);
      reset(FORM_DEFAULTS());
      setEmployee(null);
      onCreated(record);
    } catch (error) {
      // Show backend validation errors under the matching fields
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === "userUuid") setEmployeeError(message);
          else setError(field, { type: "server", message });
        });
      }
      showToast.error(getErrorMessage(error, "Couldn't create payroll."));
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
    >
      <EmployeeAutocomplete
        label="Employee"
        required
        selected={employee}
        onSelect={(picked) => {
          setEmployee(picked);
          if (picked) setEmployeeError("");
        }}
        error={employeeError}
        placeholder="Start typing a name…"
      />

      <Input
        label="Month"
        type="month"
        required
        error={errors.payPeriod?.message}
        {...register("payPeriod", { required: "Month is required" })}
      />

      <Input
        label="Base Salary (₹)"
        type="number"
        min="0"
        step="0.01"
        required
        error={errors.baseSalary?.message}
        {...register("baseSalary", {
          required: "Base salary is required",
          validate: (value) => toNumber(value) > 0 || "Base salary must be more than 0",
        })}
      />

      <Input
        label="LOP Deduction (₹)"
        type="number"
        min="0"
        step="0.01"
        error={errors.lopDeduction?.message}
        {...register("lopDeduction", {
          validate: {
            notNegative: (value) => toNumber(value) >= 0 || "Can't be negative",
            withinBase: (value) =>
              toNumber(value) <= toNumber(baseSalary) || "LOP deduction can't be more than the base salary",
          },
        })}
      />

      <Input
        label="Bonus (₹)"
        type="number"
        min="0"
        step="0.01"
        error={errors.bonus?.message}
        {...register("bonus", {
          validate: (value) => toNumber(value) >= 0 || "Can't be negative",
        })}
      />

      <Select
        label="Payment Method"
        required
        options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
        error={errors.paymentMethod?.message}
        {...register("paymentMethod", { required: "Payment method is required" })}
      />

      <div className="rounded-lg border border-cm-border p-4 text-sm text-cm-text md:col-span-3">
        Calculated Net Salary: <strong>{formatMoney(Math.max(0, net))}</strong>
        <span className="ml-2 text-cm-text-muted">(Base − LOP + Bonus)</span>
      </div>

      <div className="flex justify-end gap-3 md:col-span-3">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save Payroll
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function Payroll() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [processingUuid, setProcessingUuid] = useState(null);

  // What's typed in the filter bar right now…
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [employeeText, setEmployeeText] = useState("");
  const [filterError, setFilterError] = useState("");
  // …vs what the table is actually showing (changes only on Search)
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch whenever the applied filters change (or a reload is requested)
  useEffect(() => {
    let ignore = false; // page closed / newer search started → drop this response

    getPayroll({
      userUuid: applied.employee?.uuid,
      startDate: applied.startDate,
      endDate: applied.endDate,
    })
      .then((list) => {
        if (ignore) return;
        setRecords(list);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, "Couldn't load payroll."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [applied, reloadKey]);

  const hasActiveFilters = Boolean(applied.employee || applied.startDate || applied.endDate);

  const runSearch = (event) => {
    event?.preventDefault();

    // Typed a name but never picked one → can't search precisely
    if (employeeText.trim() && !draft.employee) {
      setFilterError("Pick a name from the suggestions list.");
      return;
    }
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      setFilterError("End date can't be before start date.");
      return;
    }

    setFilterError("");
    setIsLoading(true);
    setApplied({ ...draft });
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setEmployeeText("");
    setFilterError("");
    if (hasActiveFilters) {
      setIsLoading(true);
      setApplied(EMPTY_FILTERS);
    }
  };

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const handleCreated = () => {
    setShowForm(false);
    // Re-run the current search so the list stays correct for the active filters
    retry();
  };

  const handleProcess = async (row) => {
    setProcessingUuid(row.uuid);
    try {
      const updated = await processPayroll(row.uuid);
      setRecords((prev) => prev.map((record) => (record.uuid === updated.uuid ? updated : record)));
      showToast.success(`Payroll processed for ${updated.employee.fullName}.`);
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't process payroll."));
    } finally {
      setProcessingUuid(null);
    }
  };

  const columns = [
    { key: "employee", header: "Employee", render: (row) => row.employee?.fullName ?? "—" },
    { key: "month", header: "Month", render: (row) => formatMonth(row.payPeriod) },
    { key: "base", header: "Base Salary", render: (row) => formatMoney(row.baseSalary) },
    { key: "lop", header: "LOP", render: (row) => formatMoney(row.lopDeduction) },
    { key: "bonus", header: "Bonus", render: (row) => formatMoney(row.bonus) },
    {
      key: "net",
      header: "Net Salary",
      render: (row) => <span className="font-semibold">{formatMoney(row.netSalary)}</span>,
    },
    { key: "method", header: "Payment Method", render: (row) => row.paymentMethod },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={row.status === "Processed" ? "success" : "warning"}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "Pending" ? (
          <Button
            size="sm"
            loading={processingUuid === row.uuid}
            disabled={processingUuid !== null && processingUuid !== row.uuid}
            onClick={() => handleProcess(row)}
          >
            Process
          </Button>
        ) : null,
    },
  ];

  // DataTable needs a stable `id` on each row
  const rows = records.map((record) => ({ ...record, id: record.uuid }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Payroll</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Payroll based on attendance and LOP, payment methods and people ledger.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "Create Payroll"}
        </Button>
      </div>

      {showForm && <CreatePayrollForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}

      {/* Filter bar: employee | start date – end date | search */}
      <form onSubmit={runSearch} className="flex flex-col gap-2" role="search" aria-label="Filter payroll">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cm-border bg-white px-3 py-2 shadow-sm lg:flex-nowrap lg:rounded-full">
          <EmployeeAutocomplete
            selected={draft.employee}
            onSelect={(employee) => {
              setDraft((prev) => ({ ...prev, employee }));
              setFilterError("");
            }}
            onTextChange={setEmployeeText}
            placeholder="Search employee by name…"
            className="min-w-[14rem] flex-1"
            inputClassName="border-transparent focus:ring-0"
          />

          <span className="hidden h-6 w-px bg-cm-border lg:block" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-cm-text-muted" aria-hidden="true" />
            <input
              type="date"
              aria-label="Start date"
              value={draft.startDate}
              max={draft.endDate || undefined}
              onChange={(event) => setDraft((prev) => ({ ...prev, startDate: event.target.value }))}
              className="h-10 rounded-cm-md px-2 text-sm text-cm-text focus:outline-none focus:ring-2 focus:ring-cm-blue-500"
            />
            <span className="text-cm-text-muted" aria-hidden="true">
              –
            </span>
            <input
              type="date"
              aria-label="End date"
              value={draft.endDate}
              min={draft.startDate || undefined}
              onChange={(event) => setDraft((prev) => ({ ...prev, endDate: event.target.value }))}
              className="h-10 rounded-cm-md px-2 text-sm text-cm-text focus:outline-none focus:ring-2 focus:ring-cm-blue-500"
            />
          </div>

          <button
            type="submit"
            aria-label="Search payroll"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#000052] text-white hover:bg-[#00003D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000052]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {filterError && <p className="px-3 text-sm text-cm-danger-600">{filterError}</p>}
      </form>

      {/* What the table is currently filtered by */}
      {hasActiveFilters && !isLoading && !loadError && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-cm-text-muted">
          <span>
            Showing {records.length} record{records.length === 1 ? "" : "s"}
            {applied.employee && (
              <>
                {" "}for <strong className="text-cm-text">{applied.employee.fullName}</strong>
              </>
            )}
            {applied.startDate && <> from <strong className="text-cm-text">{formatDate(applied.startDate)}</strong></>}
            {applied.endDate && <> to <strong className="text-cm-text">{formatDate(applied.endDate)}</strong></>}
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-full border border-cm-border px-2 py-0.5 text-xs text-cm-text hover:bg-cm-bg"
          >
            <X className="h-3 w-3" aria-hidden="true" /> Clear filters
          </button>
        </div>
      )}

      {loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load payroll" description={loadError} onRetry={retry} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyMessage={hasActiveFilters ? "No payroll records for these filters." : "No payroll records yet."}
        />
      )}
    </div>
  );
}

export default Payroll;