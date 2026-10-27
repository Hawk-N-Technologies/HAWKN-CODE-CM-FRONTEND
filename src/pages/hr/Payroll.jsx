import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  CalendarDays,
  Search,
  X,
  Wallet,
  Users,
  Clock3,
  CheckCircle2,
  Plus,
  ArrowRight,
  Calculator,
  CreditCard,
} from "lucide-react";
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

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatMonth = (yyyyMm) => {
  if (!yyyyMm) return "—";
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "—";
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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
// Reusable UI
// ---------------------------------------------------------------------------

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    navy: "bg-slate-900 text-white",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            tone === "navy"
              ? tones.navy
              : `ring-1 ${tones[tone] || tones.blue}`
          }`}
        >
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function PayrollModal({ title, description, onClose, children }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
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
        aria-labelledby="payroll-modal-title"
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
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
                  <h2 id="payroll-modal-title" className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {title}
                  </h2>
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-200">
                    Payroll
                  </span>
                </div>
                {description && (
                  <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-300">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
            >
              <X size={17} />
            </button>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>Payroll operations</span>
            <span className="text-slate-500">/</span>
            <span>Employee salary and payment details</span>
          </div>
        </header>
        <div className="overflow-y-auto p-5 sm:p-7">{children}</div>
      </section>
    </div>
  );
}

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
  } = useForm({ defaultValues: FORM_DEFAULTS() });

  const [baseSalary, lopDeduction, bonus, payPeriod] = useWatch({
    control,
    name: ["baseSalary", "lopDeduction", "bonus", "payPeriod"],
  });

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
      const salary = data.salary?.salary ?? 0;
      const calculationData = data.calculation ?? {};

      setCalculation(calculationData);

      setValue(
        "payPeriod",
        data.payPeriod
          ? data.payPeriod.substring(0, 7)
          : selectedPayPeriod || currentMonth(),
        { shouldValidate: true },
      );

      setValue("baseSalary", salary, {
        shouldValidate: true,
        shouldDirty: false,
      });

      setValue("lopDeduction", calculationData.lopDeduction ?? 0, {
        shouldValidate: true,
        shouldDirty: false,
      });

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

    calculatePayroll(picked, payPeriod || currentMonth());
  };

  const handlePayPeriodChange = (event) => {
    const selectedMonth = event.target.value;

    setValue("payPeriod", selectedMonth, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (employee?.uuid && selectedMonth) {
      calculatePayroll(employee, selectedMonth);
    }
  };

  const onSubmit = async (values) => {
    if (!employee) {
      setEmployeeError("Select an employee from the suggestions");
      return;
    }

    try {
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
            setError(field, { type: "server", message });
          }
        });
      }

      showToast.error(getErrorMessage(error, "Couldn't create payroll."));
    }
  };

  const netSalary = calculation?.netSalary ??
    Math.max(
      0,
      toNumber(baseSalary) - toNumber(lopDeduction) + toNumber(bonus),
    );

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-2">
          <EmployeeAutocomplete
            label="Employee"
            required
            selected={employee}
            onSelect={handleEmployeeSelect}
            error={employeeError}
            placeholder="Start typing a name..."
          />
          {isCalculating && (
            <p className="text-xs text-blue-700">
              Calculating from salary, attendance and leave records...
            </p>
          )}
          {calculationError && (
            <p className="text-xs text-rose-600">{calculationError}</p>
          )}
          {employee && !isCalculating && !calculationError && (
            <p className="text-xs text-slate-500">
              Salary values are populated from the calculation API.
            </p>
          )}
        </div>

        <Input
          label="Pay Month"
          type="month"
          required
          error={errors.payPeriod?.message}
          {...register("payPeriod", {
            required: "Month is required",
          })}
          onChange={handlePayPeriodChange}
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
            validate: (value) =>
              toNumber(value) > 0 || "Base salary must be more than 0",
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
              notNegative: (value) =>
                toNumber(value) >= 0 || "Can't be negative",
              withinBase: (value) =>
                toNumber(value) <= toNumber(baseSalary) ||
                "LOP deduction can't exceed the base salary",
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
            validate: (value) =>
              toNumber(value) >= 0 || "Can't be negative",
          })}
        />

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
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Calculator size={19} />
            </span>
            <div>
              <h3 className="font-semibold text-slate-900">
                Salary calculation
              </h3>
              <p className="text-xs text-slate-500">
                Review the calculated payroll breakdown.
              </p>
            </div>
          </div>
          {isCalculating && (
            <Badge tone="info">Calculating...</Badge>
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-slate-500">Net salary payable</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                {formatMoney(netSalary)}
              </p>
            </div>
            <Badge tone="success">Estimated amount</Badge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Base salary",
                value: formatMoney(baseSalary),
              },
              {
                label: "LOP deduction",
                value: formatMoney(lopDeduction),
              },
              {
                label: "Bonus",
                value: formatMoney(bonus),
              },
              {
                label: "Daily salary",
                value: formatMoney(calculation?.dailySalary),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {calculation && (
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4">
              {[
                ["Paid units", calculation.paidUnits ?? 0],
                ["LOP units", calculation.lopUnits ?? 0],
                ["Working days", calculation.workingDays ?? 0],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Base salary − LOP deduction + bonus. The backend recalculates
            net salary when the payroll record is created.
          </p>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || isCalculating}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isCalculating}>
          <span className="inline-flex items-center gap-2">
            <Plus size={16} />
            Save Payroll
          </span>
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

  const summary = {
    total: records.length,
    processed: records.filter((record) => record.status === "Processed").length,
    pending: records.filter((record) => record.status === "Pending").length,
    net: records.reduce(
      (sum, record) => sum + Number(record.netSalary || 0),
      0,
    ),
  };

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
        prev.map((record) =>
          record.uuid === updated.uuid ? updated : record,
        ),
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
      render: (row) => (
        <div className="min-w-[140px]">
          <p className="font-semibold text-slate-800">
            {row.employee?.fullName ?? "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {row.employee?.email ?? ""}
          </p>
        </div>
      ),
    },
    {
      key: "month",
      header: "Pay Month",
      render: (row) => (
        <span className="whitespace-nowrap text-slate-600">
          {formatMonth(row.payPeriod)}
        </span>
      ),
    },
    {
      key: "base",
      header: "Base Salary",
      render: (row) => formatMoney(row.baseSalary),
    },
    {
      key: "lop",
      header: "LOP",
      render: (row) => (
        <span className={Number(row.lopDeduction) > 0 ? "text-rose-600" : "text-slate-500"}>
          {formatMoney(row.lopDeduction)}
        </span>
      ),
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
        <span className="whitespace-nowrap font-semibold text-slate-900">
          {formatMoney(row.netSalary)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Payment Method",
      render: (row) => (
        <span className="whitespace-nowrap text-slate-600">
          {row.paymentMethod}
        </span>
      ),
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
      header: "Actions",
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
        ) : (
          <span className="text-xs text-slate-400">Completed</span>
        ),
    },
  ];

  const rows = records.map((record) => ({
    ...record,
    id: record.uuid,
  }));

  return (
    <div className="min-w-0 space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Payroll records"
          value={summary.total}
          detail="Records matching current filters"
          icon={Wallet}
          tone="navy"
        />
        <MetricCard
          label="Processed"
          value={summary.processed}
          detail="Payroll runs completed"
          icon={CheckCircle2}
          tone="green"
        />
        <MetricCard
          label="Pending"
          value={summary.pending}
          detail="Awaiting payroll processing"
          icon={Clock3}
          tone="amber"
        />
        <MetricCard
          label="Net payroll"
          value={formatMoney(summary.net)}
          detail="Total net salary in this result set"
          icon={CreditCard}
          tone="blue"
        />
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <SectionHeading
          eyebrow="Payroll operations"
          title="Payroll runs"
          description="Create payroll records, filter results and process pending payments."
          action={
            <Button onClick={() => setShowForm(true)}>
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Create Payroll
              </span>
            </Button>
          }
        />
      </section>

      {showForm && (
        <PayrollModal
          title="Create payroll"
          description="Select an employee and review the calculated salary before creating the payroll record."
          onClose={() => setShowForm(false)}
        >
          <CreatePayrollForm
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        </PayrollModal>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900">Filter payroll</h3>
          <p className="mt-1 text-sm text-slate-500">
            Narrow the register by employee and date range.
          </p>
        </div>

        <form onSubmit={runSearch} role="search" aria-label="Filter payroll">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <EmployeeAutocomplete
                selected={draft.employee}
                onSelect={(employee) => {
                  setDraft((prev) => ({ ...prev, employee }));
                  setFilterError("");
                }}
                onTextChange={setEmployeeText}
                placeholder="Search employee by name..."
                className="w-full"
                inputClassName="border-slate-200 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Start date
              </label>
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                End date
              </label>
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                <span className="inline-flex items-center gap-2">
                  <Search size={15} />
                  Search
                </span>
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  aria-label="Clear filters"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>

          {filterError && (
            <p className="mt-3 text-sm text-rose-600">{filterError}</p>
          )}
        </form>

        {hasActiveFilters && !isLoading && !loadError && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
            <span>
              {records.length} matching record{records.length === 1 ? "" : "s"}
            </span>
            {applied.employee && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {applied.employee.fullName}
              </span>
            )}
            {applied.startDate && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                From {formatDate(applied.startDate)}
              </span>
            )}
            {applied.endDate && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                To {formatDate(applied.endDate)}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h3 className="font-semibold text-slate-900">Payroll register</h3>
            <p className="mt-1 text-sm text-slate-500">
              Employee-level payroll and payment status.
            </p>
          </div>
          <Badge tone="neutral">{records.length} records</Badge>
        </div>

        {loadError ? (
          <div className="m-4 rounded-xl border border-slate-200 sm:m-5">
            <ErrorState
              title="Couldn't load payroll"
              description={loadError}
              onRetry={retry}
            />
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto px-3 pb-3 sm:px-5">
            <DataTable
              columns={columns}
              rows={rows}
              isLoading={isLoading}
              emptyMessage={
                hasActiveFilters
                  ? "No payroll records match these filters."
                  : "No payroll records yet."
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page: tabs
// ---------------------------------------------------------------------------

const TABS = [
  { id: "runs", label: "Payroll Runs", icon: Wallet },
  { id: "salaries", label: "Salary Structure", icon: Users },
];

function Payroll() {
  const [activeTab, setActiveTab] = useState("runs");

  return (
    <div className="min-w-0 space-y-6 pb-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/80 p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border border-blue-100" />
        <div className="pointer-events-none absolute -right-3 -top-12 h-40 w-40 rounded-full border border-blue-100/80" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b1833] text-white shadow-md">
            <Wallet size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
              Human resources
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Payroll Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage monthly payroll, salary structures, deductions, bonuses
              and payment processing from one workspace.
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
        <div
          role="tablist"
          aria-label="Payroll sections"
          className="grid grid-cols-2 gap-2"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`payroll-tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`payroll-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[#0b1833] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`payroll-panel-${activeTab}`}
        aria-labelledby={`payroll-tab-${activeTab}`}
        className="min-w-0"
      >
        {activeTab === "runs" ? <PayrollRuns /> : <SalaryStructure />}
      </div>
    </div>
  );
}

export default Payroll;
