import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  FileText,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  UserRoundCheck,
  BriefcaseBusiness,
  FlaskConical,
  Handshake,
} from "lucide-react";

import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import RichTextEditor from "../../components/common/RichTextEditor";
import { showToast } from "../../components/common/Toast";

const DEFAULT_VALUES = {
  uuid: "",
  admin: `
    <h2>Admin</h2>
    <p>Responsible for overall administration, system management, user management, and maintaining proper access and permissions.</p>
    <ul>
      <li>Manage users and system access.</li>
      <li>Maintain administrative settings.</li>
      <li>Manage permissions.</li>
      <li>Monitor internal systems.</li>
    </ul>
  `,
  hr: `
    <h2>HR</h2>
    <p>Responsible for recruitment, employee management, workplace policies, and employee support.</p>
    <ul>
      <li>Manage recruitment and onboarding.</li>
      <li>Maintain employee records.</li>
      <li>Manage leave and attendance.</li>
      <li>Support employee-related concerns.</li>
    </ul>
  `,
  bde: `
    <h2>Business Development</h2>
    <p>Responsible for identifying business opportunities, generating leads, and maintaining relationships with clients.</p>
    <ul>
      <li>Generate new business opportunities.</li>
      <li>Communicate with prospective clients.</li>
      <li>Maintain client relationships.</li>
      <li>Support proposals and negotiations.</li>
    </ul>
  `,
  tester: `
    <h2>Tester</h2>
    <p>Responsible for testing applications and ensuring that software meets functional and quality requirements.</p>
    <ul>
      <li>Create and execute test cases.</li>
      <li>Identify and report bugs.</li>
      <li>Perform functional and regression testing.</li>
      <li>Verify bug fixes.</li>
    </ul>
  `,
  developer: `
    <h2>Developer</h2>
    <p>Responsible for developing, maintaining, and improving software applications according to project requirements.</p>
    <ul>
      <li>Develop application features.</li>
      <li>Write clean and maintainable code.</li>
      <li>Fix bugs and technical issues.</li>
      <li>Collaborate with the project team.</li>
    </ul>
  `,
  client: "",
  projectLead: `
    <h2>Project Lead</h2>
    <p>Responsible for project planning, team coordination, task assignment, progress tracking, and client communication.</p>
    <ul>
      <li>Plan and coordinate projects.</li>
      <li>Assign tasks to team members.</li>
      <li>Monitor project progress.</li>
      <li>Communicate with clients and stakeholders.</li>
    </ul>
  `,
};

const ROLE_SECTIONS = [
  {
    id: "admin",
    field: "admin",
    title: "Administrator",
    label: "ADMIN",
    description: "System administration, user access, and permissions.",
    icon: ShieldCheck,
    number: "01",
  },
  {
    id: "hr",
    field: "hr",
    title: "Human Resources",
    label: "HR",
    description: "Recruitment, employee records, leave, and attendance.",
    icon: Users,
    number: "02",
  },
  {
    id: "bde",
    field: "bde",
    title: "Business Development",
    label: "BDE",
    description:
      "Business opportunities, lead generation, and client relationships.",
    icon: BriefcaseBusiness,
    number: "03",
  },
  {
    id: "projectLead",
    field: "projectLead",
    title: "Project Lead",
    label: "PROJECT LEAD",
    description: "Project planning, task coordination, and delivery oversight.",
    icon: UserRoundCheck,
    number: "04",
  },
  {
    id: "developer",
    field: "developer",
    title: "Developer",
    label: "DEVELOPER",
    description:
      "Software development, maintenance, and technical improvements.",
    icon: Code2,
    number: "05",
  },
  {
    id: "tester",
    field: "tester",
    title: "Quality Assurance",
    label: "TESTER",
    description: "Test execution, defect reporting, and quality verification.",
    icon: FlaskConical,
    number: "06",
  },
  {
    id: "client",
    field: "client",
    title: "Client",
    label: "CLIENT",
    description:
      "Document the client role, expectations, and collaboration boundaries.",
    icon: Handshake,
    number: "07",
  },
];

const PANEL =
  "rounded-2xl border border-[#d8e2ef] bg-[#f8faff] shadow-[0_3px_14px_rgba(20,40,75,0.035)]";

const SOFT_PANEL = "rounded-xl border border-[#d8e2ef] bg-[#eef3fa]/70";

