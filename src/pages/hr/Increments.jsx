import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Search, X } from "lucide-react";
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
  createBonus,
  createIncrement,
  deleteBonus,
  getBonuses,
  getIncrements,
  revertIncrement,
} from "../../services/bonusIncrementService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BONUS_TYPES = ["Performance", "Festival", "Referral", "Joining", "Other"];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// "2026-10" → "October 2026"
const formatMonth = (yyyyMm) => {
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

// "2026-10-01" → "1 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  const [year, month, day] = String(yyyyMmDd).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Local "YYYY-MM" and "YYYY-MM-DD" for defaults / max dates
const pad = (n) => String(n).padStart(2, "0");
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
};
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// Puts backend field errors under the right inputs
function applyServerErrors(error, setError, setEmployeeError) {
  const fieldErrors = getFieldErrors(error);
  if (!fieldErrors) return;
  Object.entries(fieldErrors).forEach(([field, message]) => {
    if (field === "userUuid") setEmployeeError(message);
    else setError(field, { type: "server", message });
  });
}

/**
 * Filter bar shared by both tabs: employee autocomplete + 🔍 button.
 * Calls onSearch(employee | null) only when the button is clicked.
 */
function EmployeeFilterBar({ searchFn, onSearch, applied, resultCount, label }) {
  const [draft, setDraft] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (text.trim() && !draft) {
      setError("Pick a name from the suggestions list.");
      return;
    }
    setError("");
    onSearch(draft);
  };

  const clear = () => {
    setDraft(null);
    setText("");
    setError("");
    if (applied) onSearch(null);
  };

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-2" role="search" aria-label={`Filter ${label}`}>
        <div className="flex items-center gap-2 rounded-full border border-cm-border bg-white px-3 py-2 shadow-sm">
          <EmployeeAutocomplete
            selected={draft}
            onSelect={(employee) => {
              setDraft(employee);
              setError("");
            }}
            onTextChange={setText}
            searchFn={searchFn}
            placeholder="Search employee by name…"
            className="flex-1"
            inputClassName="border-transparent focus:ring-0"
          />
          <button
            type="submit"
            aria-label={`Search ${label}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#000052] text-white hover:bg-[#00003D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000052]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {error && <p className="px-3 text-sm text-cm-danger-600">{error}</p>}
      </form>

      {applied && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-cm-text-muted">
          <span>
            Showing {resultCount} {label} for <strong className="text-cm-text">{applied.fullName}</strong>
          </span>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-full border border-cm-border px-2 py-0.5 text-xs text-cm-text hover:bg-cm-bg"
          >
            <X className="h-3 w-3" aria-hidden="true" /> Clear filter
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Loads a list for the (optional) applied employee. State is only set in
 * the response callbacks; `ignore` drops answers that arrive too late.
 */
function useEmployeeList(fetchFn) {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [applied, setApplied] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetchFn(applied?.uuid)
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
  }, [fetchFn, applied, reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const search = (employee) => {
    setIsLoading(true);
    setApplied(employee);
  };

  return { records, setRecords, isLoading, loadError, applied, reload, search };
}

// ---------------------------------------------------------------------------
// Bonuses tab
// ---------------------------------------------------------------------------

const BONUS_DEFAULTS = () => ({ payPeriod: currentMonth(), bonusType: "Performance", amount: "", reason: "" });

function BonusForm({ onSaved, onCancel }) {
  const [employee, setEmployee] = useState(null);
  const [employeeError, setEmployeeError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: BONUS_DEFAULTS() });

  const onSubmit = async (values) => {
    if (!employee) {
      setEmployeeError("Select an employee from the suggestions");
      return;
    }
    try {
      const record = await createBonus({
        userUuid: employee.uuid,
        payPeriod: values.payPeriod,
        bonusType: values.bonusType,
        amount: Number(values.amount),
        reason: values.reason,
      });
      showToast.success(`Bonus of ${formatMoney(record.amount)} added for ${record.employee.fullName}.`);
      onSaved();
    } catch (error) {
      applyServerErrors(error, setError, setEmployeeError);
      showToast.error(getErrorMessage(error, "Couldn't add bonus."));
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
    >
      <h2 className="text-sm font-semibold text-cm-text md:col-span-3">New Bonus</h2>

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
        label="Pay Month"
        type="month"
        required
        helperText="Auto-fills the Bonus field when payroll is created for this month."
        error={errors.payPeriod?.message}
        {...register("payPeriod", { required: "Month is required" })}
      />

      <Select
        label="Bonus Type"
        required
        options={BONUS_TYPES.map((type) => ({ value: type, label: type }))}
        error={errors.bonusType?.message}
        {...register("bonusType", { required: "Bonus type is required" })}
      />

      <Input
        label="Amount (₹)"
        type="number"
        min="0"
        step="0.01"
        required
        error={errors.amount?.message}
        {...register("amount", {
          required: "Amount is required",
          validate: (value) => Number(value) > 0 || "Amount must be more than 0",
        })}
      />

      <Input
        label="Reason (optional)"
        placeholder="e.g. Q3 target achieved"
        containerClassName="md:col-span-2"
        error={errors.reason?.message}
        {...register("reason", { maxLength: { value: 500, message: "Max 500 characters" } })}
      />

      <div className="flex justify-end gap-3 md:col-span-3">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Add Bonus
        </Button>
      </div>
    </form>
  );
}

function BonusesTab() {
  const list = useEmployeeList(getBonuses);
  const [formKey, setFormKey] = useState(null); // null = closed
  const [confirmUuid, setConfirmUuid] = useState(null);
  const [deletingUuid, setDeletingUuid] = useState(null);

  const handleDelete = async (row) => {
    if (confirmUuid !== row.uuid) {
      setConfirmUuid(row.uuid);
      return;
    }
    setDeletingUuid(row.uuid);
    try {
      await deleteBonus(row.uuid);
      list.setRecords((prev) => prev.filter((record) => record.uuid !== row.uuid));
      showToast.success("Bonus deleted.");
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't delete bonus."));
    } finally {
      setDeletingUuid(null);
      setConfirmUuid(null);
    }
  };

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
    { key: "month", header: "Pay Month", render: (row) => formatMonth(row.payPeriod) },
    { key: "type", header: "Type", render: (row) => <Badge tone="neutral">{row.bonusType}</Badge> },
    {
      key: "amount",
      header: "Amount",
      render: (row) => <span className="font-semibold">{formatMoney(row.amount)}</span>,
    },
    { key: "reason", header: "Reason", render: (row) => row.reason || "—" },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const isConfirming = confirmUuid === row.uuid;
        return (
          <div className="flex justify-end gap-2">
            {isConfirming && deletingUuid !== row.uuid && (
              <Button size="sm" variant="ghost" onClick={() => setConfirmUuid(null)}>
                Keep
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              loading={deletingUuid === row.uuid}
              disabled={deletingUuid !== null && deletingUuid !== row.uuid}
              onClick={() => handleDelete(row)}
            >
              {isConfirming ? "Confirm delete?" : "Delete"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-cm-text-muted">
          One-time bonuses. Locked once that month's payroll is processed.
        </p>
        <Button onClick={() => setFormKey((key) => (key === null ? Date.now() : null))}>
          {formKey === null ? "Add Bonus" : "Close"}
        </Button>
      </div>

      {formKey !== null && (
        <BonusForm
          key={formKey}
          onSaved={() => {
            setFormKey(null);
            list.reload();
          }}
          onCancel={() => setFormKey(null)}
        />
      )}

      <EmployeeFilterBar onSearch={list.search} applied={list.applied} resultCount={list.records.length} label="bonuses" />

      {list.loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load bonuses" description={list.loadError} onRetry={list.reload} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={list.records.map((record) => ({ ...record, id: record.uuid }))}
          isLoading={list.isLoading}
          emptyMessage={list.applied ? "No bonuses for this employee yet." : "No bonuses added yet."}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Increments tab
// ---------------------------------------------------------------------------

function IncrementForm({ onSaved, onCancel }) {
  const [employee, setEmployee] = useState(null);
  const [employeeError, setEmployeeError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { newSalary: "", effectiveDate: today(), reason: "" } });

  const newSalary = Number(useWatch({ control, name: "newSalary" })) || 0;
  const current = employee?.salary ?? null;
  const increase = current !== null && newSalary > 0 ? newSalary - current : null;

  const onSubmit = async (values) => {
    if (!employee) {
      setEmployeeError("Select an employee from the suggestions");
      return;
    }
    try {
      const record = await createIncrement({
        userUuid: employee.uuid,
        newSalary: Number(values.newSalary),
        effectiveDate: values.effectiveDate,
        reason: values.reason,
      });
      showToast.success(
        `${record.employee.fullName}: ${formatMoney(record.previousSalary)} → ${formatMoney(record.newSalary)} (+${record.increasePercent}%).`,
      );
      onSaved();
    } catch (error) {
      applyServerErrors(error, setError, setEmployeeError);
      showToast.error(getErrorMessage(error, "Couldn't apply increment."));
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
    >
      <h2 className="text-sm font-semibold text-cm-text md:col-span-3">New Increment</h2>

      <div className="flex flex-col gap-1">
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
        {employee && (
          <p className={`text-xs ${current === null ? "text-cm-danger-600" : "text-cm-text-muted"}`}>
            {current === null
              ? "No salary set — set it in Payroll → Salary Structure first."
              : `Current salary: ${formatMoney(current)}`}
          </p>
        )}
      </div>

      <Input
        label="New Monthly Salary (₹)"
        type="number"
        min="0"
        step="0.01"
        required
        error={errors.newSalary?.message}
        {...register("newSalary", {
          required: "New salary is required",
          validate: (value) => {
            if (Number(value) <= 0) return "New salary must be more than 0";
            if (current !== null && Number(value) <= current) {
              return `Must be higher than the current salary (${formatMoney(current)})`;
            }
            return true;
          },
        })}
      />

      <Input
        label="Effective Date"
        type="date"
        required
        max={today()}
        error={errors.effectiveDate?.message}
        {...register("effectiveDate", {
          required: "Effective date is required",
          validate: (value) => value <= today() || "Effective date can't be in the future",
        })}
      />

      <Input
        label="Reason (optional)"
        placeholder="e.g. Annual appraisal"
        containerClassName="md:col-span-3"
        error={errors.reason?.message}
        {...register("reason", { maxLength: { value: 500, message: "Max 500 characters" } })}
      />

      {increase !== null && (
        <div className="rounded-lg border border-cm-border p-4 text-sm text-cm-text md:col-span-3">
          {formatMoney(current)} → <strong>{formatMoney(newSalary)}</strong>
          <span className={`ml-2 ${increase > 0 ? "text-green-700" : "text-cm-danger-600"}`}>
            ({increase > 0 ? "+" : ""}
            {formatMoney(increase)}, {increase > 0 ? "+" : ""}
            {((increase / current) * 100).toFixed(2)}%)
          </span>
        </div>
      )}

      <div className="flex justify-end gap-3 md:col-span-3">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={employee !== null && current === null}>
          Apply Increment
        </Button>
      </div>
    </form>
  );
}

function IncrementsTab() {
  const list = useEmployeeList(getIncrements);
  const [formKey, setFormKey] = useState(null); // null = closed
  const [confirmUuid, setConfirmUuid] = useState(null);
  const [revertingUuid, setRevertingUuid] = useState(null);

  const handleRevert = async (row) => {
    if (confirmUuid !== row.uuid) {
      setConfirmUuid(row.uuid);
      return;
    }
    setRevertingUuid(row.uuid);
    try {
      await revertIncrement(row.uuid);
      showToast.success(`Increment reverted — ${row.employee.fullName} back to ${formatMoney(row.previousSalary)}.`);
      list.reload(); // the previous increment (if any) becomes the latest
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't revert increment."));
    } finally {
      setRevertingUuid(null);
      setConfirmUuid(null);
    }
  };

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
    { key: "previous", header: "Previous", render: (row) => formatMoney(row.previousSalary) },
    {
      key: "new",
      header: "New Salary",
      render: (row) => <span className="font-semibold">{formatMoney(row.newSalary)}</span>,
    },
    {
      key: "increase",
      header: "Increase",
      render: (row) => (
        <Badge tone="success">
          +{formatMoney(row.increaseAmount)} (+{row.increasePercent}%)
        </Badge>
      ),
    },
    { key: "effective", header: "Effective", render: (row) => formatDate(row.effectiveDate) },
    { key: "reason", header: "Reason", render: (row) => row.reason || "—" },
    {
      key: "actions",
      header: "",
      render: (row) => {
        // Only the latest increment of each employee can be reverted
        if (!row.isLatest) return null;
        const isConfirming = confirmUuid === row.uuid;
        return (
          <div className="flex justify-end gap-2">
            {isConfirming && revertingUuid !== row.uuid && (
              <Button size="sm" variant="ghost" onClick={() => setConfirmUuid(null)}>
                Keep
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              loading={revertingUuid === row.uuid}
              disabled={revertingUuid !== null && revertingUuid !== row.uuid}
              onClick={() => handleRevert(row)}
            >
              {isConfirming ? "Confirm revert?" : "Revert"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-cm-text-muted">
          Salary raises. Applying one updates Salary Structure immediately.
        </p>
        <Button onClick={() => setFormKey((key) => (key === null ? Date.now() : null))}>
          {formKey === null ? "Give Increment" : "Close"}
        </Button>
      </div>

      {formKey !== null && (
        <IncrementForm
          key={formKey}
          onSaved={() => {
            setFormKey(null);
            list.reload();
          }}
          onCancel={() => setFormKey(null)}
        />
      )}

      <EmployeeFilterBar
        searchFn={searchSalaryEmployees}
        onSearch={list.search}
        applied={list.applied}
        resultCount={list.records.length}
        label="increments"
      />

      {list.loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load increments" description={list.loadError} onRetry={list.reload} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={list.records.map((record) => ({ ...record, id: record.uuid }))}
          isLoading={list.isLoading}
          emptyMessage={list.applied ? "No increments for this employee yet." : "No increments given yet."}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page: tabs
// ---------------------------------------------------------------------------

const TABS = [
  { id: "bonuses", label: "Bonuses" },
  { id: "increments", label: "Increments" },
];

function Increments() {
  const [activeTab, setActiveTab] = useState("bonuses");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Bonuses & Increments</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          One-time bonuses feed into payroll; increments update salary structure.
        </p>
      </div>

      <div role="tablist" aria-label="Bonuses and increments" className="flex gap-1 border-b border-cm-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`bi-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`bi-panel-${tab.id}`}
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
      <div role="tabpanel" id={`bi-panel-${activeTab}`} aria-labelledby={`bi-tab-${activeTab}`}>
        {activeTab === "bonuses" ? <BonusesTab /> : <IncrementsTab />}
      </div>
    </div>
  );
}

export default Increments;