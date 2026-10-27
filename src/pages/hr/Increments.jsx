
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Search,
  X,
  TrendingUp,
  CircleDollarSign,
  Users,
  CalendarDays,
  Plus,
  RefreshCw,
  UserRound,
  FileText,
  CheckCircle2,
  ArrowUpRight,
  ClipboardList,
  Wallet,
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
  createBonus,
  createIncrement,
  deleteBonus,
  getBonuses,
  getIncrements,
  revertIncrement,
  updateIncrement,
} from "../../services/bonusIncrementService";

// Accessible reusable modal used by bonus and increment actions.
function Modal({ title, description, onClose, size = "max-w-3xl", children }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bonus-increment-modal-title"
        aria-describedby={
          description ? "bonus-increment-modal-description" : undefined
        }
        className={`flex max-h-[90vh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-cm-border px-6 py-4">
          <div>
            <h2
              id="bonus-increment-modal-title"
              className="text-lg font-semibold text-cm-text"
            >
              {title}
            </h2>
            {description && (
              <p
                id="bonus-increment-modal-description"
                className="mt-1 text-sm text-cm-text-muted"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-cm-text-muted transition hover:bg-cm-bg hover:text-cm-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000052]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="overflow-y-auto p-6">{children}</div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BONUS_TYPES = [
  "Performance",
  "Festival",
  "Referral",
  "Joining",
  "Other",
];

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

  const [year, month, day] = String(yyyyMmDd)
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const pad = (number) => String(number).padStart(2, "0");

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
};

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
// Shared UI components
// ---------------------------------------------------------------------------

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "blue",
}) {
  const tones = {
    blue: "bg-cm-blue-100 text-cm-blue-700",
    green: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-cm-warning-100 text-cm-warning-600",
    violet: "bg-violet-500/10 text-violet-600",
  };

  return (
    <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-cm-text-muted">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-cm-text">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-cm-text-muted">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon size={21} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-cm-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cm-bg text-cm-text">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-semibold text-cm-text">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-cm-text-muted">
            {description}
          </p>
        </div>
      </div>

      {action}
    </div>
  );
}

function CompensationModal({
  title,
  description,
  icon: Icon,
  badge,
  onClose,
  children,
}) {
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
        aria-labelledby="compensation-modal-title"
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
                    id="compensation-modal-title"
                    className="text-lg font-semibold tracking-tight text-white sm:text-xl"
                  >
                    {title}
                  </h2>
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-200">
                    {badge}
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
            <span>Compensation operations</span>
            <span className="text-slate-500">/</span>
            <span>Employee salary and payment details</span>
          </div>
        </header>
        <div className="overflow-y-auto bg-white">{children}</div>
      </section>
    </div>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cm-bg text-cm-text-muted">
        <FileText size={25} />
      </div>

      <h3 className="mt-4 font-semibold text-cm-text">{title}</h3>

      <p className="mt-1 max-w-md text-sm leading-6 text-cm-text-muted">
        {description}
      </p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function EmployeeIdentity({ employee }) {
  return (
    <div className="flex min-w-[180px] items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-bg text-cm-text-muted">
        <UserRound size={19} />
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-cm-text">
          {employee?.fullName || "Unknown employee"}
        </p>
        <p className="mt-1 max-w-[220px] truncate text-xs text-cm-text-muted">
          {employee?.email || "—"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee filter
// ---------------------------------------------------------------------------

function EmployeeFilterBar({
  searchFn,
  onSearch,
  applied,
  resultCount,
  label,
}) {
  const [draft, setDraft] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();

    if (text.trim() && !draft) {
      setError("Select an employee from the suggestions.");
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
    <div className="flex flex-col gap-3">
      <form
        onSubmit={submit}
        className="flex flex-col gap-2"
        role="search"
        aria-label={`Filter ${label}`}
      >
        <div className="flex items-center gap-2 rounded-xl border border-cm-border bg-cm-bg px-3 py-2">
          <div className="min-w-0 flex-1">
            <EmployeeAutocomplete
              selected={draft}
              onSelect={(employee) => {
                setDraft(employee);
                setError("");
              }}
              onTextChange={setText}
              searchFn={searchFn}
              placeholder="Search employee by name..."
              className="flex-1"
              inputClassName="border-transparent bg-transparent focus:ring-0"
            />
          </div>

          <Button type="submit" size="sm">
            <span className="inline-flex items-center gap-2">
              <Search size={15} />
              Search
            </span>
          </Button>
        </div>

        {error && (
          <p className="px-1 text-sm text-cm-danger-600">{error}</p>
        )}
      </form>

      {applied && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-cm-text-muted">
          <span>
            Showing {resultCount} {label} for{" "}
            <strong className="text-cm-text">{applied.fullName}</strong>
          </span>

          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-full border border-cm-border px-2.5 py-1 text-xs font-medium text-cm-text transition hover:bg-cm-bg"
          >
            <X size={13} />
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared list loader
// ---------------------------------------------------------------------------

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

  return {
    records,
    setRecords,
    isLoading,
    loadError,
    applied,
    reload,
    search,
  };
}

// ---------------------------------------------------------------------------
// Bonuses tab
// ---------------------------------------------------------------------------

const BONUS_DEFAULTS = () => ({
  payPeriod: currentMonth(),
  bonusType: "Performance",
  amount: "",
  reason: "",
});

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
      setEmployeeError("Select an employee from the suggestions.");
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

      showToast.success(
        `Bonus of ${formatMoney(record.amount)} added for ${record.employee.fullName}.`
      );

      onSaved();
    } catch (error) {
      applyServerErrors(error, setError, setEmployeeError);
      showToast.error(getErrorMessage(error, "Couldn't add bonus."));
    }
  };

  return (
    <CompensationModal
      icon={Plus}
      title="Add Bonus"
      description="Create a one-time employee bonus for a specific payroll month."
      badge="Bonus"
      onClose={onCancel}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-3"
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
          placeholder="Search employee by name..."
        />

        <Input
          label="Pay Month"
          type="month"
          required
          helperText="The bonus is included when payroll is created for this month."
          error={errors.payPeriod?.message}
          {...register("payPeriod", {
            required: "Month is required",
          })}
        />

        <Select
          label="Bonus Type"
          required
          options={BONUS_TYPES.map((type) => ({
            value: type,
            label: type,
          }))}
          error={errors.bonusType?.message}
          {...register("bonusType", {
            required: "Bonus type is required",
          })}
        />

        <Input
          label="Bonus Amount (₹)"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 5000"
          required
          error={errors.amount?.message}
          {...register("amount", {
            required: "Amount is required",
            validate: (value) =>
              Number(value) > 0 || "Amount must be more than 0",
          })}
        />

        <div className="md:col-span-2">
          <Input
            label="Reason (optional)"
            placeholder="e.g. Performance achievement"
            error={errors.reason?.message}
            {...register("reason", {
              maxLength: {
                value: 500,
                message: "Max 500 characters",
              },
            })}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 rounded-xl border-t border-cm-border bg-slate-50 p-4 sm:flex-row sm:justify-end md:col-span-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button type="submit" loading={isSubmitting}>
            <span className="inline-flex items-center gap-2">
              <Plus size={15} />
              Add Bonus
            </span>
          </Button>
        </div>
      </form>
    </CompensationModal>
  );
}

function BonusesTab() {
  const list = useEmployeeList(getBonuses);
  const [formKey, setFormKey] = useState(null);
  const [confirmUuid, setConfirmUuid] = useState(null);
  const [deletingUuid, setDeletingUuid] = useState(null);

  const totalBonus = useMemo(
    () => list.records.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [list.records]
  );

  const handleDelete = async (row) => {
    if (confirmUuid !== row.uuid) {
      setConfirmUuid(row.uuid);
      return;
    }

    setDeletingUuid(row.uuid);

    try {
      await deleteBonus(row.uuid);

      list.setRecords((previous) =>
        previous.filter((record) => record.uuid !== row.uuid)
      );

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
      header: "EMPLOYEE",
      render: (row) => <EmployeeIdentity employee={row.employee} />,
    },
    {
      key: "month",
      header: "PAY MONTH",
      render: (row) => (
        <div className="min-w-[120px]">
          <p className="font-medium text-cm-text">{formatMonth(row.payPeriod)}</p>
          <p className="mt-1 text-xs text-cm-text-muted">{row.payPeriod}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "BONUS TYPE",
      render: (row) => <Badge tone="neutral">{row.bonusType}</Badge>,
    },
    {
      key: "amount",
      header: "AMOUNT",
      render: (row) => (
        <span className="whitespace-nowrap font-semibold text-cm-text">
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "REASON",
      render: (row) => (
        <span className="text-sm text-cm-text-muted">
          {row.reason || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      render: (row) => {
        const isConfirming = confirmUuid === row.uuid;

        return (
          <div className="flex min-w-[150px] justify-end gap-2">
            {isConfirming && deletingUuid !== row.uuid && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmUuid(null)}
              >
                Keep
              </Button>
            )}

            <Button
              size="sm"
              variant="danger"
              loading={deletingUuid === row.uuid}
              disabled={deletingUuid !== null}
              onClick={() => setConfirmUuid(row.uuid)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Total Bonus Value"
          value={formatMoney(totalBonus)}
          description="Sum of bonuses in the current result set"
          icon={CircleDollarSign}
          tone="green"
        />

        <SummaryCard
          title="Bonus Records"
          value={list.records.length}
          description={
            list.applied
              ? `Records for ${list.applied.fullName}`
              : "Records across all employees"
          }
          icon={ClipboardList}
          tone="blue"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-cm-text-muted">
          One-time bonuses feed into payroll. Changes may be restricted once
          the relevant month's payroll has been processed.
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            disabled={list.isLoading}
            onClick={list.reload}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw
                size={15}
                className={list.isLoading ? "animate-spin" : ""}
              />
              Refresh
            </span>
          </Button>

          <Button
            onClick={() =>
              setFormKey((key) => (key === null ? Date.now() : null))
            }
          >
            <span className="inline-flex items-center gap-2">
              {formKey === null ? <Plus size={15} /> : <X size={15} />}
              {formKey === null ? "Add Bonus" : "Close Form"}
            </span>
          </Button>
        </div>
      </div>

      {formKey !== null && (
        <Modal
          title="Add Bonus"
          description="Add a one-time bonus to the selected employee's payroll."
          onClose={() => setFormKey(null)}
        >
          <BonusForm
            key={formKey}
            onSaved={() => {
              setFormKey(null);
              list.reload();
            }}
            onCancel={() => setFormKey(null)}
          />
        </Modal>
      )}

      {confirmUuid &&
        (() => {
          const record = list.records.find((item) => item.uuid === confirmUuid);
          return record ? (
            <Modal
              title="Delete bonus?"
              description="This action cannot be undone."
              onClose={() => setConfirmUuid(null)}
              size="max-w-md"
            >
              <p className="text-sm text-cm-text-muted">
                Delete the {formatMoney(record.amount)}{" "}
                {record.bonusType.toLowerCase()} bonus for{" "}
                <strong className="text-cm-text">
                  {record.employee.fullName}
                </strong>
                ?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmUuid(null)}
                  disabled={deletingUuid !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  loading={deletingUuid === record.uuid}
                  onClick={() => handleDelete(record)}
                >
                  Delete bonus
                </Button>
              </div>
            </Modal>
          ) : null;
        })()}

      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <SectionHeader
          icon={Wallet}
          title="Bonus Records"
          description="Review employee bonuses and their assigned payroll months."
          action={
            <Badge tone="neutral">
              {list.records.length}{" "}
              {list.records.length === 1 ? "Record" : "Records"}
            </Badge>
          }
        />

        <div className="border-b border-cm-border px-5 py-4 sm:px-6">
          <EmployeeFilterBar
            searchFn={searchSalaryEmployees}
            onSearch={list.search}
            applied={list.applied}
            resultCount={list.records.length}
            label="bonuses"
          />
        </div>

        <div className="p-4 sm:p-6">
          {list.loadError ? (
            <ErrorState
              title="Couldn't load bonuses"
              description={list.loadError}
              onRetry={list.reload}
            />
          ) : list.isLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
              <RefreshCw size={22} className="animate-spin text-cm-text-muted" />
              <p className="text-sm text-cm-text-muted">Loading bonuses...</p>
            </div>
          ) : list.records.length === 0 ? (
            <EmptyState
              title={
                list.applied
                  ? "No bonuses for this employee"
                  : "No bonuses added yet"
              }
              description={
                list.applied
                  ? "No bonus records were found for the selected employee."
                  : "Add a bonus to create the first record in this list."
              }
              action={
                !list.applied && (
                  <Button size="sm" onClick={() => setFormKey(Date.now())}>
                    <span className="inline-flex items-center gap-2">
                      <Plus size={15} />
                      Add First Bonus
                    </span>
                  </Button>
                )
              }
            />
          ) : (
            <DataTable
              columns={columns}
              rows={list.records.map((record) => ({
                ...record,
                id: record.uuid,
              }))}
              isLoading={list.isLoading}
              emptyMessage="No bonuses found."
            />
          )}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Increments tab
// ---------------------------------------------------------------------------

// Salary and percentage calculations use the same paise rounding as the
// existing implementation.
const salaryFromPercent = (base, percent) =>
  Math.round(base * 100 * (1 + percent / 100)) / 100;

const percentFromSalary = (base, salary) =>
  Math.round(((salary - base) / base) * 10000) / 100;

function IncrementForm({ editing, onSaved, onCancel }) {
  const isEdit = Boolean(editing);
  const [employee, setEmployee] = useState(null);
  const [employeeError, setEmployeeError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: isEdit
      ? {
          newSalary: editing.newSalary,
          increasePercent: editing.increasePercent,
          effectiveDate: String(editing.effectiveDate).slice(0, 10),
          reason: editing.reason ?? "",
        }
      : {
          newSalary: "",
          increasePercent: "",
          effectiveDate: today(),
          reason: "",
        },
  });

  const base = isEdit
    ? Number(editing.previousSalary)
    : employee?.salary == null
      ? null
      : Number(employee.salary);

  const newSalary = Number(useWatch({ control, name: "newSalary" })) || 0;
  const increase = base !== null && newSalary > 0 ? newSalary - base : null;

  const syncFromSalary = (value) => {
    if (base === null || value === "" || Number(value) <= 0) {
      setValue("increasePercent", "");
      return;
    }

    setValue(
      "increasePercent",
      percentFromSalary(base, Number(value)),
      { shouldValidate: true }
    );
  };

  const syncFromPercent = (value) => {
    if (base === null || value === "") {
      setValue("newSalary", "");
      return;
    }

    setValue(
      "newSalary",
      salaryFromPercent(base, Number(value)),
      { shouldValidate: true }
    );
  };

  const handlePick = (picked) => {
    setEmployee(picked);

    if (picked) setEmployeeError("");

    const typed = getValues("newSalary");

    if (
      picked?.salary != null &&
      typed !== "" &&
      Number(typed) > 0
    ) {
      setValue(
        "increasePercent",
        percentFromSalary(Number(picked.salary), Number(typed)),
        { shouldValidate: true }
      );
    }
  };

  const onSubmit = async (values) => {
    if (!isEdit && !employee) {
      setEmployeeError("Select an employee from the suggestions.");
      return;
    }

    const payload = {
      newSalary: Number(values.newSalary),
      effectiveDate: values.effectiveDate,
      reason: values.reason,
    };

    try {
      const record = isEdit
        ? await updateIncrement(editing.uuid, payload)
        : await createIncrement({
            userUuid: employee.uuid,
            ...payload,
          });

      showToast.success(
        `${isEdit ? "Increment updated: " : ""}${record.employee.fullName}: ${formatMoney(record.previousSalary)} → ${formatMoney(record.newSalary)} (+${record.increasePercent}%).`
      );

      onSaved();
    } catch (error) {
      applyServerErrors(error, setError, setEmployeeError);
      showToast.error(
        getErrorMessage(
          error,
          `Couldn't ${isEdit ? "update" : "apply"} increment.`
        )
      );
    }
  };

  return (
    <CompensationModal
      icon={TrendingUp}
      title={isEdit ? "Edit Salary Increment" : "Apply Salary Increment"}
      description={
        isEdit
          ? "Update the latest increment. Employee and previous salary are fixed."
          : "Select an employee and define their new monthly salary."
      }
      badge="Increment"
      onClose={onCancel}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-3"
      >
        {isEdit ? (
          <Input
            label="Employee"
            value={editing.employee.fullName}
            readOnly
            disabled
            helperText={`Previous salary: ${formatMoney(editing.previousSalary)}`}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <EmployeeAutocomplete
              label="Employee"
              required
              selected={employee}
              onSelect={handlePick}
              searchFn={searchSalaryEmployees}
              error={employeeError}
              placeholder="Search employee by name..."
            />

            {employee && (
              <p
                className={`text-xs leading-5 ${
                  base === null
                    ? "text-cm-danger-600"
                    : "text-cm-text-muted"
                }`}
              >
                {base === null
                  ? "No salary is set. Configure it in Payroll → Salary Structure first."
                  : `Current salary: ${formatMoney(base)}`}
              </p>
            )}
          </div>
        )}

        <Input
          label="New Monthly Salary (₹)"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 65000"
          required
          disabled={base === null}
          error={errors.newSalary?.message}
          {...register("newSalary", {
            required: "New salary is required",
            validate: (value) => {
              if (Number(value) <= 0) {
                return "New salary must be more than 0";
              }

              if (base !== null && Number(value) <= base) {
                return `Must exceed the current salary of ${formatMoney(base)}`;
              }

              return true;
            },
            onChange: (event) => syncFromSalary(event.target.value),
          })}
        />

        <Input
          label="Increase Percentage (%)"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 10"
          disabled={base === null}
          helperText="Enter a percentage or salary. The other field updates automatically."
          error={errors.increasePercent?.message}
          {...register("increasePercent", {
            validate: (value) => {
              if (value === "" || value === null) return true;

              if (Number(value) <= 0) {
                return "Must be more than 0%";
              }

              if (Number(value) > 1000) {
                return "Percentage exceeds 1000%. Check the value.";
              }

              return true;
            },
            onChange: (event) => syncFromPercent(event.target.value),
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
            validate: (value) =>
              value <= today() || "Effective date can't be in the future",
          })}
        />

        <div className="md:col-span-2">
          <Input
            label="Reason (optional)"
            placeholder="e.g. Annual appraisal or promotion"
            error={errors.reason?.message}
            {...register("reason", {
              maxLength: {
                value: 500,
                message: "Max 500 characters",
              },
            })}
          />
        </div>

        {increase !== null && base !== null && (
          <div className="rounded-xl border border-cm-border bg-cm-bg p-5 md:col-span-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-cm-text">
              <TrendingUp size={17} />
              Salary Change Preview
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-cm-text-muted">Previous Salary</p>
                <p className="mt-1 text-lg font-semibold text-cm-text">
                  {formatMoney(base)}
                </p>
              </div>

              <div>
                <p className="text-xs text-cm-text-muted">New Salary</p>
                <p className="mt-1 text-lg font-semibold text-cm-text">
                  {formatMoney(newSalary)}
                </p>
              </div>

              <div>
                <p className="text-xs text-cm-text-muted">Monthly Increase</p>
                <p className="mt-1 text-lg font-semibold text-emerald-600">
                  +{formatMoney(increase)}
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  +{percentFromSalary(base, newSalary)}%
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 rounded-xl border-t border-cm-border bg-slate-50 p-4 sm:flex-row sm:justify-end md:col-span-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={base === null}
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={15} />
              {isEdit ? "Update Increment" : "Apply Increment"}
            </span>
          </Button>
        </div>
      </form>
    </CompensationModal>
  );
}

function IncrementsTab() {
  const list = useEmployeeList(getIncrements);
  const [form, setForm] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [confirmUuid, setConfirmUuid] = useState(null);
  const [revertingUuid, setRevertingUuid] = useState(null);

  const openForm = (next) => {
    setForm(next);
    setFormKey((key) => key + 1);
    setConfirmUuid(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRevert = async (row) => {
    if (confirmUuid !== row.uuid) {
      setConfirmUuid(row.uuid);
      return;
    }

    setRevertingUuid(row.uuid);

    try {
      await revertIncrement(row.uuid);

      showToast.success(
        `Increment reverted: ${row.employee.fullName} back to ${formatMoney(row.previousSalary)}.`
      );

      if (form?.record?.uuid === row.uuid) {
        setForm(null);
      }

      list.reload();
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Couldn't revert increment.")
      );
    } finally {
      setRevertingUuid(null);
      setConfirmUuid(null);
    }
  };

  const totalIncrease = useMemo(
    () =>
      list.records.reduce(
        (sum, record) => sum + Number(record.increaseAmount || 0),
        0
      ),
    [list.records]
  );

  const columns = [
    {
      key: "employee",
      header: "EMPLOYEE",
      render: (row) => <EmployeeIdentity employee={row.employee} />,
    },
    {
      key: "previous",
      header: "PREVIOUS SALARY",
      render: (row) => (
        <span className="whitespace-nowrap text-cm-text-muted">
          {formatMoney(row.previousSalary)}
        </span>
      ),
    },
    {
      key: "new",
      header: "NEW SALARY",
      render: (row) => (
        <span className="whitespace-nowrap font-semibold text-cm-text">
          {formatMoney(row.newSalary)}
        </span>
      ),
    },
    {
      key: "increase",
      header: "INCREASE",
      render: (row) => (
        <div className="flex min-w-[130px] flex-col items-start gap-1">
          <Badge tone="success">
            +{formatMoney(row.increaseAmount)}
          </Badge>
          <span className="text-xs font-medium text-emerald-600">
            +{row.increasePercent}%
          </span>
        </div>
      ),
    },
    {
      key: "effective",
      header: "EFFECTIVE DATE",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-cm-text">
          {formatDate(row.effectiveDate)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "REASON",
      render: (row) => (
        <span className="text-sm text-cm-text-muted">
          {row.reason || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      render: (row) => {
        if (!row.isLatest) {
          return (
            <span className="text-xs text-cm-text-muted">
              Historical record
            </span>
          );
        }

        const isConfirming = confirmUuid === row.uuid;

        return (
          <div className="flex min-w-[150px] justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={revertingUuid !== null}
              onClick={() =>
                openForm({ mode: "edit", record: row })
              }
            >
              Edit
            </Button>

            {isConfirming && revertingUuid !== row.uuid && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmUuid(null)}
              >
                Keep
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              loading={revertingUuid === row.uuid}
              disabled={
                revertingUuid !== null && revertingUuid !== row.uuid
              }
              onClick={() => handleRevert(row)}
            >
              Revert
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Total Salary Increase"
          value={formatMoney(totalIncrease)}
          description="Sum of increases in the current result set"
          icon={TrendingUp}
          tone="green"
        />

        <SummaryCard
          title="Increment Records"
          value={list.records.length}
          description={
            list.applied
              ? `Records for ${list.applied.fullName}`
              : "Salary increment history across employees"
          }
          icon={ClipboardList}
          tone="blue"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-cm-text-muted">
          Salary increments update Salary Structure. Only the latest
          increment for each employee can be edited or reverted.
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            disabled={list.isLoading}
            onClick={list.reload}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw
                size={15}
                className={list.isLoading ? "animate-spin" : ""}
              />
              Refresh
            </span>
          </Button>

          <Button
            onClick={() =>
              form
                ? setForm(null)
                : openForm({ mode: "create" })
            }
          >
            <span className="inline-flex items-center gap-2">
              {form ? <X size={15} /> : <Plus size={15} />}
              {form ? "Close Form" : "Give Increment"}
            </span>
          </Button>
        </div>
      </div>

      {form && (
        <IncrementForm
          key={formKey}
          editing={form.mode === "edit" ? form.record : null}
          onSaved={() => {
            setForm(null);
            list.reload();
          }}
          onCancel={() => setForm(null)}
        />
      )}

      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <SectionHeader
          icon={TrendingUp}
          title="Salary Increment History"
          description="Compare salary changes and manage the latest increment for each employee."
          action={
            <Badge tone="neutral">
              {list.records.length}{" "}
              {list.records.length === 1 ? "Record" : "Records"}
            </Badge>
          }
        />

        <div className="border-b border-cm-border px-5 py-4 sm:px-6">
          <EmployeeFilterBar
            searchFn={searchSalaryEmployees}
            onSearch={list.search}
            applied={list.applied}
            resultCount={list.records.length}
            label="increments"
          />
        </div>

        <div className="p-4 sm:p-6">
          {list.loadError ? (
            <ErrorState
              title="Couldn't load increments"
              description={list.loadError}
              onRetry={list.reload}
            />
          ) : list.isLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
              <RefreshCw size={22} className="animate-spin text-cm-text-muted" />
              <p className="text-sm text-cm-text-muted">
                Loading salary history...
              </p>
            </div>
          ) : list.records.length === 0 ? (
            <EmptyState
              title={
                list.applied
                  ? "No increments for this employee"
                  : "No increments recorded yet"
              }
              description={
                list.applied
                  ? "No salary increment records were found for the selected employee."
                  : "Apply an increment to start tracking salary changes."
              }
              action={
                !list.applied && (
                  <Button
                    size="sm"
                    onClick={() => openForm({ mode: "create" })}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus size={15} />
                      Apply First Increment
                    </span>
                  </Button>
                )
              }
            />
          ) : (
            <DataTable
              columns={columns}
              rows={list.records.map((record) => ({
                ...record,
                id: record.uuid,
              }))}
              isLoading={list.isLoading}
              emptyMessage="No increments found."
            />
          )}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS = [
  { id: "bonuses", label: "Bonuses", icon: CircleDollarSign },
  { id: "increments", label: "Increments", icon: TrendingUp },
];

function Increments() {
  const [activeTab, setActiveTab] = useState("bonuses");

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-card text-cm-text shadow-sm">
            <Wallet size={23} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-cm-text">
                Bonuses & Increments
              </h1>
              <Badge tone="neutral">HR Management</Badge>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-cm-text-muted">
              Manage one-time employee bonuses and recurring salary increases
              from one compensation workspace.
            </p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="rounded-cm-lg border border-cm-border bg-cm-card p-2 shadow-sm">
        <div
          role="tablist"
          aria-label="Bonuses and increments"
          className="grid grid-cols-2 gap-2"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`bi-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`bi-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-[#000052] bg-[#000052] text-white shadow-sm"
                    : "border-transparent text-cm-text-muted hover:bg-cm-bg hover:text-cm-text"
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Only the active tab is mounted, preserving the existing data-loading behavior. */}
      <div
        role="tabpanel"
        id={`bi-panel-${activeTab}`}
        aria-labelledby={`bi-tab-${activeTab}`}
        className="min-w-0"
      >
        {activeTab === "bonuses" ? <BonusesTab /> : <IncrementsTab />}
      </div>
    </div>
  );
}

export default Increments;
