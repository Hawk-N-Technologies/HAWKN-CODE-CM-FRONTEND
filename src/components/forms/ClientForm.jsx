import { useForm } from "react-hook-form";
import { useEffect } from "react";
import Input from "../common/Input";
import Select from "../common/Select";
import Button from "../common/Button";
import { required, EMAIL_PATTERN } from "../../utils/validators";
import { INDUSTRIES, CLIENT_STATUSES } from "../../data/clients";

const EMPTY_VALUES = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  industry: "",
  status: "Lead",
};

/**
 * Add/edit form for a single client record. Used by CreateClient.jsx
 * (add mode) and ClientDetails.jsx (edit mode, via `initialValues`).
 */
function ClientForm({ initialValues, onSubmit, onCancel, isSaving = false }) {
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Company Name"
          required
          error={errors.companyName?.message}
          {...register("companyName", { required: required("Company name") })}
        />
        <Input
          label="Contact Person"
          required
          error={errors.contactName?.message}
          {...register("contactName", { required: required("Contact person") })}
        />
        <Input
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register("email", { required: required("Email"), pattern: EMAIL_PATTERN })}
        />
        <Input
          label="Phone"
          type="tel"
          required
          error={errors.phone?.message}
          {...register("phone", { required: required("Phone") })}
        />
        <Input
          label="City"
          required
          error={errors.city?.message}
          {...register("city", { required: required("City") })}
        />
        <Select
          label="Industry"
          required
          options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
          error={errors.industry?.message}
          {...register("industry", { required: required("Industry") })}
        />
        <Select
          label="Status"
          required
          options={CLIENT_STATUSES.map((s) => ({ value: s, label: s }))}
          error={errors.status?.message}
          {...register("status", { required: required("Status") })}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-cm-border pt-4">
        <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSaving}>
          {initialValues ? "Save Changes" : "Add Client"}
        </Button>
      </div>
    </form>
  );
}

export default ClientForm;