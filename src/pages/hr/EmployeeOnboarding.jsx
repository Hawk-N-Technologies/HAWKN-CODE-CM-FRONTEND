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

// "project_lead" → "Project Lead"
const formatRole = (name = "") =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// "2026-10-05" → "5 Oct 2026" (built from parts so the timezone can't shift the day)
const formatDate = (value) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fullName = (employee) =>
  [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") || "Unnamed";

// ---------------------------------------------------------------------------
// Start Onboarding form
// ---------------------------------------------------------------------------

function StartOnboardingForm({ roles, onCreated, onCancel }) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_FORM });

  const onSubmit = async (values) => {
    try {
      const record = await startOnboarding(values);
      showToast.success(`Onboarding started for ${fullName(record.employee)}.`);
      reset(EMPTY_FORM);
      onCreated(record);
    } catch (error) {
      // Show backend field errors right under the matching inputs
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) =>
          setError(field, { type: "server", message }),
        );
      }
      showToast.error(getErrorMessage(error, "Couldn't start onboarding."));
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-cm-text">New Onboarding</h2>
      <p className="mt-1 text-sm text-cm-text-muted">
        Creates the employee record and an onboarding checklist.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          label="First Name"
          required
          error={errors.firstName?.message}
          {...register("firstName", {
            required: "First name is required",
            maxLength: { value: 100, message: "Max 100 characters" },
          })}
        />
        <Input
          label="Last Name"
          error={errors.lastName?.message}
          {...register("lastName", {
            maxLength: { value: 100, message: "Max 100 characters" },
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
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
          })}
        />
        <Select
          label="Role"
          required
          placeholder="Select role…"
          options={roles.map((role) => ({ value: role.uuid, label: formatRole(role.name) }))}
          error={errors.roleUuid?.message}
          {...register("roleUuid", { required: "Role is required" })}
        />
        <Select
          label="Employment Type"
          required
          options={EMPLOYMENT_TYPES.map((type) => ({ value: type, label: type }))}
          error={errors.employmentType?.message}
          {...register("employmentType", { required: "Employment type is required" })}
        />
        <Input
          label="Joining Date"
          type="date"
          required
          error={errors.joiningDate?.message}
          {...register("joiningDate", { required: "Joining date is required" })}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+91 98765 43210"
          error={errors.phone1?.message}
          {...register("phone1", {
            pattern: { value: /^[0-9+\-\s()]{7,20}$/, message: "Enter a valid phone number" },
          })}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Start Onboarding
        </Button>
      </div>
    </form>
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
      // Server returns the full updated record (new progress + status)
      const updated = await updateChecklistItem(record.uuid, item.key, !item.done);
      onChange(updated);
      if (updated.status === "Completed" && !isCompleted) {
        showToast.success(`${fullName(employee)} is fully onboarded.`);
      }
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't update the checklist."));
    } finally {
      setSavingItem(null);
    }
  };

  const handleCancel = async () => {
    // First click asks, second click does it
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    setIsCancelling(true);
    try {
      await cancelOnboarding(record.uuid);
      showToast.info(`Onboarding cancelled for ${fullName(employee)}.`);
      onRemoved(record.uuid);
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't cancel onboarding."));
      setIsCancelling(false);
      setConfirmingCancel(false);
    }
  };

  return (
    <article className="flex flex-col rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-cm-text">{fullName(employee)}</h2>
          <p className="truncate text-sm text-cm-text-muted">{employee?.email}</p>
          <p className="mt-1 text-sm text-cm-text-muted">
            {formatRole(employee?.role?.name)} · {employee?.employmentType} · Joining{" "}
            {formatDate(employee?.joiningDate)}
          </p>
        </div>
        <Badge tone={STATUS_TONE[record.status] ?? "neutral"}>{record.status}</Badge>
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex justify-between text-xs text-cm-text-muted">
          <span>
            {record.completedSteps} of {record.totalSteps} steps done
          </span>
          <span>{record.progress}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-cm-border"
          role="progressbar"
          aria-valuenow={record.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Onboarding progress for ${fullName(employee)}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${isCompleted ? "bg-green-600" : "bg-blue-600"}`}
            style={{ width: `${record.progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <ul className="mt-4 flex flex-col gap-2">
        {record.checklist.map((item) => (
          <li key={item.key}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-cm-text">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-[#000052] disabled:cursor-wait"
                checked={item.done}
                disabled={savingItem !== null || isCancelling}
                onChange={() => toggleItem(item)}
              />
              <span className={item.done ? "text-cm-text-muted line-through" : ""}>{item.label}</span>
              {savingItem === item.key && <Loader context="inline" />}
            </label>
          </li>
        ))}
      </ul>

      {/* Footer */}
      {!isCompleted && (
        <div className="mt-5 flex justify-end gap-2 border-t border-cm-border pt-4">
          {confirmingCancel && !isCancelling && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmingCancel(false)}>
              Keep
            </Button>
          )}
          <Button size="sm" variant="danger" loading={isCancelling} onClick={handleCancel}>
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

  // Bumping this number re-runs the fetch effect (used by "Retry")
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // If the page closes before the requests finish, don't touch state
    let ignore = false;

    // Both requests in parallel; state is only set in the callbacks
    Promise.all([getOnboardingRecords(), getOnboardableRoles()])
      .then(([recordList, roleList]) => {
        if (ignore) return;
        setRecords(recordList);
        setRoles(roleList);
        setLoadError(null);
      })
      .catch((error) => {
        if (ignore) return;
        setLoadError(getErrorMessage(error, "Couldn't load onboarding records."));
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
    const result = { All: records.length, "Not Started": 0, "In Progress": 0, Completed: 0 };
    records.forEach((record) => {
      result[record.status] = (result[record.status] ?? 0) + 1;
    });
    return result;
  }, [records]);

  const visibleRecords = useMemo(
    () => (filter === "All" ? records : records.filter((record) => record.status === filter)),
    [records, filter],
  );

  const handleCreated = (record) => {
    setRecords((prev) => [record, ...prev]);
    setIsFormOpen(false);
    setFilter("All");
  };

  const handleChanged = (updated) =>
    setRecords((prev) => prev.map((record) => (record.uuid === updated.uuid ? updated : record)));

  const handleRemoved = (uuid) => setRecords((prev) => prev.filter((record) => record.uuid !== uuid));

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Employee Onboarding</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Track new joiners through offer, documents, system access and induction.
          </p>
        </div>
        {!isFormOpen && !loadError && (
          <Button onClick={() => setIsFormOpen(true)} disabled={isLoading}>
            Start Onboarding
          </Button>
        )}
      </div>

      {isFormOpen && (
        <StartOnboardingForm
          roles={roles}
          onCreated={handleCreated}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {isLoading ? (
        <Loader label="Loading onboarding records…" />
      ) : loadError ? (
        <ErrorState title="Couldn't load onboarding" description={loadError} onRetry={retry} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No one is being onboarded yet"
          description="Start onboarding for a new joiner to create their checklist."
          action={!isFormOpen && <Button onClick={() => setIsFormOpen(true)}>Start Onboarding</Button>}
        />
      ) : (
        <>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={filter === option}
                onClick={() => setFilter(option)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  filter === option
                    ? "border-[#000052] bg-[#000052] text-white"
                    : "border-cm-border bg-cm-card text-cm-text hover:border-[#000052]/30"
                }`}
              >
                {option} ({counts[option] ?? 0})
              </button>
            ))}
          </div>

          {visibleRecords.length === 0 ? (
            <EmptyState title={`No ${filter.toLowerCase()} onboarding`} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        </>
      )}
    </div>
  );
}

export default EmployeeOnboarding;
