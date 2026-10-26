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

const STATUS_TONE = {
  "Not Started": "neutral",
  "In Progress": "warning",
  Completed: "success",
};

const FILTERS = ["All", "Not Started", "In Progress", "Completed"];

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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
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
        className="my-auto flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh]"
      >
        {/* Dark modal header */}
        <header className="relative shrink-0 overflow-hidden bg-[#0b1932] px-5 py-5 text-white sm:px-8 sm:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-20 h-48 w-48 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-12 h-32 w-32 rounded-full border border-white/10"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg font-semibold text-white sm:h-12 sm:w-12">
                +
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                  HR Management
                </p>

                <h2
                  id="onboarding-modal-title"
                  className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Start Onboarding
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-300">
                  Create a new joiner record and set up their onboarding
                  checklist.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close onboarding form"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl text-slate-200 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </header>

        {/* Scrollable form content */}
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-900">
                Employee details
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Enter the employee's information, role, and joining details.
                Fields marked with * are required.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
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

              <Input
                label="Joining Date"
                type="date"
                required
                error={errors.joiningDate?.message}
                {...register("joiningDate", {
                  required: "Joining date is required",
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
            </div>
          </div>

          {/* Fixed modal footer */}
          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="hidden text-xs text-slate-500 sm:block">
              The employee record and checklist will be created on submission.
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
// One onboarding card
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
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      {/* Employee header */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-base font-bold text-slate-900">
            {fullName(employee)}
          </h2>

          <p className="mt-1 truncate text-sm text-slate-500">
            {employee?.email}
          </p>

          <p className="mt-2 break-words text-xs leading-5 text-slate-500">
            {formatRole(employee?.role?.name)} · {employee?.employmentType}
            {" · "}Joining {formatDate(employee?.joiningDate)}
          </p>
        </div>

        <div className="shrink-0">
          <Badge tone={STATUS_TONE[record.status] ?? "neutral"}>
            {record.status}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {record.completedSteps} of {record.totalSteps} steps done
          </span>
          <span className="font-semibold text-slate-700">
            {record.progress}%
          </span>
        </div>

        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={record.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Onboarding progress for ${fullName(employee)}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted ? "bg-emerald-600" : "bg-blue-600"
            }`}
            style={{ width: `${record.progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <ul className="mt-5 flex flex-col gap-3">
        {record.checklist.map((item) => (
          <li key={item.key}>
            <label className="flex min-w-0 cursor-pointer items-start gap-3 text-sm text-slate-800">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#0b1932] disabled:cursor-wait"
                checked={item.done}
                disabled={savingItem !== null || isCancelling}
                onChange={() => toggleItem(item)}
              />

              <span
                className={`min-w-0 flex-1 break-words leading-5 ${
                  item.done ? "text-slate-400 line-through" : ""
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

      {/* Card actions */}
      {!isCompleted && (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
          {confirmingCancel && !isCancelling && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmingCancel(false)}
            >
              Keep
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
    <div className="mx-auto flex w-full max-w-screen-2xl min-w-0 flex-col gap-5 sm:gap-6">
      {/* Page header, matching the HRMS visual style */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-100 p-5 shadow-sm sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-blue-100 sm:h-80 sm:w-80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-blue-100 sm:h-64 sm:w-64"
        />

        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0b1932] text-sm font-bold text-white shadow-sm sm:h-14 sm:w-14">
              HR
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                People Operations
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Employee Onboarding
                </h1>

                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  HR Workspace
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Track new joiners through offers, documents, system access,
                and induction.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Onboarding records
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  {records.length} total
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

      {/* Status summary */}
      {!isLoading && !loadError && (
        <section aria-label="Onboarding status summary">
          <div className="mb-3">
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Onboarding overview
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Track new joiners by onboarding status
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {FILTERS.map((status, index) => {
              const active = filter === status;
              const styles = [
                "bg-blue-50 text-blue-700",
                "bg-slate-100 text-slate-700",
                "bg-amber-50 text-amber-700",
                "bg-emerald-50 text-emerald-700",
              ];

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  aria-pressed={active}
                  className={`min-w-0 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:p-5 ${
                    active
                      ? "border-blue-300 ring-1 ring-blue-200"
                      : "border-slate-200"
                  }`}
                >
                  <span
                    className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[index]}`}
                  >
                    {status}
                  </span>

                  <span className="mt-3 block text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {counts[status] ?? 0}
                  </span>

                  <span className="mt-1 block text-xs text-slate-500">
                    {status === "All"
                      ? "All records"
                      : status === "Not Started"
                        ? "Awaiting progress"
                        : status === "In Progress"
                          ? "Currently underway"
                          : "Fully onboarded"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main records */}
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Onboarding records
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {isLoading
                ? "Loading employee records…"
                : `${visibleRecords.length} ${filter === "All" ? "records" : `${filter.toLowerCase()} records`}`}
            </p>
          </div>

          {!isLoading && !loadError && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
              {filter} view
            </span>
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
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
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

      {/* Modal is rendered above the page and blurs the background */}
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
