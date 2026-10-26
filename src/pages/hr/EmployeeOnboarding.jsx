
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { showToast } from "../../components/common/Toast";

import {
  cancelOnboarding,
  getErrorMessage,
  getFieldErrors,
  getOnboardableRoles,
  getOnboardingRecords,
  startOnboarding,
  updateChecklistItem,
} from "../../services/onboardingService";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPLOYMENT_TYPES = ["Full Time", "Intern", "Probation"];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  roleUuid: "",
  employmentType: "Full Time",
  joiningDate: "",
  phone1: "",
};

const FILTERS = ["All", "Not Started", "In Progress", "Completed"];

const STATUS_TONE = {
  "Not Started": "neutral",
  "In Progress": "warning",
  Completed: "success",
};

const STATUS_STYLES = {
  All: {
    icon: "◫",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
  },
  "Not Started": {
    icon: "○",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  "In Progress": {
    icon: "◷",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
  },
  Completed: {
    icon: "✓",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatRole = (name = "") =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatDate = (value) => {
  if (!value) return "—";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fullName = (employee) =>
  [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") ||
  "Unnamed";

const getInitials = (employee) => {
  const first = employee?.firstName?.trim()?.[0] ?? "";
  const last = employee?.lastName?.trim()?.[0] ?? "";

  return (first + last).toUpperCase() || "?";
};

// ---------------------------------------------------------------------------
// Start Onboarding modal
// ---------------------------------------------------------------------------

function StartOnboardingForm({ roles, onCreated, onCancel }) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_FORM });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onCancel]);

  const onSubmit = async (values) => {
    try {
      const record = await startOnboarding(values);

      showToast.success(
        `Onboarding started for ${fullName(record.employee)}.`,
      );

      reset(EMPTY_FORM);
      onCreated(record);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) =>
          setError(field, { type: "server", message }),
        );
      }

      showToast.error(
        getErrorMessage(error, "Couldn't start onboarding."),
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-modal-title"
        className="my-auto flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:max-h-[90vh] sm:rounded-3xl"
      >
        {/* Soft navy header */}
        <header className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-gradient-to-r from-[#0b1932] via-[#112746] to-[#19385d] px-5 py-5 text-white sm:px-8 sm:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-1 -top-16 h-44 w-44 rounded-full border border-white/10"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-2xl font-light text-blue-100 sm:h-12 sm:w-12">
                +
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="onboarding-modal-title"
                    className="text-xl font-bold tracking-tight sm:text-2xl"
                  >
                    Start onboarding
                  </h2>

                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                    New joiner
                  </span>
                </div>

                <p className="mt-1.5 max-w-xl text-sm leading-5 text-slate-300">
                  Add employee details to create their record and onboarding
                  checklist.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close onboarding form"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <div className="relative mt-5 flex items-center gap-2 text-xs text-blue-100/90">
            <span className="h-2 w-2 rounded-full bg-blue-300" />
            Employee details
            <span className="text-white/40">/</span>
            Role and joining information
          </div>
        </header>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {/* Scrollable modal body */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-6 sm:px-8 sm:py-7">
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg text-blue-700 shadow-sm ring-1 ring-blue-100">
                i
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Employee information
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Provide accurate details. The employee's role and joining
                  information will be used to create the onboarding record.
                  Fields marked with * are required.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              <Input
                label="First Name"
                required
                error={errors.firstName?.message}
                {...register("firstName", {
                  required: "First name is required",
                  maxLength: {
                    value: 100,
                    message: "Max 100 characters",
                  },
                })}
              />

              <Input
                label="Last Name"
                error={errors.lastName?.message}
                {...register("lastName", {
                  maxLength: {
                    value: 100,
                    message: "Max 100 characters",
                  },
                })}
              />

              <Input
                label="Work Email"
                type="email"
                required
                placeholder="name@hawkn.dev"
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />

              <Input
                label="Phone"
                type="tel"
                placeholder="+91 98765 43210"
                error={errors.phone1?.message}
                {...register("phone1", {
                  pattern: {
                    value: /^[0-9+\-\s()]{7,20}$/,
                    message: "Enter a valid phone number",
                  },
                })}
              />

              <Select
                label="Role"
                required
                placeholder="Select role…"
                options={roles.map((role) => ({
                  value: role.uuid,
                  label: formatRole(role.name),
                }))}
                error={errors.roleUuid?.message}
                {...register("roleUuid", {
                  required: "Role is required",
                })}
              />

              <Select
                label="Employment Type"
                required
                options={EMPLOYMENT_TYPES.map((type) => ({
                  value: type,
                  label: type,
                }))}
                error={errors.employmentType?.message}
                {...register("employmentType", {
                  required: "Employment type is required",
                })}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Joining Date"
                  type="date"
                  required
                  error={errors.joiningDate?.message}
                  {...register("joiningDate", {
                    required: "Joining date is required",
                  })}
                />
              </div>
            </div>
          </div>

          {/* Persistent footer */}
          <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-slate-50/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-xs leading-5 text-slate-500">
              The onboarding checklist will be generated when you submit.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={onCancel}
              >
                Cancel
              </Button>

              <Button type="submit" loading={isSubmitting}>
                Start Onboarding
              </Button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onboarding record card
// ---------------------------------------------------------------------------

function OnboardingCard({ record, onChange, onRemoved }) {
  const [savingItem, setSavingItem] = useState(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { employee } = record;
  const isCompleted = record.status === "Completed";

  const toggleItem = async (item) => {
    setSavingItem(item.key);

    try {
      const updated = await updateChecklistItem(
        record.uuid,
        item.key,
        !item.done,
      );

      onChange(updated);

      if (updated.status === "Completed" && !isCompleted) {
        showToast.success(
          `${fullName(employee)} is fully onboarded.`,
        );
      }
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Couldn't update the checklist."),
      );
    } finally {
      setSavingItem(null);
    }
  };

  const handleCancel = async () => {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }

    setIsCancelling(true);

    try {
      await cancelOnboarding(record.uuid);

      showToast.info(
        `Onboarding cancelled for ${fullName(employee)}.`,
      );

      onRemoved(record.uuid);
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Couldn't cancel onboarding."),
      );

      setIsCancelling(false);
      setConfirmingCancel(false);
    }
  };

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      {/* Accent strip */}
      <div
        className={`h-1 w-full ${
          isCompleted
            ? "bg-emerald-500"
            : record.status === "In Progress"
              ? "bg-blue-500"
              : "bg-slate-300"
        }`}
      />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Identity and status */}
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-800">
            {getInitials(employee)}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="break-words text-sm font-bold text-slate-900 sm:text-base">
              {fullName(employee)}
            </h3>

            <p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">
              {employee?.email}
            </p>
          </div>

          <div className="shrink-0">
            <Badge tone={STATUS_TONE[record.status] ?? "neutral"}>
              {record.status}
            </Badge>
          </div>
        </div>

        {/* Employment details */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
            {formatRole(employee?.role?.name)}
          </span>

          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
            {employee?.employmentType || "Employment type unavailable"}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Joining date</span>
          <span className="font-semibold text-slate-700">
            {formatDate(employee?.joiningDate)}
          </span>
        </div>

        {/* Progress panel */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Checklist progress
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {record.completedSteps}{" "}
                <span className="font-medium text-slate-400">
                  / {record.totalSteps} steps
                </span>
              </p>
            </div>

            <div
              className={`text-xl font-bold tracking-tight ${
                isCompleted ? "text-emerald-700" : "text-blue-700"
              }`}
            >
              {record.progress}%
            </div>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={record.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Onboarding progress for ${fullName(employee)}`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted ? "bg-emerald-500" : "bg-blue-600"
              }`}
              style={{ width: `${record.progress}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Onboarding checklist
            </h4>

            <span className="text-xs text-slate-400">
              {record.totalSteps
                ? `${record.completedSteps}/${record.totalSteps}`
                : "0 steps"}
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {record.checklist.map((item) => (
              <li key={item.key}>
                <label className="flex min-w-0 cursor-pointer items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#17365d] disabled:cursor-wait"
                    checked={item.done}
                    disabled={savingItem !== null || isCancelling}
                    onChange={() => toggleItem(item)}
                  />

                  <span
                    className={`min-w-0 flex-1 break-words leading-5 ${
                      item.done
                        ? "text-slate-400 line-through"
                        : "text-slate-700"
                    }`}
                  >
                    {item.label}
                  </span>

                  {savingItem === item.key && (
                    <span className="shrink-0">
                      <Loader context="inline" />
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        {!isCompleted && (
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            {confirmingCancel && !isCancelling && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmingCancel(false)}
              >
                Keep employee
              </Button>
            )}

            <Button
              size="sm"
              variant="danger"
              loading={isCancelling}
              onClick={handleCancel}
            >
              {confirmingCancel ? "Confirm cancel?" : "Cancel Onboarding"}
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="mt-5 flex items-center gap-2 border-t border-emerald-100 pt-4 text-xs font-medium text-emerald-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
              ✓
            </span>
            Onboarding checklist completed
          </div>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function EmployeeOnboarding() {
  const [records, setRecords] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([getOnboardingRecords(), getOnboardableRoles()])
      .then(([recordList, roleList]) => {
        if (ignore) return;

        setRecords(recordList);
        setRoles(roleList);
        setLoadError(null);
      })
      .catch((error) => {
        if (ignore) return;

        setLoadError(
          getErrorMessage(error, "Couldn't load onboarding records."),
        );
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const counts = useMemo(() => {
    const result = {
      All: records.length,
      "Not Started": 0,
      "In Progress": 0,
      Completed: 0,
    };

    records.forEach((record) => {
      result[record.status] = (result[record.status] ?? 0) + 1;
    });

    return result;
  }, [records]);

  const visibleRecords = useMemo(
    () =>
      filter === "All"
        ? records
        : records.filter((record) => record.status === filter),
    [records, filter],
  );

  const handleCreated = (record) => {
    setRecords((previous) => [record, ...previous]);
    setIsFormOpen(false);
    setFilter("All");
  };

  const handleChanged = (updated) => {
    setRecords((previous) =>
      previous.map((record) =>
        record.uuid === updated.uuid ? updated : record,
      ),
    );
  };

  const handleRemoved = (uuid) => {
    setRecords((previous) =>
      previous.filter((record) => record.uuid !== uuid),
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl min-w-0 flex-col gap-6">
      {/* Page heading */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/60 p-5 shadow-sm sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-blue-100 sm:h-80 sm:w-80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-12 h-44 w-44 rounded-full border border-blue-100"
        />

        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0b1932] text-lg font-bold text-white shadow-sm sm:h-14 sm:w-14">
              HR
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 sm:text-xs">
                People Operations
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Employee Onboarding
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                A clear view of new joiners, checklist progress, and the
                steps needed to get every employee ready.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Employee lifecycle
                </span>

                <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-600">
                  {records.length} onboarding records
                </span>
              </div>
            </div>
          </div>

          {!loadError && (
            <div className="relative shrink-0">
              <Button
                onClick={() => setIsFormOpen(true)}
                disabled={isLoading}
              >
                Start Onboarding
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Status overview */}
      {!isLoading && !loadError && (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Onboarding overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a status to filter the employee list.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-400">
              Live record totals
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {FILTERS.map((status) => {
              const style = STATUS_STYLES[status];
              const active = filter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  aria-pressed={active}
                  className={`group min-w-0 rounded-2xl border bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:p-5 ${
                    active
                      ? "border-blue-200 ring-1 ring-blue-100"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-xs font-medium leading-5 text-slate-500 sm:text-sm">
                      {status === "All" ? "Total records" : status}
                    </span>

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${style.iconBg} ${style.iconColor}`}
                    >
                      {style.icon}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {counts[status] ?? 0}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      {status === "All"
                        ? "All employees"
                        : status === "Not Started"
                          ? "Awaiting progress"
                          : status === "In Progress"
                            ? "Currently underway"
                            : "Fully onboarded"}
                    </span>

                    <span
                      className={`text-sm transition-transform group-hover:translate-x-0.5 ${
                        active ? "text-blue-700" : "text-slate-400"
                      }`}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Employee records */}
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Employee records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isLoading
                ? "Loading onboarding records…"
                : `${visibleRecords.length} ${
                    filter === "All"
                      ? "employees"
                      : `${filter.toLowerCase()} records`
                  }`}
            </p>
          </div>

          {!isLoading && !loadError && (
            <div className="flex flex-wrap gap-2" aria-label="Onboarding filters">
              {FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  aria-pressed={filter === status}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    filter === status
                      ? "border-[#0b1932] bg-[#0b1932] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Loader label="Loading onboarding records…" />
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <ErrorState
              title="Couldn't load onboarding"
              description={loadError}
              onRetry={retry}
            />
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <EmptyState
              title="No one is being onboarded yet"
              description="Start onboarding for a new joiner to create their checklist."
              action={
                <Button onClick={() => setIsFormOpen(true)}>
                  Start Onboarding
                </Button>
              }
            />
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <EmptyState
              title={`No ${filter.toLowerCase()} onboarding`}
            />
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleRecords.map((record) => (
              <OnboardingCard
                key={record.uuid}
                record={record}
                onChange={handleChanged}
                onRemoved={handleRemoved}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal sits above the dashboard and blurs the background */}
      {isFormOpen && (
        <StartOnboardingForm
          roles={roles}
          onCreated={handleCreated}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}

export default EmployeeOnboarding;
