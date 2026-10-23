import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import RichTextEditor from "../../components/common/RichTextEditor";
import { showToast } from "../../components/common/Toast";

const DEFAULT_VALUES = {
  uuid: "",
  leavePolicy: `
    <h2>Leave Policy</h2>
    <p>Employees are required to follow the company's leave request and approval process. Leave should be requested in advance whenever possible.</p>
  `,
  attendancePolicy: `
    <h2>Attendance Policy</h2>
    <p>Employees are expected to maintain regular attendance and follow the company's working hours and attendance procedures.</p>
  `,
  codeOfConduct: `
    <h2>Code of Conduct</h2>
    <p>All employees are expected to maintain professional behavior, respect colleagues, and follow company rules and standards.</p>
  `,
  dataSecurityPolicy: `
    <h2>Data &amp; Security Policy</h2>
    <p>Company information, client information, credentials, and other confidential data must be handled securely and responsibly.</p>
  `,
};

const POLICY_SECTIONS = [
  {
    id: "leave",
    field: "leavePolicy",
    title: "Leave Policy",
    description: "Leave requests, entitlements, and approval procedures.",
    icon: Clock3,
    number: "01",
  },
  {
    id: "attendance",
    field: "attendancePolicy",
    title: "Attendance Policy",
    description: "Working hours, attendance expectations, and procedures.",
    icon: Users,
    number: "02",
  },
  {
    id: "conduct",
    field: "codeOfConduct",
    title: "Code of Conduct",
    description: "Professional behavior and workplace standards.",
    icon: ShieldCheck,
    number: "03",
  },
  {
    id: "security",
    field: "dataSecurityPolicy",
    title: "Data & Security Policy",
    description: "Confidential information, credentials, and data protection.",
    icon: BookOpen,
    number: "04",
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
          {eyebrow}
        </p>
        <h2 className="text-sm font-semibold text-cm-navy-950 sm:text-base">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#71819b] sm:text-[13px]">
          {description}
        </p>
      </div>

      {number && (
        <span className="hidden rounded-lg border border-[#d8e2ef] bg-[#eef3fa] px-2.5 py-1 text-[11px] font-semibold text-[#71819b] sm:inline-flex">
          {number}
        </span>
      )}
    </div>
  );
}

