import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../components/common/Button";
import RichTextEditor from "../../components/common/RichTextEditor";
import { showToast } from "../../components/common/Toast";
import axios from "axios";

const DEFAULT_VALUES = {
  leavePolicy: `
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

  attendancePolicy: ``,
  codeOfConduct: ``,
  dataSecurityPolicy: ``,
};

function CompanyPolicies() {
  const [isSaving, setIsSaving] = useState(false);

  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const leavePolicy = watch("leavePolicy");
  const attendancePolicy = watch("attendancePolicy");
  const codeOfConduct = watch("codeOfConduct");
  const dataSecurityPolicy = watch("dataSecurityPolicy");

  const onSubmit = async (values) => {
    setIsSaving(true);

    try {
      await axios.put(
        `/api/company/policies/${values.uuid}`,
        {
          leavePolicy: values.leavePolicy,
          attendancePolicy: values.attendancePolicy,
          codeOfConduct: values.codeOfConduct,
          dataSecurityPolicy: values.dataSecurityPolicy,
        },
        {
          withCredentials: true,
        },
      );

      showToast.success("Company policies updated.");
    } catch (error) {
      console.error(error);
      showToast.error("Couldn't save company policies. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getPolicies = async () => {
    try {
      const res = await axios.get("/api/company/policies", {
        withCredentials: true,
      });

      const data = res.data.data;

      console.log("Policy response:", data);

      setValue("uuid", data.uuid);
      setValue("leavePolicy", data.leavePolicy || "");
      setValue("attendancePolicy", data.attendancePolicy || "");
      setValue("codeOfConduct", data.codeOfConduct || "");
      setValue("dataSecurityPolicy", data.dataSecurityPolicy || "");
    } catch (error) {
      console.error("Get policies failed:", error);
      showToast.error("Couldn't load company policies.");
    }
  };

  useEffect(() => {
    getPolicies();
  }, []);
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
            value={dataSecurityPolicy}
            onChange={(content) =>
              setValue("dataSecurityPolicy", content, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <RichTextEditor
            label="Policies"
            value={leavePolicy}
            onChange={(content) =>
              setValue("leavePolicy", content, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <RichTextEditor
            label="Policies"
            value={attendancePolicy}
            onChange={(content) =>
              setValue("attendancePolicy", content, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          
          <RichTextEditor
            label="Policies"
            value={codeOfConduct}
            onChange={(content) =>
              setValue("codeOfConduct", content, {
                shouldDirty: true,
                shouldValidate: true,
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
