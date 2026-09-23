import { useForm } from "react-hook-form";
import { useEffect } from "react";
import Input from "../common/Input";
import Select from "../common/Select";
import Button from "../common/Button";
import { required, EMAIL_PATTERN } from "../../utils/validators";
import { DEPARTMENTS, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from "../../data/employees";

const EMPTY_VALUES = {
  name: "",
  email: "",
  designation: "",
  department: "",
  employmentType: "",
  joinDate: "",
  status: "Active",
};

/**
 * Add/edit form for a single employee record. Shared by Admin's
 * People Management now, and HR's Employees page later — both manage
 * the same underlying record shape (src/data/employees.js).
 *
 * `initialValues` omitted -> "add" mode. Passed -> "edit" mode, and
 * the form resets to those values (including when a different row's
 * Edit is clicked while this form is already open).
 */
function EmployeeForm({ initialValues, onSubmit, onCancel, isSaving = false }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: initialValues ?? EMPTY_VALUES });

  useEffect(() => {
    reset(initialValues ?? EMPTY_VALUES);
  }, [initialValues, reset]);

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-cm-text">
        {initialValues ? "Edit Employee" : "Add Employee"}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Full Name"
          required
          error={errors.name?.message}
          {...register("name", { required: required("Name") })}
        />
        <Input
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register("email", { required: required("Email"), pattern: EMAIL_PATTERN })}
        />
        <Input
          label="Designation"
          required
          error={errors.designation?.message}
          {...register("designation", { required: required("Designation") })}
        />
        <Select
          label="Department"
          required
          options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          error={errors.department?.message}
          {...register("department", { required: required("Department") })}
        />
        <Select
          label="Employment Type"
          required
          options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t }))}
          error={errors.employmentType?.message}
          {...register("employmentType", { required: required("Employment type") })}
        />
        <Input
          label="Join Date"
          type="date"
          required
          error={errors.joinDate?.message}
          {...register("joinDate", { required: required("Join date") })}
        />
        <Select
          label="Status"
          required
          options={EMPLOYEE_STATUSES.map((s) => ({ value: s, label: s }))}
          error={errors.status?.message}
          {...register("status", { required: required("Status") })}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-cm-border pt-4">
        <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSaving}>
          {initialValues ? "Save Changes" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}

export default EmployeeForm;