function SectionHeading({ icon: Icon, eyebrow, title, description, number }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#71819b]">
          Role {number}
        </p>
        <h2 className="text-sm font-semibold text-cm-navy-950 sm:text-base">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#71819b] sm:text-[13px]">
          {description}
        </p>
      </div>

      <span className="hidden rounded-lg border border-[#d8e2ef] bg-[#eef3fa] px-2.5 py-1 text-[10px] font-semibold text-[#71819b] sm:inline-flex">
        {number}
      </span>
    </div>
  );
}

function RolesResponsibilities() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const savedValuesRef = useRef(DEFAULT_VALUES);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const values = watch();

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const response = await axios.get("/api/company/roles-responsibilities", {
        withCredentials: true,
      });

      const data = response.data?.data;

      if (!data) {
        throw new Error("Roles and responsibilities data is missing.");
      }

      const profile = {
        uuid: data.uuid ?? "",
        admin: data.admin ?? "",
        hr: data.hr ?? "",
        bde: data.bde ?? "",
        tester: data.tester ?? "",
        developer: data.developer ?? "",
        client: data.client ?? "",
        projectLead: data.projectLead ?? "",
      };

      savedValuesRef.current = profile;
      reset(profile);
    } catch (error) {
      console.error("Failed to load roles and responsibilities:", error);
      setLoadError(true);
      showToast.error(
        "Couldn't load roles and responsibilities. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const onSubmit = async (formValues) => {
    if (!formValues.uuid) {
      showToast.error(
        "Role configuration ID is missing. Reload the page and try again.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        admin: formValues.admin ?? "",
        hr: formValues.hr ?? "",
        bde: formValues.bde ?? "",
        tester: formValues.tester ?? "",
        developer: formValues.developer ?? "",
        client: formValues.client ?? "",
        projectLead: formValues.projectLead ?? "",
      };

      await axios.put(
        `/api/company/roles-responsibilities/${formValues.uuid}`,
        payload,
        { withCredentials: true },
      );

      const savedValues = {
        ...formValues,
        ...payload,
      };

      savedValuesRef.current = savedValues;
      reset(savedValues);

      showToast.success("Roles and responsibilities updated successfully.");
    } catch (error) {
      console.error("Failed to update roles and responsibilities:", error);

      showToast.error(
        error.response?.data?.message ||
          "Couldn't save roles and responsibilities. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    reset(savedValuesRef.current);
    showToast.success("Unsaved changes discarded.");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] flex-col gap-6">
        <div className="space-y-2">
          <div className="h-7 w-64 animate-pulse rounded-lg bg-[#e4ebf5]" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[#e4ebf5]" />
        </div>

        <div className={`${PANEL} flex flex-1 items-center justify-center`}>
          <Loader
            context="section"
            label="Loading roles and responsibilities..."
          />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <section
        className={`${PANEL} flex min-h-[45vh] flex-col items-center justify-center px-6 py-12 text-center`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
          <Users size={26} />
        </div>

        <h2 className="mt-4 text-base font-semibold text-cm-navy-950">
          Couldn't load role information
        </h2>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[#71819b]">
          Your role configuration couldn't be retrieved. Check your connection
          and try again.
        </p>

        <div className="mt-5">
          <Button type="button" onClick={loadRoles}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6 pb-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-[#71819b]"
      >
        <span>Settings</span>
        <ChevronRight size={13} />
        <span className="font-medium text-cm-navy-950">
          Roles & Responsibilities
        </span>
      </nav>

      {/* Page heading */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-[#f8faff] text-cm-navy-950 shadow-sm">
            <Users size={26} strokeWidth={1.7} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-cm-navy-950 sm:text-[28px]">
                Roles & Responsibilities
              </h1>
              <Badge tone="info" size="sm">
                Organization
              </Badge>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71819b]">
              Define role expectations, clarify ownership, and keep team
              responsibilities consistent across your organization.
            </p>
          </div>
        </div>

        <div className="flex w-fit items-center gap-2.5 rounded-xl border border-[#d8e2ef] bg-[#f8faff] px-3.5 py-2.5">
          <span
            className={[
              "h-2 w-2 rounded-full",
              isDirty ? "bg-amber-500" : "bg-cm-blue-600",
            ].join(" ")}
          />
          <span className="text-xs font-medium text-cm-navy-950">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>
      </header>

      {/* Overview banner */}
      <section className={`${PANEL} relative isolate overflow-hidden`}>
        <div className="relative z-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
            <BookOpen size={27} strokeWidth={1.6} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71819b]">
              Team structure
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-cm-navy-950 sm:text-xl">
              Clear roles. Better collaboration.
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#71819b] sm:text-[13px]">
              Maintain a central reference for responsibilities, permissions,
              expectations, and team collaboration.
            </p>
          </div>

          <div className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-[#d8e2ef] bg-[#eef3fa] px-3 py-2.5">
            <Users size={16} className="text-cm-navy-950" />
            <span className="text-xs font-medium text-cm-navy-950">
              7 role profiles
            </span>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 -z-0 h-56 w-56 rounded-full border border-[#d8e2ef]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-12 -z-0 h-40 w-40 rounded-full border border-[#d8e2ef]"
        />
      </section>

      {/* Editor and sidebar */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"
      >
        <div className="flex min-w-0 flex-col gap-5">
          {ROLE_SECTIONS.map(
            ({ id, field, title, label, description, icon, number }) => {
              const Icon = icon;

              return (
                <section
                  key={field}
                  id={id}
                  className={`${PANEL} min-w-0 scroll-mt-6`}
                >
                  <div className="border-b border-[#d8e2ef] p-5 sm:p-6">
                    <SectionHeading
                      icon={Icon}
                      eyebrow={`Role ${number}`}
                      title={title}
                      description={description}
                      number={number}
                    />
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#71819b]">
                        Responsibilities editor
                      </span>

                      <span className="rounded-lg border border-[#d8e2ef] bg-[#eef3fa] px-2 py-1 text-[10px] font-semibold text-cm-navy-950">
                        {label}
                      </span>
                    </div>

                    <RichTextEditor
                      label={`${title} responsibilities`}
                      value={values[field] ?? ""}
                      onChange={(content) =>
                        setValue(field, content, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                </section>
              );
            },
          )}

          {/* Sticky save bar */}
          <div className="sticky bottom-3 z-20 rounded-2xl border border-[#d2deed] bg-[#f8faff]/95 p-3 shadow-[0_8px_30px_rgba(20,40,75,0.10)] backdrop-blur-md sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 px-1">
                {isDirty ? (
                  <Clock3
                    size={15}
                    className="mt-0.5 shrink-0 text-[#71819b]"
                  />
                ) : (
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0 text-cm-blue-600"
                  />
                )}

                <div>
                  <p className="text-xs font-semibold text-cm-navy-950">
                    {isDirty
                      ? "Changes not saved"
                      : "Responsibilities are up to date"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#71819b]">
                    {isDirty
                      ? "Save your edits to update the role configuration."
                      : "No unsaved changes."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isDirty || isSaving}
                  onClick={() => {
                    reset(savedValuesRef.current);
                    showToast.success("Unsaved changes discarded.");
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <RotateCcw size={14} />
                    Discard
                  </span>
                </Button>

                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={!isDirty || isSaving}
                >
                  <span className="inline-flex items-center gap-2">
                    {!isSaving && <Save size={15} />}
                    Save changes
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-6">
          <section className={`${PANEL} p-5`}>
            <h2 className="text-sm font-semibold text-cm-navy-950">
              Role directory
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#71819b]">
              Jump directly to any role's responsibilities.
            </p>

            <nav className="mt-4 flex flex-col gap-1">
              {ROLE_SECTIONS.map(({ id, title, icon, number }) => {
                const Icon = icon;

                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="group flex items-center gap-3 rounded-xl px-2.5 py-3 text-[#71819b] transition-colors hover:bg-[#eaf1fb] hover:text-cm-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue-600"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d8e2ef] bg-[#eef3fa] text-cm-navy-950 group-hover:bg-[#f8faff]">
                      <Icon size={15} />
                    </span>

                    <span className="min-w-0 flex-1 text-xs font-medium">
                      {title}
                    </span>

                    <span className="text-[10px] text-[#71819b]">{number}</span>
                  </a>
                );
              })}
            </nav>
          </section>

          <section className={`${PANEL} p-5`}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
                <Check size={17} />
              </div>

              <h2 className="text-sm font-semibold text-cm-navy-950">
                Documentation tips
              </h2>
            </div>

            <ul className="mt-4 space-y-3">
              {[
                "Define clear ownership for each role.",
                "Use specific, actionable responsibilities.",
                "Keep role expectations consistent.",
                "Review documentation as your team evolves.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <Check
                    size={14}
                    className="mt-0.5 shrink-0 text-cm-navy-950"
                  />
                  <span className="text-xs leading-5 text-[#71819b]">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#d8e2ef] bg-[#eaf1fb]/70 p-5">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-cm-navy-950" />
              <h2 className="text-sm font-semibold text-cm-navy-950">
                Keep it organized
              </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#71819b]">
              Keep each editor focused on its own role. Clear documentation
              helps employees understand responsibilities and collaborate
              effectively.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}

export default RolesResponsibilities;
