import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Search, X } from "lucide-react";
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
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-2"
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

      <div className="flex justify-end gap-3 md:col-span-2">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isUpdate ? "Update Salary" : "Save Salary"}
        </Button>
      </div>
    </form>
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