function CompanyPolicies() {
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

  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const response = await axios.get("/api/company/policies", {
        withCredentials: true,
      });

      const data = response.data?.data;

      if (!data) {
        throw new Error("Policy data is missing.");
      }

      const profile = {
        uuid: data.uuid ?? "",
        leavePolicy: data.leavePolicy ?? "",
        attendancePolicy: data.attendancePolicy ?? "",
        codeOfConduct: data.codeOfConduct ?? "",
        dataSecurityPolicy: data.dataSecurityPolicy ?? "",
      };

      savedValuesRef.current = profile;
      reset(profile);
    } catch (error) {
      console.error("Failed to load company policies:", error);
      setLoadError(true);
      showToast.error("Couldn't load company policies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const onSubmit = async (formValues) => {
    if (!formValues.uuid) {
      showToast.error(
        "Policy ID is missing. Reload the policies and try again.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        leavePolicy: formValues.leavePolicy ?? "",
        attendancePolicy: formValues.attendancePolicy ?? "",
        codeOfConduct: formValues.codeOfConduct ?? "",
        dataSecurityPolicy: formValues.dataSecurityPolicy ?? "",
      };

      await axios.put(`/api/company/policies/${formValues.uuid}`, payload, {
        withCredentials: true,
      });

      const savedValues = {
        ...formValues,
        ...payload,
      };

      savedValuesRef.current = savedValues;
      reset(savedValues);

      showToast.success("Company policies updated successfully.");
    } catch (error) {
      console.error("Failed to save company policies:", error);

      showToast.error(
        error.response?.data?.message ||
          "Couldn't save company policies. Please try again.",
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
          <div className="h-7 w-52 animate-pulse rounded-lg bg-[#e4ebf5]" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[#e4ebf5]" />
        </div>

        <div className={`${PANEL} flex flex-1 items-center justify-center`}>
          <Loader context="section" label="Loading company policies..." />
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
          <ShieldCheck size={26} />
        </div>

        <h2 className="mt-4 text-base font-semibold text-cm-navy-950">
          Couldn't load company policies
        </h2>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[#71819b]">
          Your policies couldn't be retrieved. Check your connection and try
          again.
        </p>

        <div className="mt-5">
          <Button type="button" onClick={loadPolicies}>
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
        <span className="font-medium text-cm-navy-950">Company policies</span>
      </nav>

      {/* Page heading */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-[#f8faff] text-cm-navy-950 shadow-sm">
            <ShieldCheck size={26} strokeWidth={1.7} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-cm-navy-950 sm:text-[28px]">
                Company policies
              </h1>
              <Badge tone="info" size="sm">
                Organization
              </Badge>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71819b]">
              Manage workplace guidelines, employee expectations, and company
              standards from one central place.
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

      {/* Handbook banner */}
      <section className={`${PANEL} relative isolate overflow-hidden`}>
        <div className="relative z-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
            <BookOpen size={27} strokeWidth={1.6} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71819b]">
              Employee handbook
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-cm-navy-950 sm:text-xl">
              One place for company guidelines
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#71819b] sm:text-[13px]">
              Maintain clear, consistent policies for the people across your
              organization.
            </p>
          </div>

          <div className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-[#d8e2ef] bg-[#eef3fa] px-3 py-2.5">
            <FileText size={16} className="text-cm-navy-950" />
            <span className="text-xs font-medium text-cm-navy-950">
              4 policy sections
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

      {/* Editors and sidebar */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"
      >
        <div className="flex min-w-0 flex-col gap-5">
          {POLICY_SECTIONS.map(
            ({ id, field, title, description, icon, number }) => {
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
                      eyebrow={`Policy section ${number}`}
                      title={title}
                      description={description}
                      number={number}
                    />
                  </div>

                  <div className="p-5 sm:p-6">
                    <RichTextEditor
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

          {/* Save actions */}
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
                    {isDirty ? "Changes not saved" : "Policies are up to date"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#71819b]">
                    {isDirty
                      ? "Save your edits to update the company policies."
                      : "No unsaved changes."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isDirty || isSaving}
                  onClick={discardChanges}
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

        {/* Sidebar */}
        <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-6">
          <section className={`${PANEL} p-5`}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
                <ShieldCheck size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-cm-navy-950">
                  Policy sections
                </h2>
                <p className="mt-0.5 text-[11px] text-[#71819b]">
                  Navigate to a policy
                </p>
              </div>
            </div>

            <nav className="mt-4 flex flex-col gap-1">
              {POLICY_SECTIONS.map(({ id, title, icon, number }) => {
                const Icon = icon;

                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="group flex items-center gap-3 rounded-xl px-2.5 py-3 text-sm text-[#71819b] transition-colors hover:bg-[#eaf1fb] hover:text-cm-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue-600"
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
                Before saving
              </h2>
            </div>

            <ul className="mt-4 space-y-3">
              {[
                "Use clear, descriptive headings.",
                "Keep procedures easy to understand.",
                "Review policy content before saving.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check
                    size={14}
                    className="mt-0.5 shrink-0 text-cm-navy-950"
                  />
                  <span className="text-xs leading-5 text-[#71819b]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#d8e2ef] bg-[#eaf1fb]/70 p-5">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-cm-navy-950" />
              <h2 className="text-sm font-semibold text-cm-navy-950">
                Keep it consistent
              </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#71819b]">
              Keep each policy focused on its own subject so employees can find
              and understand the relevant guidelines more easily.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}

export default CompanyPolicies;
