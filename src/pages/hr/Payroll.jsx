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
  getErrorMessage,
  getFieldErrors,
  getPayroll,
  processPayroll,
} from "../../services/payrollService";
import axios from "axios";

// ---------------------------------------------------------------------------
// Constants + helpers
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = ["Bank Transfer", "UPI", "Cheque", "Cash"];

// This month as "YYYY-MM" in the user's local time
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

// "2026-09" → "September 2026"
const formatMonth = (yyyyMm) => {
  if (!yyyyMm) return "—";

  const [year, month] = yyyyMm.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// "2026-08-31" → "31 Aug 2026"
const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "—";

  const [year, month, day] = yyyyMmDd.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Empty number box → 0 instead of NaN
const toNumber = (value) =>
  value === "" || value === null ? 0 : Number(value);

const EMPTY_FILTERS = {
  employee: null,
  startDate: "",
  endDate: "",
};

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
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState("");
  const [calculation, setCalculation] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: FORM_DEFAULTS(),
  });

  const [baseSalary, lopDeduction, bonus, payPeriod] = useWatch({
    control,
    name: ["baseSalary", "lopDeduction", "bonus", "payPeriod"],
  });

  // -------------------------------------------------------------------------
  // Calculate payroll directly from API
  // -------------------------------------------------------------------------

  const calculatePayroll = async (pickedEmployee, selectedPayPeriod) => {
    if (!pickedEmployee?.uuid) return;

    setIsCalculating(true);
    setCalculationError("");

    try {
      const response = await axios.post("/api/payroll/calculate", {
        userUuid: pickedEmployee.uuid,
        payPeriod: selectedPayPeriod || currentMonth(),
      });

      const data = response.data?.data ?? response.data;

      /*
       * API response structure:
       *
       * data.salary.salary
       * data.calculation.lopDeduction
       * data.calculation.bonus
       * data.calculation.netSalary
       * data.calculation.dailySalary
       * data.calculation.paidUnits
       * data.calculation.lopUnits
       * data.calculation.workingDays
       * data.calculation.breakdown
       */

      const salary = data.salary?.salary ?? 0;
      const calculationData = data.calculation ?? {};

      setCalculation(calculationData);

      // Backend decides the actual pay period.
      setValue(
        "payPeriod",
        data.payPeriod
          ? data.payPeriod.substring(0, 7)
          : selectedPayPeriod || currentMonth(),
        {
          shouldValidate: true,
        },
      );

      // Base salary comes from salary.salary
      setValue("baseSalary", salary, {
        shouldValidate: true,
        shouldDirty: false,
      });

      // LOP comes from calculation.lopDeduction
      setValue("lopDeduction", calculationData.lopDeduction ?? 0, {
        shouldValidate: true,
        shouldDirty: false,
      });

      // Bonus comes from calculation.bonus
      setValue("bonus", calculationData.bonus ?? 0, {
        shouldValidate: true,
        shouldDirty: false,
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Couldn't calculate payroll.";

      setCalculationError(message);
      setCalculation(null);

      showToast.error(message);
    } finally {
      setIsCalculating(false);
    }
  };

  // -------------------------------------------------------------------------
  // Employee selected
  // -------------------------------------------------------------------------

  const handleEmployeeSelect = (picked) => {
    setEmployee(picked);
    setEmployeeError("");
    setCalculationError("");
    setCalculation(null);

    if (!picked) {
      setValue("baseSalary", "");
      setValue("lopDeduction", 0);
      setValue("bonus", 0);
      return;
    }

    // Calculate immediately for selected employee
    calculatePayroll(picked, payPeriod || currentMonth());
  };

  // -------------------------------------------------------------------------
  // Pay period changed
  // -------------------------------------------------------------------------

  const handlePayPeriodChange = (event) => {
    const selectedMonth = event.target.value;

    setValue("payPeriod", selectedMonth, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Recalculate whenever employee + month are available
    if (employee?.uuid && selectedMonth) {
      calculatePayroll(employee, selectedMonth);
    }
  };

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const onSubmit = async (values) => {
    if (!employee) {
      setEmployeeError("Select an employee from the suggestions");
      return;
    }

    try {
      // netSalary is NOT sent.
      // Backend calculates it again when payroll is created.
      const record = await createPayroll({
        userUuid: employee.uuid,
        payPeriod: values.payPeriod,
        baseSalary: toNumber(values.baseSalary),
        lopDeduction: toNumber(values.lopDeduction),
        bonus: toNumber(values.bonus),
        paymentMethod: values.paymentMethod,
      });

      showToast.success(
        `Payroll created for ${record.employee.fullName} (${formatMonth(
          record.payPeriod,
        )}).`,
      );

      reset(FORM_DEFAULTS());
      setEmployee(null);
      setCalculation(null);
      setCalculationError("");

      onCreated(record);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === "userUuid") {
            setEmployeeError(message);
          } else {
            setError(field, {
              type: "server",
              message,
            });
          }
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
      {/* Employee */}
      <div className="flex flex-col gap-1">
        <EmployeeAutocomplete
          label="Employee"
          required
          selected={employee}
          onSelect={handleEmployeeSelect}
          error={employeeError}
          placeholder="Start typing a name…"
        />

        {isCalculating && (
          <p className="text-xs text-cm-text-muted">
            Calculating payroll from salary, attendance and leave records…
          </p>
        )}

        {calculationError && (
          <p className="text-xs text-cm-danger-600">{calculationError}</p>
        )}

        {employee && !isCalculating && !calculationError && (
          <p className="text-xs text-cm-text-muted">
            Salary and LOP calculated from the payroll calculation API.
          </p>
        )}
      </div>

      {/* Pay Period */}
      <Input
        label="Month"
        type="month"
        required
        error={errors.payPeriod?.message}
        {...register("payPeriod", {
          required: "Month is required",
        })}
        onChange={handlePayPeriodChange}
      />

      {/* Base Salary */}
      <Input
        label="Base Salary (₹)"
        type="number"
        min="0"
        step="0.01"
        required
        error={errors.baseSalary?.message}
        {...register("baseSalary", {
          required: "Base salary is required",
          validate: (value) =>
            toNumber(value) > 0 || "Base salary must be more than 0",
        })}
      />

      {/* LOP */}
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
              toNumber(value) <= toNumber(baseSalary) ||
              "LOP deduction can't be more than the base salary",
          },
        })}
      />

      {/* Bonus */}
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

      {/* Payment Method */}
      <Select
        label="Payment Method"
        required
        options={PAYMENT_METHODS.map((method) => ({
          value: method,
          label: method,
        }))}
        error={errors.paymentMethod?.message}
        {...register("paymentMethod", {
          required: "Payment method is required",
        })}
      />

      {/* ------------------------------------------------------------------- */}
      {/* Calculation summary */}
      {/* ------------------------------------------------------------------- */}

      <div className="rounded-lg border border-cm-border p-4 text-sm text-cm-text md:col-span-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Calculated Net Salary</span>

            <strong className="text-lg">
              {formatMoney(
                calculation?.netSalary ??
                  Math.max(
                    0,
                    toNumber(baseSalary) -
                      toNumber(lopDeduction) +
                      toNumber(bonus),
                  ),
              )}
            </strong>
          </div>

          {calculation && (
            <div className="grid grid-cols-2 gap-3 border-t border-cm-border pt-3 text-xs text-cm-text-muted sm:grid-cols-4">
              <div>
                <div>Daily Salary</div>
                <strong className="text-cm-text">
                  {formatMoney(calculation.dailySalary)}
                </strong>
              </div>

              <div>
                <div>Paid Units</div>
                <strong className="text-cm-text">
                  {calculation.paidUnits ?? 0}
                </strong>
              </div>

              <div>
                <div>LOP Units</div>
                <strong className="text-cm-text">
                  {calculation.lopUnits ?? 0}
                </strong>
              </div>

              <div>
                <div>Working Days</div>
                <strong className="text-cm-text">
                  {calculation.workingDays ?? 0}
                </strong>
              </div>
            </div>
          )}

          <span className="text-xs text-cm-text-muted">
            Base Salary − LOP Deduction + Bonus
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 md:col-span-3">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || isCalculating}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button type="submit" loading={isSubmitting} disabled={isCalculating}>
          Save Payroll
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
  const [showForm, setShowForm] = useState(false);
  const [processingUuid, setProcessingUuid] = useState(null);

  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [employeeText, setEmployeeText] = useState("");
  const [filterError, setFilterError] = useState("");

  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

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
        if (!ignore) {
          setLoadError(getErrorMessage(error, "Couldn't load payroll."));
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [applied, reloadKey]);

  const hasActiveFilters = Boolean(
    applied.employee || applied.startDate || applied.endDate,
  );

  const runSearch = (event) => {
    event?.preventDefault();

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
    retry();
  };

  const handleProcess = async (row) => {
    setProcessingUuid(row.uuid);

    try {
      const updated = await processPayroll(row.uuid);

      setRecords((prev) =>
        prev.map((record) => (record.uuid === updated.uuid ? updated : record)),
      );

      showToast.success(`Payroll processed for ${updated.employee.fullName}.`);
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't process payroll."));
    } finally {
      setProcessingUuid(null);
    }
  };

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => row.employee?.fullName ?? "—",
    },
    {
      key: "month",
      header: "Month",
      render: (row) => formatMonth(row.payPeriod),
    },
    {
      key: "base",
      header: "Base Salary",
      render: (row) => formatMoney(row.baseSalary),
    },
    {
      key: "lop",
      header: "LOP",
      render: (row) => formatMoney(row.lopDeduction),
    },
    {
      key: "bonus",
      header: "Bonus",
      render: (row) => formatMoney(row.bonus),
    },
    {
      key: "net",
      header: "Net Salary",
      render: (row) => (
        <span className="font-semibold">{formatMoney(row.netSalary)}</span>
      ),
    },
    {
      key: "method",
      header: "Payment Method",
      render: (row) => row.paymentMethod,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status === "Processed" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
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

  const rows = records.map((record) => ({
    ...record,
    id: record.uuid,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-cm-text-muted">
          Monthly payroll records — create, filter and process.
        </p>

        <Button onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "Create Payroll"}
        </Button>
      </div>

      {showForm && (
        <CreatePayrollForm
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filter bar */}
      <form
        onSubmit={runSearch}
        className="flex flex-col gap-2"
        role="search"
        aria-label="Filter payroll"
      >
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cm-border bg-white px-3 py-2 shadow-sm lg:flex-nowrap lg:rounded-full">
          <EmployeeAutocomplete
            selected={draft.employee}
            onSelect={(employee) => {
              setDraft((prev) => ({
                ...prev,
                employee,
              }));
              setFilterError("");
            }}
            onTextChange={setEmployeeText}
            placeholder="Search employee by name…"
            className="min-w-[14rem] flex-1"
            inputClassName="border-transparent focus:ring-0"
          />

          <span
            className="hidden h-6 w-px bg-cm-border lg:block"
            aria-hidden="true"
          />

          <div className="flex items-center gap-2">
            <CalendarDays
              className="h-4 w-4 shrink-0 text-cm-text-muted"
              aria-hidden="true"
            />

            <input
              type="date"
              aria-label="Start date"
              value={draft.startDate}
              max={draft.endDate || undefined}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  startDate: event.target.value,
                }))
              }
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
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  endDate: event.target.value,
                }))
              }
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

        {filterError && (
          <p className="px-3 text-sm text-cm-danger-600">{filterError}</p>
        )}
      </form>

      {/* Active filters */}
      {hasActiveFilters && !isLoading && !loadError && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-cm-text-muted">
          <span>
            Showing {records.length} record
            {records.length === 1 ? "" : "s"}
            {applied.employee && (
              <>
                {" "}
                for{" "}
                <strong className="text-cm-text">
                  {applied.employee.fullName}
                </strong>
              </>
            )}
            {applied.startDate && (
              <>
                {" "}
                from{" "}
                <strong className="text-cm-text">
                  {formatDate(applied.startDate)}
                </strong>
              </>
            )}
            {applied.endDate && (
              <>
                {" "}
                to{" "}
                <strong className="text-cm-text">
                  {formatDate(applied.endDate)}
                </strong>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-full border border-cm-border px-2 py-0.5 text-xs text-cm-text hover:bg-cm-bg"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear filters
          </button>
        </div>
      )}

      {loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState
            title="Couldn't load payroll"
            description={loadError}
            onRetry={retry}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyMessage={
            hasActiveFilters
              ? "No payroll records for these filters."
              : "No payroll records yet."
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page: tabs
// ---------------------------------------------------------------------------

const TABS = [
  {
    id: "runs",
    label: "Payroll Runs",
  },
  {
    id: "salaries",
    label: "Salary Structure",
  },
];

function Payroll() {
  const [activeTab, setActiveTab] = useState("runs");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Payroll</h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          Payroll based on attendance and LOP, payment methods and people
          ledger.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Payroll sections"
        className="flex gap-1 border-b border-cm-border"
      >
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

      <div
        role="tabpanel"
        id={`payroll-panel-${activeTab}`}
        aria-labelledby={`payroll-tab-${activeTab}`}
      >
        {activeTab === "runs" ? <PayrollRuns /> : <SalaryStructure />}
      </div>
    </div>
  );
}

export default Payroll;
