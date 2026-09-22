import { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";
import { required } from "../../utils/validators";
import { EMAIL_PATTERN } from "../../utils/validators";

/**
 * Admin -> Company Profile (BRD 2.1: identity, mission/vision, story).
 *
 * No backend yet, so `save()` just simulates a round trip. Swap it for a
 * real API call once one exists — the form itself won't need to change.
 * Common Policies is a separate page (pages/admin/CompanyPolicies.jsx,
 * still a stub) since the BRD treats policies as its own thing.
 */
const DEFAULT_VALUES = {
  officialName: "Hawk'N Technologies",
  officialEmail: "hello@hawkn.dev",
  vision: "",
  mission: "",
  whatPeopleShouldKnow: "",
  whyCustomersShouldCare: "",
  cultureAndValues: "",
  companyStory: "",
};

function CompanyProfile() {
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ defaultValues: DEFAULT_VALUES });

  const onSubmit = async (values) => {
    setIsSaving(true);
    try {
      // TODO: replace with a real save once the backend exists.
      await new Promise((resolve) => setTimeout(resolve, 600));
      reset(values); // clears isDirty, keeps the values just saved
      showToast.success("Company profile updated.");
    } catch {
      showToast.error("Couldn't save the company profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Company Profile</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          This information represents the company internally and externally.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Official Company Name"
            required
            error={errors.officialName?.message}
            {...register("officialName", { required: required("Company name") })}
          />
          <Input
            label="Official Email"
            type="email"
            required
            error={errors.officialEmail?.message}
            {...register("officialEmail", {
              required: required("Official email"),
              pattern: EMAIL_PATTERN,
            })}
          />
        </div>

        <Input
          label="Vision"
          multiline
          rows={3}
          placeholder="Where the company is headed…"
          helperText="Shown to employees and, in a limited form, to clients."
          error={errors.vision?.message}
          {...register("vision")}
        />

        <Input
          label="Mission"
          multiline
          rows={3}
          placeholder="How the company gets there…"
          error={errors.mission?.message}
          {...register("mission")}
        />

        <Input
          label="What People Should Know About Us"
          multiline
          rows={3}
          error={errors.whatPeopleShouldKnow?.message}
          {...register("whatPeopleShouldKnow")}
        />

        <Input
          label="Why Customers Should Care About Us"
          multiline
          rows={3}
          error={errors.whyCustomersShouldCare?.message}
          {...register("whyCustomersShouldCare")}
        />

        <Input
          label="Culture & Values"
          multiline
          rows={3}
          error={errors.cultureAndValues?.message}
          {...register("cultureAndValues")}
        />

        <Input
          label="Company Story"
          multiline
          rows={5}
          helperText="Accessible to both employees and customers."
          error={errors.companyStory?.message}
          {...register("companyStory")}
        />

        <div className="flex items-center justify-end gap-3 border-t border-cm-border pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isSaving}
            onClick={() => reset(DEFAULT_VALUES)}
          >
            Reset
          </Button>
          <Button type="submit" loading={isSaving} disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CompanyProfile;