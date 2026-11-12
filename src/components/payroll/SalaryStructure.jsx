import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Search, X, Wallet } from "lucide-react";
import Button from "../common/Button";
import Input from "../common/Input";
import ErrorState from "../common/ErrorState";
import DataTable from "../tables/DataTable";
import EmployeeAutocomplete from "./EmployeeAutocomplete";
import { showToast } from "../common/Toast";
import {
  getErrorMessage,
  getFieldErrors,
  getSalaries,
  searchSalaryEmployees,
  setSalary,
} from "../../services/payrollService";

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// "project_lead" → "Project Lead"
const formatRole = (name = "") =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function SalaryStructureModal({
  title,
  subtitle,
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
        aria-labelledby="salary-structure-modal-title"
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="relative isolate shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0b1833] via-[#122b4d] to-[#1c4168] px-5 py-5 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-1 -top-10 h-36 w-36 rounded-full border border-white/[0.07]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-sm">
                <Wallet size={19} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="salary-structure-modal-title"
                    className="text-lg font-semibold tracking-tight text-white sm:text-xl"
                  >
                    {title}
                  </h2>
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-200">
                    SALARY STRUCTURE
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-300">
                  {subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close salary structure dialog"
              onClick={onClose}
              disabled={dismissDisabled}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={17} />
            </button>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>Payroll operations</span>
            <span className="text-slate-500">/</span>
            <span>Employee monthly salary details</span>
          </div>
        </header>
        <div className="overflow-y-auto bg-white">{children}</div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Set / update salary form
// ---------------------------------------------------------------------------

/**
 * initial = { employee, salary } when opened from a row's "Edit" button,
 * or null for a fresh "Set Salary". The parent re-mounts this form (key)
 * whenever initial changes, so the defaults below are always correct.
 */
function SalaryForm({ initial, onSaved, onCancel }) {
  const [employee, setEmployee] = useState(initial?.employee ?? null);
  const [employeeError, setEmployeeError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { salary: initial?.salary ?? "" } });

  // Picking someone who already has a salary → show it, ready to edit
  const handlePick = (picked) => {
    setEmployee(picked);
    if (picked) setEmployeeError("");
    if (picked?.salary != null) setValue("salary", picked.salary, { shouldValidate: true });
  };

  const isUpdate = employee?.salary != null;

  const onSubmit = async (values) => {
    if (!employee) {
      setEmployeeError("Select an employee from the suggestions");
      return;
    }

    try {
      const res = await setSalary(employee.uuid, Number(values.salary));
      showToast.success(`${res.message} — ${res.data.employee.fullName}.`);
      onSaved(res.data);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === "userUuid") setEmployeeError(message);
          else setError(field, { type: "server", message });
        });
      }
      showToast.error(getErrorMessage(error, "Couldn't save salary."));
    }
  };

  return (
    <SalaryStructureModal
      title={isUpdate ? "Edit Salary Structure" : "Set Salary Structure"}
      subtitle="Select an employee and define their monthly salary."
      onClose={onCancel}
      dismissDisabled={isSubmitting}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 p-5 sm:p-7 md:grid-cols-2"
      >
      <EmployeeAutocomplete
        label="Employee"
        required
        selected={employee}
        onSelect={handlePick}
        searchFn={searchSalaryEmployees}
        error={employeeError}
        placeholder="Start typing a name…"
      />

      <Input
        label="Monthly Salary (₹)"
        type="number"
        min="0"
        step="0.01"
        required
        error={errors.salary?.message}
        {...register("salary", {
          required: "Salary is required",
          validate: (value) => Number(value) > 0 || "Salary must be more than 0",
        })}
      />

      <div className="flex flex-col-reverse gap-3 rounded-xl border-t border-cm-border bg-slate-50 p-4 sm:flex-row sm:justify-end md:col-span-2">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isUpdate ? "Update Salary" : "Save Salary"}
        </Button>
      </div>
      </form>
    </SalaryStructureModal>
  );
}

// ---------------------------------------------------------------------------
// Salary Structure tab
// ---------------------------------------------------------------------------

