import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../components/common/Button";
import RichTextEditor from "../../components/common/RichTextEditor";
import { showToast } from "../../components/common/Toast";
import { useEditor } from "@tiptap/react";
import axios from "axios";

const DEFAULT_VALUES = {
  admin: `
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
  hr: ``,
  bde: ``,
  developer: ``,
  tester: ``,
  projectLead: ``,
  client: ``,
};

function RolesResponsibilities() {
  const [isSaving, setIsSaving] = useState(false);

  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const admin = watch("admin");
  const hr = watch("hr");
  const bde = watch("bde");
  const developer = watch("developer");
  const tester = watch("tester");
  const client = watch("client");
  const projectLead = watch("projectLead");

  const onSubmit = async (values) => {
    console.log(values);
    setIsSaving(true);

    // return;

    try {
      await axios.put(
        `/api/company/roles-responsibilities/${values.uuid}`,
        {
          admin: values.admin,
          hr: values.hr,
          bde: values.bde,
          tester: values.tester,
          developer: values.developer,
          client: values.client,
          projectLead: values.projectLead,
        },
        {
          withCredentials: true,
        },
      );

      showToast.success("Roles & responsibilities updated.");
    } catch (error) {
      console.error("Failed to update roles & responsibilities:", error);

      showToast.error(
        "Couldn't save roles & responsibilities. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleAndRes = async () => {
    try {
      const res = await axios.get("/api/company/roles-responsibilities", {
        withCredentials: true,
      });

      const data = res.data.data;

      console.log("Roles & responsibilities response:", data);

      setValue("uuid", data.uuid);
      setValue("admin", data.admin || "");
      setValue("hr", data.hr || "");
      setValue("bde", data.bde || "");
      setValue("tester", data.tester || "");
      setValue("developer", data.developer || "");
      setValue("client", data.client || "");
      setValue("projectLead", data.projectLead || "");
    } catch (error) {
      console.error("Failed to get roles & responsibilities:", error);

      showToast.error(
        "Couldn't load roles & responsibilities. Please try again.",
      );
    }
  };

  useEffect(() => {
    getRoleAndRes();
  }, []);

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
            label="ADMIN"
            value={admin}
            onChange={(content) =>
              setValue("admin", content, {
                shouldDirty: true,
              })
            }
          />
          <RichTextEditor
            label="HR"
            value={hr}
            onChange={(content) =>
              setValue("hr", content, {
                shouldDirty: true,
              })
            }
          />
          <RichTextEditor
            label="BDE"
            value={bde}
            onChange={(content) =>
              setValue("bde", content, {
                shouldDirty: true,
              })
            }
          />
          <RichTextEditor
            label="TESTER"
            value={tester}
            onChange={(content) =>
              setValue("tester", content, {
                shouldDirty: true,
              })
            }
          />
          <RichTextEditor
            label="DEVELOPER"
            value={developer}
            onChange={(content) =>
              setValue("developer", content, {
                shouldDirty: true,
              })
            }
          />
          <RichTextEditor
            label="CLIENT"
            value={client}
            onChange={(content) =>
              setValue("client", content, {
                shouldDirty: true,
              })
            }
          />
          <RichTextEditor
            label="PROJECT LEAD"
            value={projectLead}
            onChange={(content) =>
              setValue("projectLead", content, {
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
