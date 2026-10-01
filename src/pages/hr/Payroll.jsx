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
import SalaryStructure from "../../components/payroll/SalaryStructure";
import { showToast } from "../../components/common/Toast";
import {
  createPayroll,
  deletePayroll,
  getErrorMessage,
  getFieldErrors,
  getPayroll,
  processPayroll,
  updatePayroll,
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
// Create / Edit Payroll form
// ---------------------------------------------------------------------------

/**
 * editing = null → create a new payroll.
 * editing = a payroll row → edit it. Only amounts + payment method can change;
 * employee and month are shown read-only (to change those, delete + re-create).
 * The parent re-mounts this form (key) when switching, so defaults are always right.
 */
function PayrollForm({ editing, onSaved, onCancel }) {
  const isEdit = Boolean(editing);
  const [employee, setEmployee] = useState(null);
  const [employeeError, setEmployeeError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: isEdit
      ? {
          payPeriod: editing.payPeriod,
          baseSalary: editing.baseSalary,
          lopDeduction: editing.lopDeduction,
          bonus: editing.bonus,
          paymentMethod: editing.paymentMethod,
        }
      : FORM_DEFAULTS(),
  });

  // Live values for the net-salary preview (useWatch = React-19-safe version of watch)
  const [baseSalary, lopDeduction, bonus] = useWatch({
    control,
    name: ["baseSalary", "lopDeduction", "bonus"],
  });
  const net = calcNet(baseSalary, lopDeduction, bonus);

  const onSubmit = async (values) => {
    if (!isEdit && !employee) {
      setEmployeeError("Select an employee from the suggestions");
      return;
    }

    // netSalary is NOT sent — the server calculates it
    const amounts = {
      baseSalary: toNumber(values.baseSalary),
      lopDeduction: toNumber(values.lopDeduction),
      bonus: toNumber(values.bonus),
      paymentMethod: values.paymentMethod,
    };

    try {
      const record = isEdit
        ? await updatePayroll(editing.uuid, amounts)
        : await createPayroll({ userUuid: employee.uuid, payPeriod: values.payPeriod, ...amounts });

      showToast.success(
        `Payroll ${isEdit ? "updated" : "created"} for ${record.employee.fullName} (${formatMonth(record.payPeriod)}).`,
      );
      if (!isEdit) {
        reset(FORM_DEFAULTS());
        setEmployee(null);
      }
      onSaved(record, isEdit);
    } catch (error) {
      // Show backend validation errors under the matching fields
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === "userUuid") setEmployeeError(message);
          else setError(field, { type: "server", message });
        });
      }
      showToast.error(getErrorMessage(error, `Couldn't ${isEdit ? "update" : "create"} payroll.`));
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
    >
      <h2 className="text-sm font-semibold text-cm-text md:col-span-3">
        {isEdit ? "Edit Payroll" : "New Payroll"}
      </h2>

      {isEdit ? (
        // Locked in edit mode — plain read-only fields, not part of the form data
        <>
          <Input label="Employee" value={editing.employee?.fullName ?? "—"} readOnly disabled />
          <Input label="Month" value={formatMonth(editing.payPeriod)} readOnly disabled />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <EmployeeAutocomplete
              label="Employee"
              required
              selected={employee}
              onSelect={(picked) => {
                setEmployee(picked);
                if (picked) setEmployeeError("");
                // Auto-fill Base Salary from Salary Structure (HR can still change it)
                if (picked?.salary != null) {
                  setValue("baseSalary", picked.salary, { shouldValidate: true });
                }
              }}
              error={employeeError}
              placeholder="Start typing a name…"
            />
            {employee && (
              <p className="text-xs text-cm-text-muted">
                {employee.salary != null
                  ? `Base salary auto-filled from Salary Structure (${formatMoney(employee.salary)}).`
                  : "No salary set in Salary Structure — enter base salary manually."}
              </p>
            )}
          </div>

          <Input
            label="Month"
            type="month"
            required
            error={errors.payPeriod?.message}
            {...register("payPeriod", { required: "Month is required" })}
          />
        </>
      )}

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
          {isEdit ? "Update Payroll" : "Save Payroll"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Payroll Runs tab
// ---------------------------------------------------------------------------

function PayrollRuns() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  // Form: closed (null), create ({ mode: "create" }) or edit ({ mode: "edit", record })
  const [form, setForm] = useState(null);
  const [formKey, setFormKey] = useState(0);
  // One row action at a time: { uuid, type: "process" | "delete" }
  const [busy, setBusy] = useState(null);
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState(null);

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

  const openForm = (next) => {
    setForm(next);
    setFormKey((key) => key + 1); // fresh form with the right defaults
    setConfirmDeleteUuid(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const replaceRow = (updated) =>
    setRecords((prev) => prev.map((record) => (record.uuid === updated.uuid ? updated : record)));

  const handleSaved = (record, wasEdit) => {
    setForm(null);
    if (wasEdit) {
      replaceRow(record);
    } else {
      // Re-run the current search so the list stays correct for the active filters
      retry();
    }
  };

  const handleProcess = async (row) => {
    setBusy({ uuid: row.uuid, type: "process" });
    try {
      const updated = await processPayroll(row.uuid);
      replaceRow(updated);
      // If this row was open in the edit form, close it — it's locked now
      if (form?.record?.uuid === row.uuid) setForm(null);
      showToast.success(`Payroll processed for ${updated.employee.fullName}.`);
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't process payroll."));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (row) => {
    // First click asks, second click deletes
    if (confirmDeleteUuid !== row.uuid) {
      setConfirmDeleteUuid(row.uuid);
      return;
    }
    setBusy({ uuid: row.uuid, type: "delete" });
    try {
      await deletePayroll(row.uuid);
      setRecords((prev) => prev.filter((record) => record.uuid !== row.uuid));
      if (form?.record?.uuid === row.uuid) setForm(null); // was being edited
      showToast.success(`Payroll deleted for ${row.employee?.fullName ?? "employee"}.`);
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't delete payroll."));
    } finally {
      setBusy(null);
      setConfirmDeleteUuid(null);
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
      render: (row) => {
        // Processed payroll is locked — no actions
        if (row.status !== "Pending") return null;

        const isRowBusy = busy?.uuid === row.uuid;
        const isConfirming = confirmDeleteUuid === row.uuid;

        return (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => openForm({ mode: "edit", record: row })}
            >
              Edit
            </Button>
            {isConfirming && !isRowBusy && (
              <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteUuid(null)}>
                Keep
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              loading={isRowBusy && busy.type === "delete"}
              disabled={busy !== null && !isRowBusy}
              onClick={() => handleDelete(row)}
            >
              {isConfirming ? "Confirm delete?" : "Delete"}
            </Button>
            <Button
              size="sm"
              loading={isRowBusy && busy.type === "process"}
              disabled={busy !== null && !isRowBusy}
              onClick={() => handleProcess(row)}
            >
              Process
            </Button>
          </div>
        );
      },
    },
  ];

  // DataTable needs a stable `id` on each row
  const rows = records.map((record) => ({ ...record, id: record.uuid }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-cm-text-muted">Monthly payroll records — create, filter and process.</p>
        <Button onClick={() => (form ? setForm(null) : openForm({ mode: "create" }))}>
          {form ? "Close" : "Create Payroll"}
        </Button>
      </div>

      {form && (
        <PayrollForm
          key={formKey}
          editing={form.mode === "edit" ? form.record : null}
          onSaved={handleSaved}
          onCancel={() => setForm(null)}
        />
      )}

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

// ---------------------------------------------------------------------------
// Page: tabs
// ---------------------------------------------------------------------------

const TABS = [
  { id: "runs", label: "Payroll Runs" },
  { id: "salaries", label: "Salary Structure" },
];

function Payroll() {
  const [activeTab, setActiveTab] = useState("runs");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Payroll</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Payroll based on attendance and LOP, payment methods and people ledger.
        </p>
      </div>

      <div role="tablist" aria-label="Payroll sections" className="flex gap-1 border-b border-cm-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`payroll-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`payroll-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-[#000052] text-[#000052]"
                : "border-transparent text-cm-text-muted hover:text-cm-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Only the active tab is mounted → it always loads fresh data */}
      <div role="tabpanel" id={`payroll-panel-${activeTab}`} aria-labelledby={`payroll-tab-${activeTab}`}>
        {activeTab === "runs" ? <PayrollRuns /> : <SalaryStructure />}
      </div>
    </div>
  );
}

export default Payroll;