function SalaryStructure() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Form: closed (null), new ({}), or editing ({ employee, salary })
  const [formState, setFormState] = useState(null);
  const [formKey, setFormKey] = useState(0);

  // Filter bar: draft vs applied (applied changes only on Search)
  const [draftEmployee, setDraftEmployee] = useState(null);
  const [employeeText, setEmployeeText] = useState("");
  const [filterError, setFilterError] = useState("");
  const [appliedEmployee, setAppliedEmployee] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    getSalaries(appliedEmployee?.uuid)
      .then((list) => {
        if (ignore) return;
        setRecords(list);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, "Couldn't load salary structure."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [appliedEmployee, reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const openForm = (initial) => {
    setFormState(initial);
    setFormKey((key) => key + 1); // fresh form with the right defaults
  };

  const handleSaved = () => {
    setFormState(null);
    reload();
  };

  const runSearch = (event) => {
    event.preventDefault();
    if (employeeText.trim() && !draftEmployee) {
      setFilterError("Pick a name from the suggestions list.");
      return;
    }
    setFilterError("");
    setIsLoading(true);
    setAppliedEmployee(draftEmployee);
  };

  const clearFilter = () => {
    setDraftEmployee(null);
    setEmployeeText("");
    setFilterError("");
    if (appliedEmployee) {
      setIsLoading(true);
      setAppliedEmployee(null);
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
    { key: "role", header: "Role", render: (row) => formatRole(row.employee.role) },
    {
      key: "salary",
      header: "Monthly Salary",
      render: (row) => <span className="font-semibold">{formatMoney(row.salary)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            openForm({
              // Same shape the autocomplete returns, incl. salary → "Update" mode
              employee: { ...row.employee, salary: row.salary },
              salary: row.salary,
            })
          }
        >
          Edit
        </Button>
      ),
    },
  ];

  const rows = records.map((record) => ({ ...record, id: record.uuid }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-cm-text-muted">
          Fixed monthly salary per employee. Used to auto-fill Base Salary when creating payroll.
        </p>
        <Button onClick={() => (formState ? setFormState(null) : openForm({}))}>
          {formState ? "Close" : "Set Salary"}
        </Button>
      </div>

      {formState && (
        <SalaryForm
          key={formKey}
          initial={formState.employee ? formState : null}
          onSaved={handleSaved}
          onCancel={() => setFormState(null)}
        />
      )}

      {/* Filter bar: employee | search */}
      <form onSubmit={runSearch} className="flex flex-col gap-2" role="search" aria-label="Filter salary structure">
        <div className="flex items-center gap-2 rounded-full border border-cm-border bg-white px-3 py-2 shadow-sm">
          <EmployeeAutocomplete
            selected={draftEmployee}
            onSelect={(employee) => {
              setDraftEmployee(employee);
              setFilterError("");
            }}
            onTextChange={setEmployeeText}
            searchFn={searchSalaryEmployees}
            placeholder="Search employee by name…"
            className="flex-1"
            inputClassName="border-transparent focus:ring-0"
          />
          <button
            type="submit"
            aria-label="Search salary structure"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#000052] text-white hover:bg-[#00003D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000052]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {filterError && <p className="px-3 text-sm text-cm-danger-600">{filterError}</p>}
      </form>

      {appliedEmployee && !isLoading && !loadError && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-cm-text-muted">
          <span>
            Showing salary for <strong className="text-cm-text">{appliedEmployee.fullName}</strong>
          </span>
          <button
            type="button"
            onClick={clearFilter}
            className="inline-flex items-center gap-1 rounded-full border border-cm-border px-2 py-0.5 text-xs text-cm-text hover:bg-cm-bg"
          >
            <X className="h-3 w-3" aria-hidden="true" /> Clear filter
          </button>
        </div>
      )}

      {loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load salary structure" description={loadError} onRetry={reload} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyMessage={appliedEmployee ? "No salary set for this employee yet." : "No salaries set yet."}
        />
      )}
    </div>
  );
}

export default SalaryStructure;
