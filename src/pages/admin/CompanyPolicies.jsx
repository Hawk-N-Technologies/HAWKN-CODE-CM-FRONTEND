import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../components/common/Button";
import RichTextEditor from "../../components/common/RichTextEditor";
import { showToast } from "../../components/common/Toast";

const DEFAULT_VALUES = {
  policies: `
    <h2>Leave Policy</h2>
    <p>
      Employees are required to follow the company's leave request and
      approval process. Leave should be requested in advance whenever possible.
    </p>

    <h2>Attendance Policy</h2>
    <p>
      Employees are expected to maintain regular attendance and follow the
      company's working hours and attendance procedures.
    </p>

    <h2>Code of Conduct</h2>
    <p>
      All employees are expected to maintain professional behavior,
      respect colleagues, and follow company rules and standards.
    </p>

    <h2>Data &amp; Security Policy</h2>
    <p>
      Company information, client information, credentials, and other
      confidential data must be handled securely and responsibly.
    </p>
  `,
};

function CompanyPolicies() {
  const [isSaving, setIsSaving] = useState(false);

  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const policies = watch("policies");

  const onSubmit = async (values) => {
    setIsSaving(true);

    try {
      // TODO: Replace with real API call.
      await new Promise((resolve) => setTimeout(resolve, 600));

      console.log("Company Policies:", values.policies);

      showToast.success("Company policies updated.");
    } catch {
      showToast.error("Couldn't save company policies. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cm-text">Company Policies</h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          Manage common company policies using the editor below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Policies */}
        <section className="rounded-cm-lg border border-cm-border bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-cm-border pb-4">
            <h2 className="text-lg font-semibold text-cm-text">
              Company Policies
            </h2>

            <p className="mt-1 text-sm text-cm-text-muted">
              Add or update company policies, rules, and guidelines.
            </p>
          </div>

          <RichTextEditor
            label="Policies"
            value={policies}
            onChange={(content) =>
              setValue("policies", content, {
                shouldDirty: true,
              })
            }
          />
        </section>

        {/* Save */}
        <div className="flex justify-end border-t border-cm-border pt-4">
          <Button type="submit" loading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CompanyPolicies;
