import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../components/common/Button";
import RichTextEditor from "../../components/common/RichTextEditor";
import { showToast } from "../../components/common/Toast";

const DEFAULT_VALUES = {
  rolesResponsibilities: `
    <h2>Admin</h2>
    <p>
      Responsible for overall administration, system management,
      user management, and maintaining proper access and permissions.
    </p>

    <ul>
      <li>Manage users and system access.</li>
      <li>Maintain administrative settings.</li>
      <li>Manage permissions.</li>
      <li>Monitor internal systems.</li>
    </ul>

    <h2>HR</h2>
    <p>
      Responsible for recruitment, employee management, workplace
      policies, and employee support.
    </p>

    <ul>
      <li>Manage recruitment and onboarding.</li>
      <li>Maintain employee records.</li>
      <li>Manage leave and attendance.</li>
      <li>Support employee-related concerns.</li>
    </ul>

    <h2>Project Lead</h2>
    <p>
      Responsible for project planning, team coordination,
      task assignment, progress tracking, and client communication.
    </p>

    <ul>
      <li>Plan and coordinate projects.</li>
      <li>Assign tasks to team members.</li>
      <li>Monitor project progress.</li>
      <li>Communicate with clients and stakeholders.</li>
    </ul>

    <h2>Developer</h2>
    <p>
      Responsible for developing, maintaining, and improving
      software applications according to project requirements.
    </p>

    <ul>
      <li>Develop application features.</li>
      <li>Write clean and maintainable code.</li>
      <li>Fix bugs and technical issues.</li>
      <li>Collaborate with the project team.</li>
    </ul>

    <h2>BD</h2>
    <p>
      Responsible for identifying business opportunities,
      generating leads, and maintaining relationships with clients.
    </p>

    <ul>
      <li>Generate new business opportunities.</li>
      <li>Communicate with prospective clients.</li>
      <li>Maintain client relationships.</li>
      <li>Support proposals and negotiations.</li>
    </ul>

    <h2>Tester</h2>
    <p>
      Responsible for testing applications and ensuring that
      software meets functional and quality requirements.
    </p>

    <ul>
      <li>Create and execute test cases.</li>
      <li>Identify and report bugs.</li>
      <li>Perform functional and regression testing.</li>
      <li>Verify bug fixes.</li>
    </ul>
  `,
};

function RolesResponsibilities() {
  const [isSaving, setIsSaving] = useState(false);

  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const rolesResponsibilities = watch("rolesResponsibilities");

  const onSubmit = async (values) => {
    setIsSaving(true);

    try {
      // TODO: Replace with real API call.
      await new Promise((resolve) => setTimeout(resolve, 600));

      console.log("Roles & Responsibilities:", values.rolesResponsibilities);

      showToast.success("Roles & responsibilities updated.");
    } catch {
      showToast.error("Couldn't save roles & responsibilities. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cm-text">
          Roles & Responsibilities
        </h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          Define the roles and responsibilities of different team members within
          the company.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Roles Editor */}
        <section className="rounded-cm-lg border border-cm-border bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-cm-border pb-4">
            <h2 className="text-lg font-semibold text-cm-text">Team Roles</h2>

            <p className="mt-1 text-sm text-cm-text-muted">
              Add the roles and responsibilities for Admin, HR, Project Lead,
              Developer, BD, Tester, and other team members.
            </p>
          </div>

          <RichTextEditor
            label="Roles & Responsibilities"
            value={rolesResponsibilities}
            onChange={(content) =>
              setValue("rolesResponsibilities", content, {
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

export default RolesResponsibilities;
